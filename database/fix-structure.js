const { db } = require('./init');

// Script para corregir la estructura de la base de datos
async function fixDatabaseStructure() {
    console.log('🔧 Iniciando corrección de estructura de base de datos...');
    
    // Crear tabla temporal con la estructura correcta
    db.run(`CREATE TABLE IF NOT EXISTS allowed_videos_new (
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
            console.error('❌ Error creando tabla temporal:', err);
            return;
        }
        
        console.log('✅ Tabla temporal creada');
        
        // Migrar datos existentes
        db.all("SELECT * FROM allowed_videos", [], (err, oldVideos) => {
            if (err) {
                console.error('❌ Error obteniendo videos existentes:', err);
                return;
            }
            
            console.log(`📊 Migrando ${oldVideos.length} videos...`);
            
            let migratedCount = 0;
            oldVideos.forEach(video => {
                // Mapear columnas antiguas a nuevas
                const newVideo = {
                    video_id: video.google_drive_id || video.video_id || video.id,
                    title: video.name || video.title || 'Sin título',
                    description: video.description || `Video: ${video.name || 'Sin título'}`,
                    file_size: video.size || video.file_size || 0,
                    duration: video.duration || 0,
                    notes: video.notes || 'Migrado desde estructura anterior',
                    is_active: video.is_active !== undefined ? video.is_active : 1
                };
                
                const sql = `INSERT INTO allowed_videos_new (video_id, title, description, file_size, duration, notes, is_active)
                            VALUES (?, ?, ?, ?, ?, ?, ?)`;
                
                db.run(sql, [
                    newVideo.video_id,
                    newVideo.title,
                    newVideo.description,
                    newVideo.file_size,
                    newVideo.duration,
                    newVideo.notes,
                    newVideo.is_active
                ], function(err) {
                    if (err) {
                        console.error('❌ Error migrando video:', err);
                    } else {
                        migratedCount++;
                        console.log(`✅ Video migrado: ${newVideo.title}`);
                    }
                    
                    // Si es el último video, completar migración
                    if (migratedCount === oldVideos.length) {
                        completeMigration();
                    }
                });
            });
        });
    });
}

function completeMigration() {
    console.log('🔄 Completando migración...');
    
    // Eliminar tabla antigua
    db.run("DROP TABLE allowed_videos", (err) => {
        if (err) {
            console.error('❌ Error eliminando tabla antigua:', err);
        } else {
            console.log('✅ Tabla antigua eliminada');
        }
        
        // Renombrar tabla nueva
        db.run("ALTER TABLE allowed_videos_new RENAME TO allowed_videos", (err) => {
            if (err) {
                console.error('❌ Error renombrando tabla:', err);
            } else {
                console.log('✅ Tabla renombrada exitosamente');
                
                // Verificar estructura final
                db.all("PRAGMA table_info(allowed_videos)", [], (err, columns) => {
                    if (err) {
                        console.error('❌ Error verificando estructura final:', err);
                    } else {
                        console.log('📋 Estructura final de la tabla:');
                        columns.forEach(col => {
                            console.log(`  - ${col.name}: ${col.type} ${col.notnull ? 'NOT NULL' : ''} ${col.pk ? 'PRIMARY KEY' : ''}`);
                        });
                        
                        // Verificar datos
                        db.get("SELECT COUNT(*) as count FROM allowed_videos", [], (err, result) => {
                            if (err) {
                                console.error('❌ Error contando registros finales:', err);
                            } else {
                                console.log(`📊 Total de videos migrados: ${result.count}`);
                                console.log('🎉 Migración completada exitosamente');
                            }
                        });
                    }
                });
            }
        });
    });
}

// Ejecutar corrección
fixDatabaseStructure();

// Cerrar conexión después de 10 segundos
setTimeout(() => {
    db.close((err) => {
        if (err) {
            console.error('❌ Error cerrando base de datos:', err);
        } else {
            console.log('✅ Conexión a base de datos cerrada');
        }
        process.exit(0);
    });
}, 10000);
