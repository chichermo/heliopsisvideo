const { db } = require('./init');
const fs = require('fs');
const path = require('path');

// Sistema de backup automático para tokens
class TokenBackupManager {
    constructor() {
        this.backupDir = path.join(__dirname, 'backups');
        this.ensureBackupDir();
    }
    
    ensureBackupDir() {
        if (!fs.existsSync(this.backupDir)) {
            fs.mkdirSync(this.backupDir, { recursive: true });
            console.log('📁 Directorio de backup creado');
        }
    }
    
    // Crear backup de todos los tokens
    async createBackup() {
        return new Promise((resolve, reject) => {
            const query = `SELECT * FROM simple_tokens ORDER BY created_at DESC`;
            
            db.all(query, [], (err, rows) => {
                if (err) {
                    console.error('❌ Error creando backup:', err);
                    reject(err);
                    return;
                }
                
                const backup = {
                    timestamp: new Date().toISOString(),
                    count: rows.length,
                    tokens: rows.map(row => ({
                        token: row.token,
                        email: row.email,
                        password: row.password,
                        video_ids: row.video_ids,
                        views: row.views,
                        max_views: row.max_views,
                        is_permanent: row.is_permanent,
                        requires_password: row.requires_password,
                        status: row.status,
                        is_active: row.is_active,
                        notes: row.notes,
                        payment_status: row.payment_status,
                        created_at: row.created_at,
                        last_accessed: row.last_accessed
                    }))
                };
                
                const filename = `tokens_backup_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
                const filepath = path.join(this.backupDir, filename);
                
                fs.writeFile(filepath, JSON.stringify(backup, null, 2), (err) => {
                    if (err) {
                        console.error('❌ Error guardando backup:', err);
                        reject(err);
                        return;
                    }
                    
                    console.log(`✅ Backup creado: ${filename} (${rows.length} tokens)`);
                    resolve(filepath);
                });
            });
        });
    }
    
    // Restaurar tokens desde backup
    async restoreFromBackup(filepath) {
        return new Promise((resolve, reject) => {
            fs.readFile(filepath, 'utf8', (err, data) => {
                if (err) {
                    console.error('❌ Error leyendo backup:', err);
                    reject(err);
                    return;
                }
                
                try {
                    const backup = JSON.parse(data);
                    const tokenList = Array.isArray(backup.tokens) ? backup.tokens : [];
                    const declared =
                        typeof backup.count === 'number'
                            ? backup.count
                            : typeof backup.total_tokens === 'number'
                              ? backup.total_tokens
                              : tokenList.length;
                    console.log(`🔄 Archivo backup: ${declared} declarados, ${tokenList.length} entradas en array...`);

                    if (tokenList.length === 0) {
                        console.log('⚠️ Backup sin tokens, se omite');
                        return resolve({ restored: 0, errors: 0 });
                    }

                    let restored = 0;
                    let errors = 0;

                    tokenList.forEach((tokenData) => {
                        const insertSQL = `
                            INSERT OR REPLACE INTO simple_tokens 
                            (token, email, password, video_ids, views, max_views, is_permanent, 
                             requires_password, status, is_active, notes, payment_status, 
                             created_at, last_accessed)
                            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                        `;

                        db.run(
                            insertSQL,
                            [
                                tokenData.token,
                                tokenData.email,
                                tokenData.password,
                                tokenData.video_ids,
                                tokenData.views,
                                tokenData.max_views,
                                tokenData.is_permanent,
                                tokenData.requires_password,
                                tokenData.status,
                                tokenData.is_active,
                                tokenData.notes,
                                tokenData.payment_status,
                                tokenData.created_at,
                                tokenData.last_accessed,
                            ],
                            (err) => {
                                if (err) {
                                    console.error(`❌ Error restaurando token ${tokenData.token}:`, err);
                                    errors++;
                                } else {
                                    restored++;
                                }

                                if (restored + errors === tokenList.length) {
                                    console.log(
                                        `✅ Restauración completada: ${restored} tokens restaurados, ${errors} errores`
                                    );
                                    resolve({ restored, errors });
                                }
                            }
                        );
                    });
                } catch (parseError) {
                    console.error('❌ Error parseando backup:', parseError);
                    reject(parseError);
                }
            });
        });
    }
    
    // Obtener lista de backups disponibles
    getAvailableBackups() {
        try {
            const files = fs.readdirSync(this.backupDir)
                .filter(
                    (file) =>
                        file.endsWith('.json') &&
                        (file.startsWith('tokens_backup_') || file.startsWith('tokens-backup-'))
                )
                .map(file => {
                    const filepath = path.join(this.backupDir, file);
                    const stats = fs.statSync(filepath);
                    return {
                        filename: file,
                        filepath: filepath,
                        size: stats.size,
                        created: stats.birthtime,
                        modified: stats.mtime
                    };
                })
                .sort((a, b) => b.modified - a.modified);
            
            return files;
        } catch (error) {
            console.error('❌ Error obteniendo backups:', error);
            return [];
        }
    }
    
    // Limpiar backups antiguos (mantener solo los últimos 10)
    async cleanupOldBackups() {
        const backups = this.getAvailableBackups();
        
        if (backups.length > 10) {
            const toDelete = backups.slice(10);
            
            toDelete.forEach(backup => {
                try {
                    fs.unlinkSync(backup.filepath);
                    console.log(`🗑️ Backup eliminado: ${backup.filename}`);
                } catch (error) {
                    console.error(`❌ Error eliminando backup ${backup.filename}:`, error);
                }
            });
        }
    }
}

// Crear instancia global
const backupManager = new TokenBackupManager();

// Función para crear backup automático
async function createAutomaticBackup() {
    try {
        await backupManager.createBackup();
        await backupManager.cleanupOldBackups();
    } catch (error) {
        console.error('❌ Error en backup automático:', error);
    }
}

// Función para restaurar desde el backup más reciente
async function restoreFromLatestBackup() {
    try {
        const backups = backupManager.getAvailableBackups();

        if (backups.length === 0) {
            console.log('⚠️ No hay archivos tokens_backup_*.json ni tokens-backup-*.json en /database/backups');
            return false;
        }

        for (const b of backups) {
            try {
                console.log(`🔄 Intentando backup: ${b.filename}`);
                const { restored, errors } = await backupManager.restoreFromBackup(b.filepath);
                if (restored > 0) {
                    console.log(`✅ Restaurados ${restored} tokens desde ${b.filename} (${errors} errores)`);
                    return true;
                }
            } catch (e) {
                console.warn(`⚠️ No se pudo leer ${b.filename}:`, e.message);
            }
        }

        console.log('⚠️ Ningún backup contenía tokens para restaurar');
        return false;
    } catch (error) {
        console.error('❌ Error restaurando desde backup:', error);
        return false;
    }
}

module.exports = {
    TokenBackupManager,
    backupManager,
    createAutomaticBackup,
    restoreFromLatestBackup
};