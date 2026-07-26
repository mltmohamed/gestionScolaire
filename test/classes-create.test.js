const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const Module = require('node:module');
const { after, before, test } = require('node:test');

let database;
let handlers;
let testDataDirectory;

const event = { sender: { id: 1 } };

async function invoke(channel, ...args) {
  const handler = handlers.get(channel);
  assert.ok(handler, `Handler IPC absent: ${channel}`);
  return handler(event, ...args);
}

before(async () => {
  testDataDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'schoolmanage-classes-'));

  const originalLoad = Module._load;
  Module._load = function mockElectron(request, parent, isMain) {
    if (request === 'electron') {
      return {
        app: {
          getPath: () => testDataDirectory,
        },
        dialog: {},
      };
    }
    return originalLoad.call(this, request, parent, isMain);
  };

  try {
    database = require('../src/main/database/db');
    const setupIPCHandlers = require('../src/main/ipc-handlers');
    await database.initializeDatabase();

    handlers = new Map();
    setupIPCHandlers({
      handle(channel, handler) {
        handlers.set(channel, handler);
      },
    });
  } finally {
    Module._load = originalLoad;
  }

  const login = await invoke('auth:login', { username: 'admin', password: 'admin' });
  assert.equal(login.success, true);
});

after(() => {
  if (database) {
    database.closeDatabase();
  }
  if (testDataDirectory) {
    fs.rmSync(testDataDirectory, { recursive: true, force: true });
  }
});

test('crée une classe avec zéro, un ou deux professeurs sans état partiel', async () => {
  const firstTeacher = await invoke('teachers:create', {
    first_name: 'Aminata',
    last_name: 'Diallo',
  });
  const secondTeacher = await invoke('teachers:create', {
    first_name: 'Moussa',
    last_name: 'Camara',
  });

  assert.equal(firstTeacher.success, true);
  assert.equal(secondTeacher.success, true);
  assert.ok(firstTeacher.data.id > 0);
  assert.ok(secondTeacher.data.id > firstTeacher.data.id);

  const baseClass = {
    level: '7ème année',
    academic_year: '2026-2027',
    max_students: 30,
    teacher_id: '',
    tuition_fee: 0,
    uniform_fee: 0,
    uniform_class_fee: 0,
    uniform_sport_fee: 0,
  };

  const cases = [
    { name: 'Classe sans intervenant', teacher_ids: [], expected: [] },
    {
      name: 'Classe avec un intervenant',
      teacher_ids: [firstTeacher.data.id],
      expected: [firstTeacher.data.id],
    },
    {
      name: 'Classe avec deux intervenants',
      teacher_ids: [firstTeacher.data.id, secondTeacher.data.id],
      expected: [firstTeacher.data.id, secondTeacher.data.id],
    },
  ];

  for (const current of cases) {
    const result = await invoke('classes:create', {
      ...baseClass,
      name: current.name,
      teacher_ids: current.teacher_ids,
    });

    assert.equal(result.success, true, result.error);
    assert.ok(result.data.id > 0);

    const assignedTeacherIds = database.query(
      'SELECT teacher_id FROM class_teachers WHERE class_id = ? ORDER BY teacher_id',
      [result.data.id]
    ).map((row) => Number(row.teacher_id));
    assert.deepEqual(assignedTeacherIds, current.expected);
  }

  const classCountBeforeDuplicate = Number(
    database.query('SELECT COUNT(*) AS count FROM classes')[0].count
  );
  const duplicateResult = await invoke('classes:create', {
    ...baseClass,
    name: 'Classe avec un intervenant',
    teacher_ids: [secondTeacher.data.id],
  });

  assert.equal(duplicateResult.success, false);
  assert.match(duplicateResult.error, /existe déjà/);
  assert.equal(
    Number(database.query('SELECT COUNT(*) AS count FROM classes')[0].count),
    classCountBeforeDuplicate
  );

  const classCountBeforeFailure = Number(
    database.query('SELECT COUNT(*) AS count FROM classes')[0].count
  );
  const invalidResult = await invoke('classes:create', {
    ...baseClass,
    name: 'Classe avec professeur invalide',
    teacher_ids: [999999],
  });

  assert.equal(invalidResult.success, false);
  assert.equal(
    Number(database.query('SELECT COUNT(*) AS count FROM classes')[0].count),
    classCountBeforeFailure
  );
});

test('annule toute la transaction si une association échoue', () => {
  const classCountBeforeFailure = Number(
    database.query('SELECT COUNT(*) AS count FROM classes')[0].count
  );

  assert.throws(
    () => database.transaction(({ run }) => {
      const result = run(
        'INSERT INTO classes (name, level, academic_year) VALUES (?, ?, ?)',
        ['Classe rollback', '8ème année', '2026-2027']
      );
      run(
        'INSERT INTO class_teachers (class_id, teacher_id) VALUES (?, ?)',
        [result.lastInsertRowid, 999999]
      );
    }),
    /FOREIGN KEY constraint failed/
  );

  assert.equal(
    Number(database.query('SELECT COUNT(*) AS count FROM classes')[0].count),
    classCountBeforeFailure
  );
  assert.equal(
    Number(
      database.query(
        'SELECT COUNT(*) AS count FROM classes WHERE name = ?',
        ['Classe rollback']
      )[0].count
    ),
    0
  );
});
