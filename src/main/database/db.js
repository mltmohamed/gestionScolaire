const initSqlJs = require('sql.js');
const { app } = require('electron');
const path = require('path');
const fs = require('fs');

class DatabaseManager {
  constructor() {
    this.db = null;
    this._saving = false;
    const legacyDbPath = path.join(__dirname, '../../../schoolmanage.db');
    this.dbPath = path.join(app.getPath('userData'), 'schoolmanage.db');
    try {
      fs.mkdirSync(path.dirname(this.dbPath), { recursive: true });
      if (!fs.existsSync(this.dbPath) && fs.existsSync(legacyDbPath)) {
        fs.copyFileSync(legacyDbPath, this.dbPath);
      }
    } catch (error) {
      console.error('Erreur lors de la préparation du chemin de la base de données:', error);
    }
    console.log('Chemin de la base de données:', this.dbPath);
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
      try {
        data = this.db.export();
      } catch (error) {
        console.error('Erreur lors de l\'export de la base de données:', error);
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
}

// Instance singleton
const dbManager = new DatabaseManager();

module.exports = {
  getDb: () => dbManager.db,
  initializeDatabase: () => dbManager.initialize(),
  closeDatabase: () => dbManager.close(),
  query: (sql, params) => dbManager.query(sql, params),
  run: (sql, params) => dbManager.run(sql, params)
};
