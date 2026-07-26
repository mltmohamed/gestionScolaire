const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const Module = require('node:module');
const { after, before, test } = require('node:test');

let database;
let handlers;
let testDataDirectory;

const event = { sender: { id: 2 } };

async function invoke(channel, ...args) {
  const handler = handlers.get(channel);
  assert.ok(handler, `Handler IPC absent: ${channel}`);
  return handler(event, ...args);
}

before(async () => {
  testDataDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'schoolmanage-students-'));

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

test('crée et modifie un élève avec les parents, sans tuteur', async () => {
  const creation = await invoke('students:create', {
    first_name: 'Fatoumata',
    last_name: 'Traoré',
    date_of_birth: '2015-02-10',
    place_of_birth: 'Bamako',
    gender: 'F',
    matricule: 'TEST-2026-001',
    phone: '70000000',
    address: 'Quartier du Fleuve',
    father_first_name: 'Mamadou',
    father_last_name: 'Traoré',
    mother_first_name: 'Awa',
    mother_last_name: 'Coulibaly',
    father_name: 'Mamadou Traoré',
    mother_name: 'Awa Coulibaly',
    class_id: '',
    photo: null,
  });

  assert.equal(creation.success, true, creation.error);
  assert.ok(creation.data.id > 0);

  const createdStudent = database.query(
    `SELECT father_first_name, father_last_name, mother_first_name, mother_last_name
     FROM students WHERE id = ?`,
    [creation.data.id]
  )[0];
  assert.deepEqual(createdStudent, {
    father_first_name: 'Mamadou',
    father_last_name: 'Traoré',
    mother_first_name: 'Awa',
    mother_last_name: 'Coulibaly',
  });
  assert.equal(
    Number(
      database.query(
        'SELECT COUNT(*) AS count FROM guardians WHERE student_id = ?',
        [creation.data.id]
      )[0].count
    ),
    0
  );

  const modification = await invoke('students:update', creation.data.id, {
    first_name: 'Fatoumata',
    last_name: 'Traoré',
    date_of_birth: '2015-02-10',
    place_of_birth: 'Bamako',
    gender: 'F',
    matricule: 'TEST-2026-001',
    phone: '71111111',
    address: 'Quartier du Fleuve',
    father_first_name: 'Mamadou',
    father_last_name: 'Traoré',
    mother_first_name: 'Aminata',
    mother_last_name: 'Coulibaly',
    father_name: 'Mamadou Traoré',
    mother_name: 'Aminata Coulibaly',
    class_id: '',
    status: 'active',
    photo: null,
  });

  assert.equal(modification.success, true, modification.error);

  const updatedStudent = await invoke('students:getById', creation.data.id);
  assert.equal(updatedStudent.success, true);
  assert.equal(updatedStudent.data.mother_first_name, 'Aminata');
  assert.equal(updatedStudent.data.mother_last_name, 'Coulibaly');
  assert.equal(updatedStudent.data.guardian_first_name, null);
  assert.equal(updatedStudent.data.guardian_phone, null);
});

test('préserve un ancien tuteur lors de la modification des parents', async () => {
  const student = database.query(
    'SELECT id, matricule FROM students WHERE matricule = ?',
    ['TEST-2026-001']
  )[0];

  database.run(
    `INSERT INTO guardians (student_id, first_name, last_name, phone, relationship)
     VALUES (?, ?, ?, ?, ?)`,
    [student.id, 'Ancien', 'Contact', '72222222', 'Oncle']
  );

  const result = await invoke('students:update', student.id, {
    first_name: 'Fatoumata',
    last_name: 'Traoré',
    date_of_birth: '2015-02-10',
    place_of_birth: 'Bamako',
    gender: 'F',
    matricule: student.matricule,
    phone: '71111111',
    address: 'Quartier du Fleuve',
    father_first_name: 'Mamadou',
    father_last_name: 'Traoré',
    mother_first_name: 'Aminata',
    mother_last_name: 'Coulibaly',
    father_name: 'Mamadou Traoré',
    mother_name: 'Aminata Coulibaly',
    class_id: '',
    status: 'active',
    photo: null,
  });

  assert.equal(result.success, true, result.error);
  assert.deepEqual(
    database.query(
      'SELECT first_name, last_name, phone, relationship FROM guardians WHERE student_id = ?',
      [student.id]
    )[0],
    {
      first_name: 'Ancien',
      last_name: 'Contact',
      phone: '72222222',
      relationship: 'Oncle',
    }
  );
});
