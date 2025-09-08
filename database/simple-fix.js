const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Conectar directamente a la base de datos
const db = new sqlite3.Database('./database/access_tokens.db', (err) => {
    if (err) {
        console.error('❌ Error conectando a la base de datos:', err.message);
        process.exit(1);
    }
    console.log('✅ Base de datos SQLite conectada');
    
    // Ejecutar corrección
    fixDatabase();
});

function fixDatabase() {
    console.log('🔧 Iniciando corrección de base de datos...');
    
    // Verificar estructura actual
    db.all("PRAGMA table_info(allowed_videos)", [], (err, columns) => {
        if (err) {
            console.error('❌ Error obteniendo estructura:', err);
            return;
        }
        
        console.log('📋 Estructura actual:');
        columns.forEach(col => {
            console.log(`  - ${col.name}: ${col.type}`);
        });
        
        // Si la tabla tiene la estructura antigua, corregirla
        const hasOldStructure = columns.some(col => col.name === 'google_drive_id' || col.name === 'name');
        
        if (hasOldStructure) {
            console.log('⚠️ Detectada estructura antigua, corrigiendo...');
            
            // Crear nueva tabla con estructura correcta
            db.run(`CREATE TABLE allowed_videos_correct (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                video_id TEXT UNIQUE NOT NULL,
                title TEXT NOT NULL,
                description TEXT,
                file_size INTEGER,
                duration INTEGER,
                notes TEXT,
                is_active BOOLEAN DEFAULT 1,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`, (err) => {
                if (err) {
                    console.error('❌ Error creando tabla correcta:', err);
                    return;
                }
                
                console.log('✅ Tabla correcta creada');
                
                // Migrar datos
                migrateData();
            });
        } else {
            console.log('✅ Estructura ya es correcta');
            db.close();
        }
    });
}

function migrateData() {
    console.log('📊 Migrando datos...');
    
    // Obtener datos existentes
    db.all("SELECT * FROM allowed_videos", [], (err, videos) => {
        if (err) {
            console.error('❌ Error obteniendo videos:', err);
            return;
        }
        
        console.log(`📊 Encontrados ${videos.length} videos para migrar`);
        
        let completed = 0;
        
        videos.forEach(video => {
            const newData = {
                video_id: video.google_drive_id || video.video_id || video.id,
                title: video.name || video.title || 'Sin título',
                description: video.description || `Video: ${video.name || 'Sin título'}`,
                file_size: video.size || video.file_size || 0,
                duration: video.duration || 0,
                notes: video.notes || 'Migrado desde estructura anterior',
                is_active: video.is_active !== undefined ? video.is_active : 1
            };
            
            const sql = `INSERT INTO allowed_videos_correct (video_id, title, description, file_size, duration, notes, is_active)
                        VALUES (?, ?, ?, ?, ?, ?, ?)`;
            
            db.run(sql, [
                newData.video_id,
                newData.title,
                newData.description,
                newData.file_size,
                newData.duration,
                newData.notes,
                newData.is_active
            ], function(err) {
                if (err) {
                    console.error('❌ Error migrando video:', err);
                } else {
                    console.log(`✅ Migrado: ${newData.title}`);
                }
                
                completed++;
                if (completed === videos.length) {
                    finalizeMigration();
                }
            });
        });
    });
}

function finalizeMigration() {
    console.log('🔄 Finalizando migración...');
    
    // Eliminar tabla antigua
    db.run("DROP TABLE allowed_videos", (err) => {
        if (err) {
            console.error('❌ Error eliminando tabla antigua:', err);
        } else {
            console.log('✅ Tabla antigua eliminada');
        }
        
        // Renombrar tabla nueva
        db.run("ALTER TABLE allowed_videos_correct RENAME TO allowed_videos", (err) => {
            if (err) {
                console.error('❌ Error renombrando tabla:', err);
            } else {
                console.log('✅ Tabla renombrada exitosamente');
                
                // Verificar resultado
                db.all("PRAGMA table_info(allowed_videos)", [], (err, columns) => {
                    if (err) {
                        console.error('❌ Error verificando resultado:', err);
                    } else {
                        console.log('📋 Estructura final:');
                        columns.forEach(col => {
                            console.log(`  - ${col.name}: ${col.type}`);
                        });
                        
                        db.get("SELECT COUNT(*) as count FROM allowed_videos", [], (err, result) => {
                            if (err) {
                                console.error('❌ Error contando registros:', err);
                            } else {
                                console.log(`📊 Total videos: ${result.count}`);
                                console.log('🎉 Migración completada exitosamente');
                            }
                            
                            // Cerrar conexión
                            db.close((err) => {
                                if (err) {
                                    console.error('❌ Error cerrando base de datos:', err);
                                } else {
                                    console.log('✅ Base de datos cerrada');
                                }
                            });
                        });
                    }
                });
            }
        });
    });
}
