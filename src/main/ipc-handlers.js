const { app, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { query, run, runMany } = require('./database/db');

function setupIPCHandlers(ipcMain) {
  const sessions = new Map();

  const SESSION_TTL_MS = 2 * 60 * 60 * 1000; // 2 heures
  const sessionFilePath = path.join(app.getPath('userData'), 'session.json');
  const settingsFilePath = path.join(app.getPath('userData'), 'settings.json');

  function now() {
    return Date.now();
  }

  function readPersistedSession() {
    try {
      if (!fs.existsSync(sessionFilePath)) return null;
      const raw = fs.readFileSync(sessionFilePath, 'utf8');
      const data = JSON.parse(raw);
      if (!data || typeof data !== 'object') return null;
      return data;
    } catch {
      return null;
    }
  }

  function writePersistedSession(data) {
    try {
      fs.mkdirSync(path.dirname(sessionFilePath), { recursive: true });
      fs.writeFileSync(sessionFilePath, JSON.stringify(data), { encoding: 'utf8' });
    } catch {
      // ignorer
    }
  }

  function clearPersistedSession() {
    try {
      if (fs.existsSync(sessionFilePath)) {
        fs.unlinkSync(sessionFilePath);
      }
    } catch {
      // ignorer
    }
  }

  function readSettings() {
    try {
      if (!fs.existsSync(settingsFilePath)) return {};
      const raw = fs.readFileSync(settingsFilePath, 'utf8');
      const data = JSON.parse(raw);
      if (!data || typeof data !== 'object') return {};
      return data;
    } catch {
      return {};
    }
  }

  function writeSettings(data) {
    try {
      fs.mkdirSync(path.dirname(settingsFilePath), { recursive: true });
      fs.writeFileSync(settingsFilePath, JSON.stringify(data), { encoding: 'utf8' });
    } catch {
      // ignorer
    }
  }

  function isExpired(expiresAt) {
    return !expiresAt || typeof expiresAt !== 'number' || expiresAt <= now();
  }

  function getSenderId(event) {
    return event && event.sender ? event.sender.id : null;
  }

  function ensureAuth(event) {
    const senderId = getSenderId(event);
    if (!senderId || !sessions.has(senderId)) {
      const error = new Error('UNAUTHORIZED');
      error.code = 'UNAUTHORIZED';
      throw error;
    }
    const session = sessions.get(senderId);
    if (session && isExpired(session.expiresAt)) {
      sessions.delete(senderId);
      const error = new Error('UNAUTHORIZED');
      error.code = 'UNAUTHORIZED';
      throw error;
    }
    return session;
  }

  function handle(channel, options, handler) {
    ipcMain.handle(channel, async (event, ...args) => {
      try {
        if (options && options.auth) {
          ensureAuth(event);
        }
        return await handler(event, ...args);
      } catch (error) {
        if (error && error.message && error.message.includes('UNIQUE constraint failed: students.matricule')) {
          return { success: false, error: 'Matricule déjà utilisé' };
        }
        if (error && (error.code === 'UNAUTHORIZED' || error.message === 'UNAUTHORIZED')) {
          return { success: false, error: 'Unauthorized' };
        }
        return { success: false, error: error && error.message ? error.message : 'Unknown error' };
      }
    });
  }

  function hashPassword(password, salt) {
    const actualSalt = salt || crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync(String(password || ''), actualSalt, 100000, 64, 'sha512').toString('hex');
    return { hash, salt: actualSalt };
  }

  function verifyPassword(password, salt, expectedHash) {
    if (!salt || !expectedHash) return false;
    const computed = crypto.pbkdf2Sync(String(password || ''), salt, 100000, 64, 'sha512').toString('hex');
    try {
      return crypto.timingSafeEqual(Buffer.from(computed, 'hex'), Buffer.from(String(expectedHash), 'hex'));
    } catch {
      return false;
    }
  }

  // ==================== AUTH ====================
  handle('auth:getSession', { auth: false }, (event) => {
    const senderId = getSenderId(event);
    if (!senderId) {
      return { success: true, data: null };
    }

    const inMemory = sessions.get(senderId);
    if (inMemory && !isExpired(inMemory.expiresAt)) {
      return { success: true, data: inMemory.user };
    }

    const persisted = readPersistedSession();
    if (!persisted || isExpired(persisted.expiresAt) || !persisted.user) {
      if (persisted && isExpired(persisted.expiresAt)) {
        clearPersistedSession();
      }
      return { success: true, data: null };
    }

    // Restaurer la session en mémoire pour ce renderer
    sessions.set(senderId, { user: persisted.user, expiresAt: persisted.expiresAt, token: persisted.token || null });
    return { success: true, data: persisted.user };
  });

  handle('auth:login', { auth: false }, (event, { username, password } = {}) => {
    const u = String(username || '').trim();
    const p = String(password || '');
    if (!u || !p) {
      return { success: false, error: 'Identifiants incorrects' };
    }

    const rows = query('SELECT id, username, role, password_hash, password_salt FROM users WHERE username = ? LIMIT 1', [u]);
    const userRow = rows && rows[0];
    if (!userRow) {
      return { success: false, error: 'Identifiants incorrects' };
    }
    const ok = verifyPassword(p, userRow.password_salt, userRow.password_hash);
    if (!ok) {
      return { success: false, error: 'Identifiants incorrects' };
    }

    const userData = { id: userRow.id, username: userRow.username, role: userRow.role || 'administrator' };
    const senderId = getSenderId(event);
    if (senderId) {
      const token = crypto.randomBytes(32).toString('hex');
      const expiresAt = now() + SESSION_TTL_MS;
      sessions.set(senderId, { user: userData, token, expiresAt });
      writePersistedSession({ user: userData, token, expiresAt });
    }
    return { success: true, data: userData };
  });

  handle('auth:changePassword', { auth: true }, (event, { currentPassword, newPassword } = {}) => {
    const session = ensureAuth(event);
    const userId = session && session.user ? session.user.id : null;
    if (!userId) {
      return { success: false, error: 'Unauthorized' };
    }

    const current = String(currentPassword || '');
    const next = String(newPassword || '');
    if (!current || !next) {
      return { success: false, error: 'Champs obligatoires' };
    }
    if (next.length < 6) {
      return { success: false, error: 'Le nouveau mot de passe doit contenir au moins 6 caractères' };
    }

    const rows = query('SELECT id, password_hash, password_salt FROM users WHERE id = ? LIMIT 1', [userId]);
    const userRow = rows && rows[0];
    if (!userRow) {
      return { success: false, error: 'Utilisateur introuvable' };
    }
    const ok = verifyPassword(current, userRow.password_salt, userRow.password_hash);
    if (!ok) {
      return { success: false, error: 'Mot de passe actuel incorrect' };
    }

    const { hash, salt } = hashPassword(next);
    run(
      'UPDATE users SET password_hash = ?, password_salt = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [hash, salt, userId]
    );
    return { success: true };
  });

  handle('auth:logout', { auth: false }, (event) => {
    const senderId = getSenderId(event);
    if (senderId) {
      sessions.delete(senderId);
    }
    clearPersistedSession();
    return { success: true };
  });

  // ==================== SETTINGS ====================
  handle('settings:getProfile', { auth: false }, () => {
    const settings = readSettings();
    const profile = settings && settings.profile && typeof settings.profile === 'object' ? settings.profile : null;
    return { success: true, data: profile };
  });

  handle('settings:setProfile', { auth: false }, (event, profile) => {
    const safe = profile && typeof profile === 'object' ? profile : {};
    const settings = readSettings();
    const next = { ...settings, profile: safe };
    writeSettings(next);
    return { success: true };
  });

  // ==================== DATA (EXPORT / IMPORT) ====================
  handle('data:export', { auth: true }, async (event) => {
    const senderWindow = event && event.sender ? require('electron').BrowserWindow.fromWebContents(event.sender) : null;
    const { canceled, filePath } = await dialog.showSaveDialog(senderWindow || undefined, {
      title: 'Exporter les données',
      defaultPath: `schoolmanage-backup-${new Date().toISOString().slice(0, 10)}.json`,
      filters: [{ name: 'JSON', extensions: ['json'] }],
    });

    if (canceled || !filePath) {
      return { success: false, error: 'Cancelled' };
    }

    const payload = {
      version: 1,
      exportedAt: new Date().toISOString(),
      data: {
        classes: query('SELECT * FROM classes'),
        students: query('SELECT * FROM students'),
        guardians: query('SELECT * FROM guardians'),
        teachers: query('SELECT * FROM teachers'),
        subjects: query('SELECT * FROM subjects'),
        grades: query('SELECT * FROM grades'),
        student_payments: query('SELECT * FROM student_payments'),
        teacher_payments: query('SELECT * FROM teacher_payments'),
      },
    };

    fs.writeFileSync(filePath, JSON.stringify(payload, null, 2), 'utf8');
    return { success: true, data: { filePath } };
  });

  handle('data:import', { auth: true }, async (event) => {
    const senderWindow = event && event.sender ? require('electron').BrowserWindow.fromWebContents(event.sender) : null;
    const { canceled, filePaths } = await dialog.showOpenDialog(senderWindow || undefined, {
      title: 'Importer des données',
      properties: ['openFile'],
      filters: [{ name: 'JSON', extensions: ['json'] }],
    });

    if (canceled || !filePaths || !filePaths[0]) {
      return { success: false, error: 'Cancelled' };
    }

    const filePath = filePaths[0];
    const raw = fs.readFileSync(filePath, 'utf8');
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return { success: false, error: 'Fichier JSON invalide' };
    }

    const data = parsed && parsed.data ? parsed.data : null;
    if (!data || typeof data !== 'object') {
      return { success: false, error: 'Format de sauvegarde invalide' };
    }

    const getArr = (k) => (Array.isArray(data[k]) ? data[k] : []);
    const classes = getArr('classes');
    const students = getArr('students');
    const guardians = getArr('guardians');
    const teachers = getArr('teachers');
    const subjects = getArr('subjects');
    const grades = getArr('grades');
    const studentPayments = getArr('student_payments');
    const teacherPayments = getArr('teacher_payments');

    const statements = [];
    // Nettoyer les tables métier (ne touche pas users)
    statements.push({ sql: 'DELETE FROM grades' });
    statements.push({ sql: 'DELETE FROM student_payments' });
    statements.push({ sql: 'DELETE FROM teacher_payments' });
    statements.push({ sql: 'DELETE FROM guardians' });
    statements.push({ sql: 'DELETE FROM students' });
    statements.push({ sql: 'DELETE FROM subjects' });
    statements.push({ sql: 'DELETE FROM classes' });
    statements.push({ sql: 'DELETE FROM teachers' });

    // Important: insérer dans un ordre compatible avec les FKs
    for (const t of teachers) {
      statements.push({
        sql: `INSERT INTO teachers (id, first_name, last_name, email, phone, address, specialty, hire_date, status, gender, photo, created_at, updated_at)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, COALESCE(?, CURRENT_TIMESTAMP), COALESCE(?, CURRENT_TIMESTAMP))`,
        params: [
          t.id,
          t.first_name,
          t.last_name,
          t.email,
          t.phone,
          t.address,
          t.specialty,
          t.hire_date,
          t.status,
          t.gender,
          t.photo,
          t.created_at,
          t.updated_at,
        ],
      });
    }

    for (const c of classes) {
      statements.push({
        sql: `INSERT INTO classes (id, name, level, academic_year, max_students, teacher_id, created_at, updated_at)
              VALUES (?, ?, ?, ?, ?, ?, COALESCE(?, CURRENT_TIMESTAMP), COALESCE(?, CURRENT_TIMESTAMP))`,
        params: [c.id, c.name, c.level, c.academic_year, c.max_students, c.teacher_id, c.created_at, c.updated_at],
      });
    }

    for (const s of students) {
      statements.push({
        sql: `INSERT INTO students (id, first_name, last_name, date_of_birth, gender, matricule, email, phone, address, class_id, enrollment_date, status, photo, created_at, updated_at)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, COALESCE(?, CURRENT_TIMESTAMP), COALESCE(?, CURRENT_TIMESTAMP))`,
        params: [
          s.id,
          s.first_name,
          s.last_name,
          s.date_of_birth,
          s.gender,
          s.matricule,
          s.email,
          s.phone,
          s.address,
          s.class_id,
          s.enrollment_date,
          s.status,
          s.photo,
          s.created_at,
          s.updated_at,
        ],
      });
    }

    for (const g of guardians) {
      statements.push({
        sql: `INSERT INTO guardians (id, student_id, first_name, last_name, phone, address, job, relationship, created_at, updated_at)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, COALESCE(?, CURRENT_TIMESTAMP), COALESCE(?, CURRENT_TIMESTAMP))`,
        params: [
          g.id,
          g.student_id,
          g.first_name,
          g.last_name,
          g.phone,
          g.address,
          g.job,
          g.relationship,
          g.created_at,
          g.updated_at,
        ],
      });
    }

    for (const sub of subjects) {
      statements.push({
        sql: `INSERT INTO subjects (id, name, code, description, coefficient, created_at)
              VALUES (?, ?, ?, ?, ?, COALESCE(?, CURRENT_TIMESTAMP))`,
        params: [sub.id, sub.name, sub.code, sub.description, sub.coefficient, sub.created_at],
      });
    }

    for (const gr of grades) {
      statements.push({
        sql: `INSERT INTO grades (id, student_id, subject_id, value, max_value, comment, date, term, created_at)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, COALESCE(?, CURRENT_TIMESTAMP))`,
        params: [
          gr.id,
          gr.student_id,
          gr.subject_id,
          gr.value,
          gr.max_value,
          gr.comment,
          gr.date,
          gr.term,
          gr.created_at,
        ],
      });
    }

    for (const p of studentPayments) {
      statements.push({
        sql: `INSERT INTO student_payments (id, student_id, type, amount, payment_date, payment_method, description, academic_year, created_at)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, COALESCE(?, CURRENT_TIMESTAMP))`,
        params: [
          p.id,
          p.student_id,
          p.type,
          p.amount,
          p.payment_date,
          p.payment_method,
          p.description,
          p.academic_year,
          p.created_at,
        ],
      });
    }

    for (const p of teacherPayments) {
      statements.push({
        sql: `INSERT INTO teacher_payments (id, teacher_id, amount, payment_date, payment_method, period_month, period_year, description, created_at)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, COALESCE(?, CURRENT_TIMESTAMP))`,
        params: [
          p.id,
          p.teacher_id,
          p.amount,
          p.payment_date,
          p.payment_method,
          p.period_month,
          p.period_year,
          p.description,
          p.created_at,
        ],
      });
    }

    // exécution transactionnelle
    try {
      runMany(statements);
    } catch (error) {
      return { success: false, error: error && error.message ? error.message : 'Erreur import' };
    }

    return {
      success: true,
      data: {
        filePath,
        counts: {
          teachers: teachers.length,
          classes: classes.length,
          students: students.length,
          guardians: guardians.length,
          subjects: subjects.length,
          grades: grades.length,
          student_payments: studentPayments.length,
          teacher_payments: teacherPayments.length,
        },
      },
    };
  });

  // ==================== STUDENTS ====================
  handle('students:getAll', { auth: true }, () => {
    const sql = `
      SELECT s.*, c.name as class_name,
             g.first_name as guardian_first_name, g.last_name as guardian_last_name,
             g.phone as guardian_phone, g.address as guardian_address,
             g.job as guardian_job, g.relationship as guardian_relationship
      FROM students s 
      LEFT JOIN classes c ON s.class_id = c.id 
      LEFT JOIN guardians g ON g.student_id = s.id
      ORDER BY s.last_name ASC
    `;
    return { success: true, data: query(sql) };
  });

  handle('students:getById', { auth: true }, (event, id) => {
    const sql = `
      SELECT s.*, c.name as class_name,
             g.first_name as guardian_first_name, g.last_name as guardian_last_name,
             g.phone as guardian_phone, g.address as guardian_address,
             g.job as guardian_job, g.relationship as guardian_relationship
      FROM students s
      LEFT JOIN classes c ON s.class_id = c.id
      LEFT JOIN guardians g ON g.student_id = s.id
      WHERE s.id = ?
    `;
    const result = query(sql, [id]);
    return { success: true, data: result[0] };
  });

  handle('students:create', { auth: true }, (event, data) => {
    if (!data || !data.matricule) {
      return { success: false, error: 'Matricule obligatoire' };
    }
    if (!data.guardian || !data.guardian.first_name || !data.guardian.last_name || !data.guardian.phone) {
      return { success: false, error: 'Tuteur obligatoire' };
    }

    const sql = `
      INSERT INTO students (first_name, last_name, date_of_birth, gender, matricule, phone, address, class_id, status, photo)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    run(sql, [
      data.first_name,
      data.last_name,
      data.date_of_birth,
      data.gender || null,
      data.matricule,
      data.phone || null,
      data.address || null,
      data.class_id || null,
      data.status || 'active',
      data.photo || null
    ]);
    const id = query('SELECT last_insert_rowid() as id')[0]?.id;

    run(
      `INSERT INTO guardians (student_id, first_name, last_name, phone, address, job, relationship)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(student_id) DO UPDATE SET
         first_name=excluded.first_name,
         last_name=excluded.last_name,
         phone=excluded.phone,
         address=excluded.address,
         job=excluded.job,
         relationship=excluded.relationship,
         updated_at=CURRENT_TIMESTAMP`
      , [
        id,
        data.guardian.first_name,
        data.guardian.last_name,
        data.guardian.phone,
        data.guardian.address || null,
        data.guardian.job || null,
        data.guardian.relationship || null
      ]
    );

    const guardian = query('SELECT * FROM guardians WHERE student_id = ? LIMIT 1', [id])[0];
    if (!guardian) {
      return { success: false, error: 'Erreur lors de l\'enregistrement du tuteur' };
    }
    console.log('Tuteur enregistré:', { student_id: id, guardian_id: guardian.id });
    return { success: true, data: { id, guardian } };
  });

  handle('students:update', { auth: true }, (event, id, data) => {
    if (!data || !data.matricule) {
      return { success: false, error: 'Matricule obligatoire' };
    }
    if (!data.guardian || !data.guardian.first_name || !data.guardian.last_name || !data.guardian.phone) {
      return { success: false, error: 'Tuteur obligatoire' };
    }

    const sql = `
      UPDATE students 
      SET first_name = ?, last_name = ?, date_of_birth = ?, gender = ?, 
          matricule = ?, phone = ?, address = ?, class_id = ?, status = ?, photo = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;
    run(sql, [
      data.first_name,
      data.last_name,
      data.date_of_birth,
      data.gender || null,
      data.matricule,
      data.phone || null,
      data.address || null,
      data.class_id || null,
      data.status || 'active',
      data.photo || null,
      id
    ]);

    run(
      `INSERT INTO guardians (student_id, first_name, last_name, phone, address, job, relationship)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(student_id) DO UPDATE SET
         first_name=excluded.first_name,
         last_name=excluded.last_name,
         phone=excluded.phone,
         address=excluded.address,
         job=excluded.job,
         relationship=excluded.relationship,
         updated_at=CURRENT_TIMESTAMP`
      , [
        id,
        data.guardian.first_name,
        data.guardian.last_name,
        data.guardian.phone,
        data.guardian.address || null,
        data.guardian.job || null,
        data.guardian.relationship || null
      ]
    );

    const guardian = query('SELECT * FROM guardians WHERE student_id = ? LIMIT 1', [id])[0];
    if (!guardian) {
      return { success: false, error: 'Erreur lors de l\'enregistrement du tuteur' };
    }
    return { success: true };
  });

  handle('students:delete', { auth: true }, (event, id) => {
    const sql = 'DELETE FROM students WHERE id = ?';
    query(sql, [id]);
    return { success: true };
  });

  // ==================== TEACHERS ====================
  handle('teachers:getAll', { auth: true }, () => {
    const sql = 'SELECT * FROM teachers ORDER BY last_name ASC';
    return { success: true, data: query(sql) };
  });

  handle('teachers:getById', { auth: true }, (event, id) => {
    const sql = 'SELECT * FROM teachers WHERE id = ?';
    const result = query(sql, [id]);
    return { success: true, data: result[0] };
  });

  handle('teachers:create', { auth: true }, (event, data) => {
    const sql = `
      INSERT INTO teachers (first_name, last_name, email, phone, address, specialty, status, gender, photo)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const result = query(sql, [
      data.first_name,
      data.last_name,
      data.email || null,
      data.phone || null,
      data.address || null,
      data.specialty || null,
      data.status || 'active',
      data.gender || null,
      data.photo || null
    ]);
    return { success: true, data: { id: result.lastInsertRowid } };
  });

  handle('teachers:update', { auth: true }, (event, id, data) => {
    if (data && data.status && data.status !== 'active') {
      const assigned = query('SELECT COUNT(*) as count FROM classes WHERE teacher_id = ?', [id])[0]?.count || 0;
      if (assigned > 0) {
        return { success: false, error: 'Impossible de mettre ce professeur inactif: il est assigné à une classe' };
      }
    }
    const sql = `
      UPDATE teachers 
      SET first_name = ?, last_name = ?, email = ?, phone = ?, 
          address = ?, specialty = ?, status = ?, gender = ?, photo = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;
    query(sql, [
      data.first_name,
      data.last_name,
      data.email,
      data.phone,
      data.address,
      data.specialty,
      data.status,
      data.gender,
      data.photo,
      id
    ]);
    return { success: true };
  });

  handle('teachers:delete', { auth: true }, (event, id) => {
    const sql = 'DELETE FROM teachers WHERE id = ?';
    query(sql, [id]);
    return { success: true };
  });

  // ==================== CLASSES ====================
  handle('classes:getAll', { auth: true }, () => {
    const sql = `
      SELECT c.*, t.first_name || ' ' || t.last_name as teacher_name,
             (SELECT COUNT(*) FROM students WHERE class_id = c.id) as student_count
      FROM classes c
      LEFT JOIN teachers t ON c.teacher_id = t.id
      ORDER BY c.name ASC
    `;
    return { success: true, data: query(sql) };
  });

  handle('classes:getById', { auth: true }, (event, id) => {
    const sql = 'SELECT * FROM classes WHERE id = ?';
    const result = query(sql, [id]);
    return { success: true, data: result[0] };
  });

  handle('classes:create', { auth: true }, (event, data) => {
    const sql = `
      INSERT INTO classes (name, level, academic_year, max_students, teacher_id)
      VALUES (?, ?, ?, ?, ?)
    `;
    const result = query(sql, [
      data.name,
      data.level,
      data.academic_year,
      data.max_students || 30,
      data.teacher_id || null
    ]);

    if (data.teacher_id) {
      run("UPDATE teachers SET status = 'active', updated_at = CURRENT_TIMESTAMP WHERE id = ?", [data.teacher_id]);
    }
    return { success: true, data: { id: result.lastInsertRowid } };
  });

  handle('classes:update', { auth: true }, (event, id, data) => {
    const previousTeacherId = query('SELECT teacher_id FROM classes WHERE id = ?', [id])[0]?.teacher_id || null;
    const sql = `
      UPDATE classes 
      SET name = ?, level = ?, academic_year = ?, max_students = ?, teacher_id = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;
    query(sql, [
      data.name,
      data.level,
      data.academic_year,
      data.max_students,
      data.teacher_id,
      id
    ]);

    if (data.teacher_id) {
      run("UPDATE teachers SET status = 'active', updated_at = CURRENT_TIMESTAMP WHERE id = ?", [data.teacher_id]);
    }
    if (previousTeacherId && String(previousTeacherId) !== String(data.teacher_id || '')) {
      const stillAssigned = query('SELECT COUNT(*) as count FROM classes WHERE teacher_id = ?', [previousTeacherId])[0]?.count || 0;
      if (stillAssigned === 0) {
        run("UPDATE teachers SET status = 'inactive', updated_at = CURRENT_TIMESTAMP WHERE id = ?", [previousTeacherId]);
      }
    }
    return { success: true };
  });

  handle('classes:delete', { auth: true }, (event, id) => {
    const sql = 'DELETE FROM classes WHERE id = ?';
    query(sql, [id]);
    return { success: true };
  });

  // ==================== DASHBOARD STATS ====================
  handle('dashboard:getStats', { auth: true }, () => {
    const stats = {};
    
    // Nombre d'élèves
    stats.totalStudents = query('SELECT COUNT(*) as count FROM students')[0].count;
    
    // Nombre de professeurs
    stats.totalTeachers = query('SELECT COUNT(*) as count FROM teachers')[0].count;
    
    // Nombre de classes
    stats.totalClasses = query('SELECT COUNT(*) as count FROM classes')[0].count;
    
    // Nombre de matières
    stats.totalSubjects = query('SELECT COUNT(*) as count FROM subjects')[0].count;
    
    // Élèves actifs
    stats.activeStudents = query("SELECT COUNT(*) as count FROM students WHERE status = 'active'")[0].count;
    
    // Derniers élèves inscrits
    stats.recentStudents = query(`
      SELECT s.*, c.name as class_name 
      FROM students s 
      LEFT JOIN classes c ON s.class_id = c.id 
      ORDER BY s.enrollment_date DESC 
      LIMIT 5
    `);
    
    // Derniers paiements (scolarité)
    stats.recentTuition = query(`
      SELECT p.*, s.first_name, s.last_name
      FROM student_payments p
      JOIN students s ON p.student_id = s.id
      WHERE p.type = 'tuition'
      ORDER BY p.payment_date DESC
      LIMIT 5
    `);
    
    return { success: true, data: stats };
  });

  // ==================== SUBJECTS ====================
  handle('subjects:getAll', { auth: true }, () => {
    const sql = 'SELECT * FROM subjects ORDER BY name ASC';
    return { success: true, data: query(sql) };
  });

  handle('subjects:create', { auth: true }, (event, data) => {
    const sql = `
      INSERT INTO subjects (name, code, description, coefficient)
      VALUES (?, ?, ?, ?)
    `;
    const result = query(sql, [
      data.name,
      data.code,
      data.description || null,
      data.coefficient || 1
    ]);
    return { success: true, data: { id: result.lastInsertRowid } };
  });

  // ==================== GRADES ====================
  handle('grades:getAll', { auth: true }, () => {
    const sql = `
      SELECT g.*, s.first_name, s.last_name, sub.name as subject_name
      FROM grades g
      JOIN students s ON g.student_id = s.id
      JOIN subjects sub ON g.subject_id = sub.id
      ORDER BY g.date DESC
    `;
    return { success: true, data: query(sql) };
  });

  handle('grades:getByStudent', { auth: true }, (event, studentId) => {
    const sql = `
      SELECT g.*, sub.name as subject_name, sub.coefficient
      FROM grades g
      JOIN subjects sub ON g.subject_id = sub.id
      WHERE g.student_id = ?
      ORDER BY g.date DESC
    `;
    const result = query(sql, [studentId]);
    return { success: true, data: result };
  });

  handle('grades:create', { auth: true }, (event, data) => {
    const sql = `
      INSERT INTO grades (student_id, subject_id, value, max_value, comment, date, term)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    const result = query(sql, [
      data.student_id,
      data.subject_id,
      data.value,
      data.max_value || 20,
      data.comment || null,
      data.date || new Date().toISOString().split('T')[0],
      data.term || null
    ]);
    return { success: true, data: { id: result.lastInsertRowid } };
  });

  // ==================== PAYMENTS ====================
  // Student Payments (Uniforms, Tuition)
  handle('payments:getStudentPayments', { auth: true }, () => {
    const sql = `
      SELECT p.*, s.first_name, s.last_name, c.name as class_name
      FROM student_payments p
      JOIN students s ON p.student_id = s.id
      LEFT JOIN classes c ON s.class_id = c.id
      ORDER BY p.payment_date DESC
    `;
    return { success: true, data: query(sql) };
  });

  handle('payments:createStudentPayment', { auth: true }, (event, data) => {
    const sql = `
      INSERT INTO student_payments (student_id, type, amount, payment_date, payment_method, description, academic_year)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    const result = query(sql, [
      data.student_id,
      data.type,
      data.amount,
      data.payment_date || new Date().toISOString().split('T')[0],
      data.payment_method || 'Espèces',
      data.description || null,
      data.academic_year || null
    ]);
    return { success: true, data: { id: result.lastInsertRowid } };
  });

  // Teacher Payments
  handle('payments:getTeacherPayments', { auth: true }, () => {
    const sql = `
      SELECT p.*, t.first_name, t.last_name
      FROM teacher_payments p
      JOIN teachers t ON p.teacher_id = t.id
      ORDER BY p.payment_date DESC
    `;
    return { success: true, data: query(sql) };
  });

  handle('payments:createTeacherPayment', { auth: true }, (event, data) => {
    const sql = `
      INSERT INTO teacher_payments (teacher_id, amount, payment_date, payment_method, period_month, period_year, description)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    const result = query(sql, [
      data.teacher_id,
      data.amount,
      data.payment_date || new Date().toISOString().split('T')[0],
      data.payment_method || 'Espèces',
      data.period_month,
      data.period_year,
      data.description || null
    ]);
    return { success: true, data: { id: result.lastInsertRowid } };
  });
}

module.exports = setupIPCHandlers;
