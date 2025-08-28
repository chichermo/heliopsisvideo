const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Crear directorio de base de datos si no existe
const dbDir = path.dirname('./database/access_tokens.db');
const fs = require('fs');
if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
}

// Conectar a la base de datos
const db = new sqlite3.Database('./database/access_tokens.db', (err) => {
    if (err) {
        console.error('❌ Error conectando a la base de datos:', err.message);
    } else {
        console.log('✅ Base de datos SQLite conectada');
        initDatabase();
    }
});

function initDatabase() {
    // Crear tabla de tokens de acceso
    db.run(`CREATE TABLE IF NOT EXISTS access_tokens (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        token TEXT UNIQUE NOT NULL,
        email TEXT NOT NULL,
        video_id TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        expires_at DATETIME,
        max_views INTEGER DEFAULT 1,
        current_views INTEGER DEFAULT 0,
        is_active BOOLEAN DEFAULT 1,
        device_fingerprint TEXT,
        max_devices INTEGER DEFAULT 1,
        current_devices INTEGER DEFAULT 0,
        share_blocked BOOLEAN DEFAULT 1,
        ip_address TEXT,
        user_agent TEXT
    )`);

    // Crear tabla de logs de visualización
    db.run(`CREATE TABLE IF NOT EXISTS video_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        token_id INTEGER NOT NULL,
        email TEXT NOT NULL,
        video_id TEXT NOT NULL,
        viewed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        ip_address TEXT,
        user_agent TEXT,
        device_fingerprint TEXT,
        FOREIGN KEY (token_id) REFERENCES access_tokens (id)
    )`);

    // Crear tabla de videos permitidos
    db.run(`CREATE TABLE IF NOT EXISTS allowed_videos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        video_id TEXT UNIQUE NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        file_size INTEGER,
        duration INTEGER,
        notes TEXT,
        is_active BOOLEAN DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Crear tabla de dispositivos por token
    db.run(`CREATE TABLE IF NOT EXISTS device_tokens (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        token_id INTEGER NOT NULL,
        device_fingerprint TEXT NOT NULL,
        ip_address TEXT,
        user_agent TEXT,
        first_access DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_access DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (token_id) REFERENCES access_tokens (id)
    )`);

    console.log('✅ Tablas de base de datos creadas');
}

module.exports = { db };
