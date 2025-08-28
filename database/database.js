const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbPath = process.env.DB_PATH || './database/access_tokens.db';

// Asegurar que el directorio de la base de datos existe
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
}

let db;

const initDatabase = () => {
    return new Promise((resolve, reject) => {
        db = new sqlite3.Database(dbPath, (err) => {
            if (err) {
                console.error('Error al conectar con la base de datos:', err);
                reject(err);
                return;
            }
            
            console.log('✅ Base de datos SQLite conectada');
            createTables().then(resolve).catch(reject);
        });
    });
};

const createTables = () => {
    return new Promise((resolve, reject) => {
        const createTokensTable = `
            CREATE TABLE IF NOT EXISTS access_tokens (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                token TEXT UNIQUE NOT NULL,
                email TEXT,
                expires_at INTEGER NOT NULL,
                used BOOLEAN DEFAULT FALSE,
                used_at INTEGER,
                created_at INTEGER DEFAULT (strftime('%s', 'now')),
                max_views INTEGER DEFAULT 1,
                current_views INTEGER DEFAULT 0,
                video_id TEXT NOT NULL,
                notes TEXT
            )
        `;
        
        const createVideoLogsTable = `
            CREATE TABLE IF NOT EXISTS video_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                token TEXT NOT NULL,
                ip_address TEXT,
                user_agent TEXT,
                accessed_at INTEGER DEFAULT (strftime('%s', 'now')),
                success BOOLEAN DEFAULT TRUE,
                error_message TEXT
            )
        `;
        
        const createAllowedVideosTable = `
            CREATE TABLE IF NOT EXISTS allowed_videos (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                google_drive_id TEXT UNIQUE NOT NULL,
                name TEXT NOT NULL,
                size INTEGER,
                mime_type TEXT,
                created_time TEXT,
                is_active BOOLEAN DEFAULT TRUE,
                added_at INTEGER DEFAULT (strftime('%s', 'now')),
                notes TEXT,
                deleted_at INTEGER DEFAULT NULL
            )
        `;
        
        db.serialize(() => {
            db.run(createTokensTable, (err) => {
                if (err) {
                    console.error('Error al crear tabla de tokens:', err);
                    reject(err);
                    return;
                }
            });
            
            db.run(createVideoLogsTable, (err) => {
                if (err) {
                    console.error('Error al crear tabla de logs:', err);
                    reject(err);
                }
            });
            
            db.run(createAllowedVideosTable, (err) => {
                if (err) {
                    console.error('Error al crear tabla de videos permitidos:', err);
                    reject(err);
                } else {
                    console.log('✅ Tablas de base de datos creadas');
                    resolve();
                }
            });
        });
    });
};

const createAccessToken = (tokenData) => {
    return new Promise((resolve, reject) => {
        const { token, email, expiresAt, maxViews, videoId, notes } = tokenData;
        
        const sql = `
            INSERT INTO access_tokens 
            (token, email, expires_at, max_views, video_id, notes) 
            VALUES (?, ?, ?, ?, ?, ?)
        `;
        
        db.run(sql, [token, email, expiresAt, maxViews || 1, videoId, notes], function(err) {
            if (err) {
                reject(err);
                return;
            }
            resolve(this.lastID);
        });
    });
};

const getAccessToken = (token) => {
    return new Promise((resolve, reject) => {
        const sql = `
            SELECT * FROM access_tokens 
            WHERE token = ? AND expires_at > (strftime('%s', 'now'))
        `;
        
        db.get(sql, [token], (err, row) => {
            if (err) {
                reject(err);
                return;
            }
            resolve(row);
        });
    });
};

const updateTokenUsage = (token, ipAddress, userAgent) => {
    return new Promise((resolve, reject) => {
        db.serialize(() => {
            // Actualizar el token
            const updateToken = `
                UPDATE access_tokens 
                SET used = TRUE, used_at = (strftime('%s', 'now')), current_views = current_views + 1
                WHERE token = ?
            `;
            
            // Registrar el acceso
            const logAccess = `
                INSERT INTO video_logs (token, ip_address, user_agent)
                VALUES (?, ?, ?)
            `;
            
            db.run(updateToken, [token], function(err) {
                if (err) {
                    reject(err);
                    return;
                }
                
                db.run(logAccess, [token, ipAddress, userAgent], function(err) {
                    if (err) {
                        reject(err);
                        return;
                    }
                    resolve();
                });
            });
        });
    });
};

const getAllTokens = () => {
    return new Promise((resolve, reject) => {
        const sql = `
            SELECT t.*, 
                   COUNT(l.id) as total_accesses,
                   MAX(l.accessed_at) as last_accessed
            FROM access_tokens t
            LEFT JOIN video_logs l ON t.token = l.token
            GROUP BY t.id
            ORDER BY t.created_at DESC
        `;
        
        db.all(sql, [], (err, rows) => {
            if (err) {
                reject(err);
                return;
            }
            resolve(rows);
        });
    });
};

const deleteToken = (tokenId) => {
    return new Promise((resolve, reject) => {
        const sql = 'DELETE FROM access_tokens WHERE id = ?';
        
        db.run(sql, [tokenId], function(err) {
            if (err) {
                reject(err);
                return;
            }
            resolve(this.changes);
        });
    });
};

const getTokenStats = () => {
    return new Promise((resolve, reject) => {
        const sql = `
            SELECT 
                COUNT(*) as total_tokens,
                SUM(CASE WHEN used = 1 THEN 1 ELSE 0 END) as used_tokens,
                SUM(CASE WHEN expires_at < (strftime('%s', 'now')) THEN 1 ELSE 0 END) as expired_tokens,
                SUM(current_views) as total_views
            FROM access_tokens
        `;
        
        db.get(sql, [], (err, row) => {
            if (err) {
                reject(err);
                return;
            }
            resolve(row);
        });
    });
};

const closeDatabase = () => {
    if (db) {
        db.close((err) => {
            if (err) {
                console.error('Error al cerrar la base de datos:', err);
            } else {
                console.log('✅ Base de datos cerrada');
            }
        });
    }
};

// Manejar cierre graceful del servidor
process.on('SIGINT', () => {
    console.log('\n🔄 Cerrando servidor...');
    closeDatabase();
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n🔄 Cerrando servidor...');
    closeDatabase();
    process.exit(0);
});

// Funciones para gestión de videos permitidos
const addAllowedVideo = (videoData) => {
    return new Promise((resolve, reject) => {
        const { google_drive_id, name, size, mime_type, created_time, notes } = videoData;
        
        const sql = `
            INSERT OR REPLACE INTO allowed_videos 
            (google_drive_id, name, size, mime_type, created_time, notes) 
            VALUES (?, ?, ?, ?, ?, ?)
        `;
        
        db.run(sql, [google_drive_id, name, size, mime_type, created_time, notes], function(err) {
            if (err) {
                reject(err);
                return;
            }
            resolve(this.lastID);
        });
    });
};

const removeAllowedVideo = (googleDriveId) => {
    return new Promise((resolve, reject) => {
        const sql = 'UPDATE allowed_videos SET deleted_at = (strftime("%s", "now")), is_active = 0 WHERE google_drive_id = ?';
        
        db.run(sql, [googleDriveId], function(err) {
            if (err) {
                reject(err);
                return;
            }
            resolve(this.changes);
        });
    });
};

const getAllowedVideos = () => {
    return new Promise((resolve, reject) => {
        const sql = 'SELECT * FROM allowed_videos WHERE is_active = 1 AND (deleted_at IS NULL OR deleted_at = 0) ORDER BY added_at DESC';
        
        db.all(sql, [], (err, rows) => {
            if (err) {
                reject(err);
                return;
            }
            resolve(rows);
        });
    });
};

const getHiddenVideos = () => {
    return new Promise((resolve, reject) => {
        const sql = 'SELECT * FROM allowed_videos WHERE is_active = 0 AND (deleted_at IS NULL OR deleted_at = 0) ORDER BY added_at DESC';
        
        db.all(sql, [], (err, rows) => {
            if (err) {
                reject(err);
                return;
            }
            resolve(rows);
        });
    });
};

const toggleVideoStatus = (googleDriveId, isActive) => {
    return new Promise((resolve, reject) => {
        const sql = 'UPDATE allowed_videos SET is_active = ? WHERE google_drive_id = ?';
        
        db.run(sql, [isActive ? 1 : 0, googleDriveId], function(err) {
            if (err) {
                reject(err);
                return;
            }
            resolve(this.changes);
        });
    });
};

const updateVideoNotes = (googleDriveId, notes) => {
    return new Promise((resolve, reject) => {
        const sql = 'UPDATE allowed_videos SET notes = ? WHERE google_drive_id = ?';
        
        db.run(sql, [notes, googleDriveId], function(err) {
            if (err) {
                reject(err);
                return;
            }
            resolve(this.changes);
        });
    });
};

const getVideoStats = () => {
    return new Promise((resolve, reject) => {
        const sql = `
            SELECT 
                COUNT(*) as total_videos,
                SUM(CASE WHEN is_active = 1 AND (deleted_at IS NULL OR deleted_at = 0) THEN 1 ELSE 0 END) as active_videos,
                SUM(CASE WHEN is_active = 0 AND (deleted_at IS NULL OR deleted_at = 0) THEN 1 ELSE 0 END) as hidden_videos,
                SUM(CASE WHEN deleted_at IS NOT NULL AND deleted_at != 0 THEN 1 ELSE 0 END) as deleted_videos,
                SUM(CASE WHEN (deleted_at IS NULL OR deleted_at = 0) THEN size ELSE 0 END) as total_size
            FROM allowed_videos
        `;
        
        db.get(sql, [], (err, row) => {
            if (err) {
                reject(err);
                return;
            }
            resolve(row);
        });
    });
};

const getDeletedVideos = () => {
    return new Promise((resolve, reject) => {
        const sql = 'SELECT * FROM allowed_videos WHERE deleted_at IS NOT NULL AND deleted_at != 0 ORDER BY deleted_at DESC';
        
        db.all(sql, [], (err, rows) => {
            if (err) {
                reject(err);
                return;
            }
            resolve(rows);
        });
    });
};

const restoreVideo = (googleDriveId) => {
    return new Promise((resolve, reject) => {
        const sql = 'UPDATE allowed_videos SET deleted_at = 0, is_active = 1 WHERE google_drive_id = ?';
        
        db.run(sql, [googleDriveId], function(err) {
            if (err) {
                reject(err);
                return;
            }
            resolve(this.changes);
        });
    });
};

const permanentlyDeleteVideo = (googleDriveId) => {
    return new Promise((resolve, reject) => {
        const sql = 'DELETE FROM allowed_videos WHERE google_drive_id = ?';
        
        db.run(sql, [googleDriveId], function(err) {
            if (err) {
                reject(err);
                return;
            }
            resolve(this.changes);
        });
    });
};

module.exports = {
    initDatabase,
    createAccessToken,
    getAccessToken,
    updateTokenUsage,
    getAllTokens,
    deleteToken,
    getTokenStats,
    addAllowedVideo,
    removeAllowedVideo,
    getAllowedVideos,
    getHiddenVideos,
    toggleVideoStatus,
    updateVideoNotes,
    getVideoStats,
    getDeletedVideos,
    restoreVideo,
    permanentlyDeleteVideo,
    closeDatabase
};
