const initSqlJs = require('sql.js');
const { app } = require('electron');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

class DatabaseManager {
  constructor() {
    this.db = null;
    this._saving = false;
    this.dbPath = path.join(app.getPath('userData'), 'schoolmanage.db');
    try {
      fs.mkdirSync(path.dirname(this.dbPath), { recursive: true });
      // Ne plus copier automatiquement schoolmanage.db depuis la racine du projet : ça réinjectait
      // toute l’ancienne base (élèves + mot de passe admin modifié) dans un dossier censé être « neuf ».
      // Pour une migration manuelle uniquement : SCHOOLMANAGE_USE_LEGACY_DB=1
      if (!app.isPackaged && process.env.SCHOOLMANAGE_USE_LEGACY_DB === '1') {
        const legacyDbPath = path.join(__dirname, '../../../schoolmanage.db');
        if (!fs.existsSync(this.dbPath) && fs.existsSync(legacyDbPath)) {
          fs.copyFileSync(legacyDbPath, this.dbPath);
          console.log('Copie de la base legacy (SCHOOLMANAGE_USE_LEGACY_DB=1) :', legacyDbPath);
        }
      }
    } catch (error) {
      console.error('Erreur lors de la préparation du chemin de la base de données:', error);
    }
    console.log('Chemin de la base de données:', this.dbPath);
  }

  /**
   * Crée admin / admin uniquement s’il n’existe aucun utilisateur avec le nom « admin ».
   * Ne réinitialise pas le mot de passe si vous avez déjà un compte admin (évite d’écraser un mot de passe changé).
   */
  ensureDefaultAdminUser() {
    if (!this.db) return;
    const rows = this.query(
      `SELECT id FROM users WHERE lower(trim(username)) = ? LIMIT 1`,
      ['admin']
    );
    if (rows && rows.length > 0) {
      return;
    }
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync('admin', salt, 100000, 64, 'sha512').toString('hex');
    this.db.run(
      'INSERT INTO users (username, password_hash, password_salt, role) VALUES (?, ?, ?, ?)',
      ['admin', hash, salt, 'administrator']
    );
    console.log('Compte par défaut créé : utilisateur « admin », mot de passe « admin ».');
  }

  /** Réinitialise le mot de passe du compte admin à « admin » (support / dépannage). */
  resetAdminPasswordToDefault() {
    if (!this.db) return;
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync('admin', salt, 100000, 64, 'sha512').toString('hex');
    const rows = this.query(`SELECT id FROM users WHERE lower(trim(username)) = ? LIMIT 1`, ['admin']);
    if (rows && rows[0]) {
      this.db.run(
        'UPDATE users SET password_hash = ?, password_salt = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [hash, salt, rows[0].id]
      );
    } else {
      this.db.run(
        'INSERT INTO users (username, password_hash, password_salt, role) VALUES (?, ?, ?, ?)',
        ['admin', hash, salt, 'administrator']
      );
    }
    console.log('Mot de passe du compte « admin » réinitialisé à « admin » (SCHOOLMANAGE_RESET_ADMIN=1).');
  }

  async initialize() {
    try {
      const SQL = await initSqlJs();
      
      // Vérifier si la base de données existe déjà
      if (fs.existsSync(this.dbPath)) {
        const fileBuffer = fs.readFileSync(this.dbPath);
        this.db = new SQL.Database(fileBuffer);
        console.log('Base de données chargée avec succès depuis', this.dbPath);
      } else {
        this.db = new SQL.Database();
        console.log('Nouvelle base de données créée en mémoire');
      }
      
      // Lire et exécuter le schéma
      const schemaPath = path.join(__dirname, 'schema.sql');
      console.log('Chemin du schéma:', schemaPath);
      
      if (!fs.existsSync(schemaPath)) {
        throw new Error(`Le fichier schema.sql n'existe pas à l'adresse: ${schemaPath}`);
      }
      
      const schema = fs.readFileSync(schemaPath, 'utf8');
      // Exécuter le schéma en 2 phases: tables d'abord, puis migrations (ALTER), puis indexes.
      // Sinon une ancienne DB peut échouer si un index référence une colonne ajoutée plus tard (ex: matricule).
      const indexMarker = '\n-- Index';
      const markerPos = schema.indexOf(indexMarker);
      const schemaTables = markerPos >= 0 ? schema.slice(0, markerPos) : schema;
      const schemaIndexes = markerPos >= 0 ? schema.slice(markerPos) : '';
      this.db.run(schemaTables);

      // Migrations légères (tables existantes créées avec un ancien schéma)
      const ensureColumn = (tableName, columnName, columnType) => {
        const cols = this.query(`PRAGMA table_info(${tableName})`);
        const exists = Array.isArray(cols) && cols.some((c) => c && c.name === columnName);
        if (!exists) {
          this.db.run(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${columnType}`);
        }
      };

      ensureColumn('students', 'photo', 'TEXT');
      ensureColumn('teachers', 'photo', 'TEXT');
      ensureColumn('students', 'gender', 'TEXT');
      ensureColumn('teachers', 'gender', 'TEXT');
      ensureColumn('students', 'matricule', 'TEXT');

      ensureColumn('students', 'is_deleted', 'INTEGER DEFAULT 0');
      ensureColumn('students', 'deleted_at', 'DATETIME');
      ensureColumn('teachers', 'is_deleted', 'INTEGER DEFAULT 0');
      ensureColumn('teachers', 'deleted_at', 'DATETIME');
      ensureColumn('classes', 'is_deleted', 'INTEGER DEFAULT 0');
      ensureColumn('classes', 'deleted_at', 'DATETIME');

      ensureColumn('bulletin_meta', 'bulletin_type', 'TEXT');
      ensureColumn('bulletin_meta', 'data_json', 'TEXT');

      // Ajouter les champs de frais pour les classes
      ensureColumn('classes', 'tuition_fee', 'DECIMAL(10,2) DEFAULT 0');
      ensureColumn('classes', 'uniform_fee', 'DECIMAL(10,2) DEFAULT 0');

      // Ajouter le champ de salaire pour les enseignants
      ensureColumn('teachers', 'salary', 'DECIMAL(10,2) DEFAULT 0');

      // Ajouter les champs de mensualisation pour les paiements de scolarité
      ensureColumn('student_payments', 'period_month', 'INTEGER');
      ensureColumn('student_payments', 'period_year', 'INTEGER');
      ensureColumn('student_payments', 'month_total', 'DECIMAL(10,2)');

      // Table guardians (tuteur)
      this.db.run(`
        CREATE TABLE IF NOT EXISTS guardians (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          student_id INTEGER NOT NULL UNIQUE,
          first_name TEXT NOT NULL,
          last_name TEXT NOT NULL,
          phone TEXT NOT NULL,
          address TEXT,
          job TEXT,
          relationship TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
        )
      `);

      // Index unique pour matricule
      this.db.run('CREATE UNIQUE INDEX IF NOT EXISTS idx_students_matricule ON students(matricule)');

      if (schemaIndexes) {
        this.db.run(schemaIndexes);
      }

      // Table users + seed admin (pour l'authentification)
      this.db.run(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          username TEXT NOT NULL UNIQUE,
          password_hash TEXT NOT NULL,
          password_salt TEXT NOT NULL,
          role TEXT DEFAULT 'administrator',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);
      this.db.run('CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username ON users(username)');

      // sql.js peut renvoyer COUNT(*) comme nombre ou chaîne ; "0" est truthy en JS → l’ancien `count === 0` échouait
      // et aucun compte admin n’était créé. On garantit l’existence d’un utilisateur `admin` si absent.
      this.ensureDefaultAdminUser();
      if (process.env.SCHOOLMANAGE_RESET_ADMIN === '1') {
        this.resetAdminPasswordToDefault();
      }
      
      console.log('Schéma de base de données initialisé');
      this.save(); // Sauvegarder immédiatement après création
      return true;
    } catch (error) {
      console.error('Erreur lors de l\'initialisation de la base de données:', error);
      console.error('Stack trace:', error.stack);
      throw error;
    }
  }

  save() {
    if (!this.db || this._saving) return;

    this._saving = true;
    try {
      let data;
      const sleepSync = (ms) => {
        const end = Date.now() + ms;
        while (Date.now() < end) {
          /* attente synchrone courte entre tentatives (sql.js / wasm peut lancer ErrnoError 44) */
        }
      };
      let lastExportError = null;
      for (let attempt = 0; attempt < 3; attempt += 1) {
        try {
          if (attempt > 0) sleepSync(25);
          data = this.db.export();
          lastExportError = null;
          break;
        } catch (error) {
          lastExportError = error;
        }
      }
      if (!data) {
        console.error('Erreur lors de l\'export de la base de données:', lastExportError);
        return;
      }

      const buffer = Buffer.from(data);
      const tmpPath = `${this.dbPath}.tmp`;

      try {
        fs.writeFileSync(tmpPath, buffer);
      } catch (error) {
        console.error('Erreur écriture du fichier temporaire DB:', error);
        return;
      }

      try {
        fs.renameSync(tmpPath, this.dbPath);
      } catch (error) {
        // Fallback: certaines machines Windows/AV peuvent bloquer rename atomique.
        console.error('Erreur lors du renommage atomique DB (fallback écriture directe):', error);
        try {
          fs.writeFileSync(this.dbPath, buffer);
          try {
            if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath);
          } catch {
            // ignorer
          }
        } catch (error2) {
          console.error('Erreur lors de l\'écriture directe DB:', error2);
          return;
        }
      }

      console.log('Base de données sauvegardée sur le disque à', this.dbPath);
    } finally {
      this._saving = false;
    }
  }

  close() {
    if (this.db) {
      this.save();
      this.db.close();
    }
  }

  // Helper pour les requêtes
  query(sql, params = []) {
    try {
      const stmt = this.db.prepare(sql);
      const results = [];
      
      if (params && params.length > 0) {
        const sanitized = params.map((p) => (p === undefined ? null : p));
        stmt.bind(sanitized);
      }
      
      while (stmt.step()) {
        results.push(stmt.getAsObject());
      }
      stmt.free();
      
      return results;
    } catch (error) {
      console.error('Erreur SQL:', error);
      throw error;
    }
  }

  // Exécution simple sans retour
  run(sql, params = []) {
    try {
      const sanitized = params && params.length > 0 ? params.map((p) => (p === undefined ? null : p)) : params;
      this.db.run(sql, sanitized);
      this.save(); // Sauvegarder automatiquement après chaque modification
    } catch (error) {
      console.error('Erreur SQL:', error);
      throw error;
    }
  }

  runMany(statements = []) {
    if (!this.db) return;
    if (!Array.isArray(statements) || statements.length === 0) return;

    try {
      this.db.run('BEGIN');
      for (const item of statements) {
        if (!item) continue;
        const sql = item.sql;
        const params = item.params || [];
        const sanitized = params && params.length > 0 ? params.map((p) => (p === undefined ? null : p)) : params;
        this.db.run(sql, sanitized);
      }
      this.db.run('COMMIT');
      this.save();
    } catch (error) {
      try {
        this.db.run('ROLLBACK');
      } catch {
        // ignorer
      }
      console.error('Erreur SQL:', error);
      throw error;
    }
  }
}

// Instance singleton
const dbManager = new DatabaseManager();

module.exports = {
  getDb: () => dbManager.db,
  initializeDatabase: () => dbManager.initialize(),
  closeDatabase: () => dbManager.close(),
  query: (sql, params) => dbManager.query(sql, params),
  run: (sql, params) => dbManager.run(sql, params),
  runMany: (statements) => dbManager.runMany(statements)
};
