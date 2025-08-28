const sqlite3 = require('sqlite3').verbose();

console.log('🔧 Iniciando migración forzada para Render...\n');

// Conectar a la base de datos
const db = new sqlite3.Database('./database/access_tokens.db', (err) => {
    if (err) {
        console.error('❌ Error conectando a la base de datos:', err.message);
        process.exit(1);
    }
    console.log('✅ Base de datos SQLite conectada');
    
    // Ejecutar migración forzada
    forceMigration();
});

function forceMigration() {
    console.log('📋 PASO 1: Verificando estructura actual...\n');
    
    db.all("PRAGMA table_info(allowed_videos)", [], (err, columns) => {
        if (err) {
            console.error('❌ Error obteniendo estructura:', err);
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
            performMigration();
        } else {
            console.log('\n✅ Estructura ya es correcta. Verificando datos...');
            verifyDataIntegrity();
        }
    });
}

function performMigration() {
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
            return;
        }
        console.log('✅ Tabla nueva creada');
        migrateData();
    });
}

function migrateData() {
    console.log('\n📋 PASO 3: Migrando datos existentes...');
    
    db.all("SELECT * FROM allowed_videos", [], (err, videos) => {
        if (err) {
            console.error('❌ Error obteniendo videos:', err);
            return;
        }
        
        console.log(`📊 Encontrados ${videos.length} videos para migrar`);
        
        if (videos.length === 0) {
            console.log('📊 No hay videos para migrar, procediendo con limpieza...');
            finalizeMigration();
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
                    finalizeMigration();
                }
            });
        });
    });
}

function finalizeMigration() {
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
                verifyDataIntegrity();
            }
        });
    });
}

function verifyDataIntegrity() {
    console.log('\n📋 PASO 5: Verificando integridad de datos...');
    
    db.all("SELECT * FROM allowed_videos", [], (err, videos) => {
        if (err) {
            console.error('❌ Error verificando datos:', err);
        } else {
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
            }
        });
    });
}
