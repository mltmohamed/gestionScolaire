const initSqlJs = require('sql.js');
const path = require('path');
const fs = require('fs');

class DatabaseManager {
  constructor() {
    this.db = null;
    // Utiliser un chemin simple dans le répertoire courant pour le développement
    this.dbPath = path.join(__dirname, '../../../schoolmanage.db');
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
      this.db.run(schema);
      
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
    try {
      if (this.db) {
        const data = this.db.export();
        const buffer = Buffer.from(data);
        fs.writeFileSync(this.dbPath, buffer);
        console.log('Base de données sauvegardée sur le disque à', this.dbPath);
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de la base de données:', error);
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
        stmt.bind(params);
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
      this.db.run(sql, params);
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
