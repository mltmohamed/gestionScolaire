const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const Module = require('node:module');
const { after, before, test } = require('node:test');

let database;
let handlers;
let testDataDirectory;

const event = { sender: { id: 3 } };

async function invoke(channel, ...args) {
  const handler = handlers.get(channel);
  assert.ok(handler, `Handler IPC absent: ${channel}`);
  return handler(event, ...args);
}

function getAcademicYear(date = new Date()) {
  const startYear = date.getMonth() >= 7 ? date.getFullYear() : date.getFullYear() - 1;
  return `${startYear}-${startYear + 1}`;
}

before(async () => {
  testDataDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'schoolmanage-dashboard-'));

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

test('calcule les indicateurs du dashboard sur une année scolaire cohérente', async () => {
  const now = new Date();
  const academicYear = getAcademicYear(now);
  const startYear = Number(academicYear.slice(0, 4));
  const previousAcademicYear = `${startYear - 1}-${startYear}`;
  const paymentDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-15`;

  const activeTeacher = database.run(
    "INSERT INTO teachers (first_name, last_name, status) VALUES (?, ?, 'active')",
    ['Aminata', 'Diallo']
  ).lastInsertRowid;
  database.run(
    "INSERT INTO teachers (first_name, last_name, status) VALUES (?, ?, 'inactive')",
    ['Moussa', 'Camara']
  );

  const currentClass = database.run(
    `INSERT INTO classes (name, level, academic_year, max_students, tuition_fee, teacher_id)
     VALUES (?, ?, ?, ?, ?, ?)`,
    ['Classe actuelle', '6e année', academicYear, 1, 120000, activeTeacher]
  ).lastInsertRowid;
  const previousClass = database.run(
    `INSERT INTO classes (name, level, academic_year, max_students, tuition_fee)
     VALUES (?, ?, ?, ?, ?)`,
    ['Classe précédente', '5e année', previousAcademicYear, 30, 90000]
  ).lastInsertRowid;

  const currentStudent = database.run(
    `INSERT INTO students (first_name, last_name, date_of_birth, matricule, class_id, status, photo)
     VALUES (?, ?, ?, ?, ?, 'active', ?)`,
    ['Fatou', 'Bah', '2014-01-10', 'DASH-001', currentClass, 'data:image/png;base64,photo']
  ).lastInsertRowid;
  const previousClassStudent = database.run(
    `INSERT INTO students (first_name, last_name, date_of_birth, matricule, class_id, status)
     VALUES (?, ?, ?, ?, ?, 'active')`,
    ['Ibrahima', 'Sylla', '2013-03-12', 'DASH-002', previousClass]
  ).lastInsertRowid;
  database.run(
    `INSERT INTO students (first_name, last_name, date_of_birth, matricule, class_id, status)
     VALUES (?, ?, ?, ?, NULL, 'active')`,
    ['Mariam', 'Condé', '2015-07-02', 'DASH-003']
  );
  database.run(
    `INSERT INTO students (first_name, last_name, date_of_birth, matricule, class_id, status)
     VALUES (?, ?, ?, ?, NULL, 'inactive')`,
    ['Ancien', 'Élève', '2012-09-18', 'DASH-004']
  );

  database.run(
    `INSERT INTO student_payments (student_id, type, amount, payment_date, academic_year)
     VALUES (?, 'tuition', ?, ?, ?)`,
    [currentStudent, 30000, paymentDate, academicYear]
  );
  database.run(
    `INSERT INTO student_payments (student_id, type, amount, payment_date, academic_year)
     VALUES (?, 'tuition', ?, ?, ?)`,
    [previousClassStudent, 70000, paymentDate, previousAcademicYear]
  );

  const result = await invoke('dashboard:getStats');
  assert.equal(result.success, true, result.error);

  const stats = result.data;
  assert.equal(stats.academicYear, academicYear);
  assert.equal(Number(stats.activeTeachers), 1);
  assert.equal(Number(stats.unassignedStudents), 2);
  assert.deepEqual(stats.classSummary, {
    totalClasses: 1,
    totalCapacity: 1,
    assignedStudents: 1,
    fullClasses: 1,
    overCapacityClasses: 0,
  });
  assert.equal(stats.classOccupancy.length, 1);
  assert.equal(Number(stats.classOccupancy[0].student_count), 1);

  assert.equal(stats.finance.tuitionExpected, 120000);
  assert.equal(stats.finance.tuitionPaid, 30000);
  assert.equal(stats.finance.tuitionRemaining, 90000);
  assert.equal(stats.finance.tuitionPaymentsThisMonth, 100000);
  assert.equal(stats.finance.tuitionPaymentCountThisMonth, 2);

  assert.ok(stats.recentStudents.length > 0);
  assert.deepEqual(
    Object.keys(stats.recentStudents[0]).sort(),
    ['class_name', 'created_at', 'enrollment_date', 'first_name', 'id', 'last_name']
  );
  assert.equal(Object.hasOwn(stats.recentStudents[0], 'photo'), false);
});
