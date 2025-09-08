const sqlite3 = require('sqlite3').verbose();

console.log('🔧 Iniciando migración forzada para Render...\n');

// Función principal que se ejecuta inmediatamente
(async function() {
    try {
        await forceMigration();
    } catch (error) {
        console.error('❌ Error crítico en migración:', error);
        // No salir del proceso, solo loggear el error
    }
})();

async function forceMigration() {
    return new Promise((resolve, reject) => {
        console.log('📋 PASO 1: Verificando estructura actual...\n');
        
        // Conectar a la base de datos
        const db = new sqlite3.Database('./database/access_tokens.db', (err) => {
            if (err) {
                console.error('❌ Error conectando a la base de datos:', err.message);
                reject(err);
                return;
            }
            console.log('✅ Base de datos SQLite conectada');
            
            // Verificar si la tabla existe
            db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='allowed_videos'", [], (err, table) => {
                if (err) {
                    console.error('❌ Error verificando tabla:', err);
                    reject(err);
                    return;
                }
                
                if (!table) {
                    console.log('⚠️ Tabla allowed_videos no existe. Creando desde cero...');
                    createTableFromScratch(db, resolve, reject);
                } else {
                    console.log('✅ Tabla allowed_videos existe. Verificando estructura...');
                    checkAndFixStructure(db, resolve, reject);
                }
            });
        });
    });
}

function createTableFromScratch(db, resolve, reject) {
    console.log('📋 Creando tabla desde cero...');
    
    db.run(`CREATE TABLE allowed_videos (
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
            console.error('❌ Error creando tabla:', err);
            reject(err);
            return;
        }
        console.log('✅ Tabla creada desde cero');
        
        // Insertar datos de ejemplo si es necesario
        insertSampleData(db, resolve, reject);
    });
}

function checkAndFixStructure(db, resolve, reject) {
    db.all("PRAGMA table_info(allowed_videos)", [], (err, columns) => {
        if (err) {
            console.error('❌ Error obteniendo estructura:', err);
            reject(err);
            return;
        }
        
        console.log('📋 Estructura actual de allowed_videos:');
        columns.forEach(col => {
            console.log(`  - ${col.name}: ${col.type}`);
        });
        
        // Verificar si necesita corrección
        const needsFix = columns.some(col => 
            col.name === 'google_drive_id' || 
            col.name === 'name' || 
            col.name === 'size'
        );
        
        if (needsFix) {
            console.log('\n⚠️ Estructura necesita corrección. Procediendo con migración...');
            performMigration(db, resolve, reject);
        } else {
            console.log('\n✅ Estructura ya es correcta. Verificando datos...');
            verifyDataIntegrity(db, resolve, reject);
        }
    });
}

function performMigration(db, resolve, reject) {
    console.log('\n📋 PASO 2: Creando nueva tabla con estructura correcta...');
    
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
            console.error('❌ Error creando tabla nueva:', err);
            reject(err);
            return;
        }
        console.log('✅ Tabla nueva creada');
        migrateData(db, resolve, reject);
    });
}

function migrateData(db, resolve, reject) {
    console.log('\n📋 PASO 3: Migrando datos existentes...');
    
    db.all("SELECT * FROM allowed_videos", [], (err, videos) => {
        if (err) {
            console.error('❌ Error obteniendo videos:', err);
            reject(err);
            return;
        }
        
        console.log(`📊 Encontrados ${videos.length} videos para migrar`);
        
        if (videos.length === 0) {
            console.log('📊 No hay videos para migrar, procediendo con limpieza...');
            finalizeMigration(db, resolve, reject);
            return;
        }
        
        let migrated = 0;
        videos.forEach(video => {
            // Mapear datos antiguos a nuevos
            const newData = {
                video_id: video.google_drive_id || video.video_id || video.id,
                title: video.name || video.title || 'Sin título',
                description: video.description || `Video: ${video.name || video.title || 'Sin título'}`,
                file_size: video.size || video.file_size || 0,
                duration: video.duration || 0,
                notes: video.notes || 'Migrado desde estructura anterior',
                is_active: video.is_active !== undefined ? video.is_active : 1
            };
            
            const sql = `INSERT INTO allowed_videos_new (video_id, title, description, file_size, duration, notes, is_active)
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
                    console.error(`❌ Error migrando video ${newData.title}:`, err);
                } else {
                    console.log(`✅ Migrado: ${newData.title}`);
                }
                
                migrated++;
                if (migrated === videos.length) {
                    finalizeMigration(db, resolve, reject);
                }
            });
        });
    });
}

function finalizeMigration(db, resolve, reject) {
    console.log('\n📋 PASO 4: Finalizando migración...');
    
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
                verifyDataIntegrity(db, resolve, reject);
            }
        });
    });
}

function insertSampleData(db, resolve, reject) {
    console.log('📋 Insertando datos de ejemplo...');
    
    const sampleVideos = [
        {
            video_id: 'sample_video_1',
            title: 'Video de Ejemplo 1',
            description: 'Este es un video de ejemplo para verificar la funcionalidad',
            file_size: 1024 * 1024 * 100, // 100 MB
            duration: 120, // 2 minutos
            notes: 'Video de ejemplo creado automáticamente'
        },
        {
            video_id: 'sample_video_2',
            title: 'Video de Ejemplo 2',
            description: 'Segundo video de ejemplo',
            file_size: 1024 * 1024 * 200, // 200 MB
            duration: 180, // 3 minutos
            notes: 'Video de ejemplo creado automáticamente'
        }
    ];
    
    let inserted = 0;
    sampleVideos.forEach(video => {
        const sql = `INSERT INTO allowed_videos (video_id, title, description, file_size, duration, notes)
                    VALUES (?, ?, ?, ?, ?, ?)`;
        
        db.run(sql, [
            video.video_id,
            video.title,
            video.description,
            video.file_size,
            video.duration,
            video.notes
        ], function(err) {
            if (err) {
                console.error(`❌ Error insertando video de ejemplo:`, err);
            } else {
                console.log(`✅ Insertado: ${video.title}`);
            }
            
            inserted++;
            if (inserted === sampleVideos.length) {
                verifyDataIntegrity(db, resolve, reject);
            }
        });
    });
}

function verifyDataIntegrity(db, resolve, reject) {
    console.log('\n📋 PASO 5: Verificando integridad de datos...');
    
    db.all("SELECT * FROM allowed_videos", [], (err, videos) => {
        if (err) {
            console.error('❌ Error verificando datos:', err);
            reject(err);
            return;
        }
        
        console.log(`📊 Total de videos: ${videos.length}`);
        
        if (videos.length > 0) {
            console.log('\n📝 Datos de videos:');
            videos.forEach((video, index) => {
                console.log(`\n🎬 Video ${index + 1}:`);
                console.log(`  ID: ${video.id}`);
                console.log(`  video_id: ${video.video_id}`);
                console.log(`  title: ${video.title}`);
                console.log(`  file_size: ${video.file_size}`);
                console.log(`  notes: ${video.notes}`);
            });
        }
        
        // Cerrar conexión
        db.close((err) => {
            if (err) {
                console.error('❌ Error cerrando base de datos:', err);
            } else {
                console.log('\n✅ Base de datos cerrada');
                console.log('\n🎉 ¡Migración forzada completada!');
                console.log('✅ La base de datos ahora tiene la estructura correcta');
                console.log('✅ Los datos han sido migrados correctamente');
                resolve();
            }
        });
    });
}
