const { query, run } = require('./database/db');

function setupIPCHandlers(ipcMain) {
  // ==================== STUDENTS ====================
  ipcMain.handle('students:getAll', () => {
    try {
      const sql = `
        SELECT s.*, c.name as class_name 
        FROM students s 
        LEFT JOIN classes c ON s.class_id = c.id 
        ORDER BY s.last_name ASC
      `;
      return { success: true, data: query(sql) };
    } catch (error) {
      console.error('Erreur getStudents:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('students:getById', (event, id) => {
    try {
      const sql = 'SELECT * FROM students WHERE id = ?';
      const result = query(sql, [id]);
      return { success: true, data: result[0] };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('students:create', (event, data) => {
    try {
      const sql = `
        INSERT INTO students (first_name, last_name, date_of_birth, gender, email, phone, address, class_id, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      const result = query(sql, [
        data.first_name,
        data.last_name,
        data.date_of_birth,
        data.gender || null,
        data.email || null,
        data.phone || null,
        data.address || null,
        data.class_id || null,
        data.status || 'active'
      ]);
      return { success: true, data: { id: result.lastInsertRowid } };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('students:update', (event, id, data) => {
    try {
      const sql = `
        UPDATE students 
        SET first_name = ?, last_name = ?, date_of_birth = ?, gender = ?, 
            email = ?, phone = ?, address = ?, class_id = ?, status = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `;
      query(sql, [
        data.first_name,
        data.last_name,
        data.date_of_birth,
        data.gender,
        data.email,
        data.phone,
        data.address,
        data.class_id,
        data.status,
        id
      ]);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('students:delete', (event, id) => {
    try {
      const sql = 'DELETE FROM students WHERE id = ?';
      query(sql, [id]);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  // ==================== TEACHERS ====================
  ipcMain.handle('teachers:getAll', () => {
    try {
      const sql = 'SELECT * FROM teachers ORDER BY last_name ASC';
      return { success: true, data: query(sql) };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('teachers:getById', (event, id) => {
    try {
      const sql = 'SELECT * FROM teachers WHERE id = ?';
      const result = query(sql, [id]);
      return { success: true, data: result[0] };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('teachers:create', (event, data) => {
    try {
      const sql = `
        INSERT INTO teachers (first_name, last_name, email, phone, address, specialty, status)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `;
      const result = query(sql, [
        data.first_name,
        data.last_name,
        data.email || null,
        data.phone || null,
        data.address || null,
        data.specialty || null,
        data.status || 'active'
      ]);
      return { success: true, data: { id: result.lastInsertRowid } };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('teachers:update', (event, id, data) => {
    try {
      const sql = `
        UPDATE teachers 
        SET first_name = ?, last_name = ?, email = ?, phone = ?, 
            address = ?, specialty = ?, status = ?,
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
        id
      ]);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('teachers:delete', (event, id) => {
    try {
      const sql = 'DELETE FROM teachers WHERE id = ?';
      query(sql, [id]);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  // ==================== CLASSES ====================
  ipcMain.handle('classes:getAll', () => {
    try {
      const sql = `
        SELECT c.*, t.first_name || ' ' || t.last_name as teacher_name,
               (SELECT COUNT(*) FROM students WHERE class_id = c.id) as student_count
        FROM classes c
        LEFT JOIN teachers t ON c.teacher_id = t.id
        ORDER BY c.name ASC
      `;
      return { success: true, data: query(sql) };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('classes:getById', (event, id) => {
    try {
      const sql = 'SELECT * FROM classes WHERE id = ?';
      const result = query(sql, [id]);
      return { success: true, data: result[0] };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('classes:create', (event, data) => {
    try {
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
      return { success: true, data: { id: result.lastInsertRowid } };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('classes:update', (event, id, data) => {
    try {
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
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('classes:delete', (event, id) => {
    try {
      const sql = 'DELETE FROM classes WHERE id = ?';
      query(sql, [id]);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  // ==================== DASHBOARD STATS ====================
  ipcMain.handle('dashboard:getStats', () => {
    try {
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
      
      return { success: true, data: stats };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  // ==================== SUBJECTS ====================
  ipcMain.handle('subjects:getAll', () => {
    try {
      const sql = 'SELECT * FROM subjects ORDER BY name ASC';
      return { success: true, data: query(sql) };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('subjects:create', (event, data) => {
    try {
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
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  // ==================== GRADES ====================
  ipcMain.handle('grades:getAll', () => {
    try {
      const sql = `
        SELECT g.*, s.first_name, s.last_name, sub.name as subject_name
        FROM grades g
        JOIN students s ON g.student_id = s.id
        JOIN subjects sub ON g.subject_id = sub.id
        ORDER BY g.date DESC
      `;
      return { success: true, data: query(sql) };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('grades:getByStudent', (event, studentId) => {
    try {
      const sql = `
        SELECT g.*, sub.name as subject_name, sub.coefficient
        FROM grades g
        JOIN subjects sub ON g.subject_id = sub.id
        WHERE g.student_id = ?
        ORDER BY g.date DESC
      `;
      const result = query(sql, [studentId]);
      return { success: true, data: result };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('grades:create', (event, data) => {
    try {
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
    } catch (error) {
      return { success: false, error: error.message };
    }
  });
}

module.exports = setupIPCHandlers;
