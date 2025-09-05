const sqlite3 = require('sqlite3').verbose();

console.log('🔍 Iniciando diagnóstico de base de datos...\n');

// Conectar a la base de datos
const db = new sqlite3.Database('./database/access_tokens.db', (err) => {
    if (err) {
        console.error('❌ Error conectando a la base de datos:', err.message);
        process.exit(1);
    }
    console.log('✅ Base de datos SQLite conectada');
    
    // Ejecutar diagnóstico paso a paso
    diagnoseDatabase();
});

function diagnoseDatabase() {
    console.log('📋 PASO 1: Verificando estructura de tablas...\n');
    
    // Verificar estructura de allowed_videos
    db.all("PRAGMA table_info(allowed_videos)", [], (err, columns) => {
        if (err) {
            console.error('❌ Error obteniendo estructura de allowed_videos:', err);
            return;
        }
        
        console.log('📋 Estructura de tabla allowed_videos:');
        columns.forEach(col => {
            console.log(`  - ${col.name}: ${col.type} (${col.notnull ? 'NOT NULL' : 'NULL'})`);
        });
        
        // Verificar datos actuales
        console.log('\n📋 PASO 2: Verificando datos actuales...');
        db.all("SELECT * FROM allowed_videos", [], (err, videos) => {
            if (err) {
                console.error('❌ Error obteniendo videos:', err);
                return;
            }
            
            console.log(`📊 Total de videos encontrados: ${videos.length}`);
            
            if (videos.length === 0) {
                console.log('⚠️ No hay videos en la tabla');
                return;
            }
            
            console.log('\n📝 Datos de cada video:');
            videos.forEach((video, index) => {
                console.log(`\n🎬 Video ${index + 1}:`);
                console.log(`  ID: ${video.id}`);
                console.log(`  video_id: ${video.video_id}`);
                console.log(`  title: ${video.title}`);
                console.log(`  description: ${video.description}`);
                console.log(`  file_size: ${video.file_size}`);
                console.log(`  duration: ${video.duration}`);
                console.log(`  notes: ${video.notes}`);
                console.log(`  is_active: ${video.is_active}`);
                console.log(`  created_at: ${video.created_at}`);
            });
            
            // Verificar si hay datos corruptos
            console.log('\n📋 PASO 3: Analizando integridad de datos...');
            const corruptedVideos = videos.filter(video => 
                !video.title || 
                video.title === 'undefined' || 
                !video.video_id || 
                video.video_id === 'undefined'
            );
            
            if (corruptedVideos.length > 0) {
                console.log(`⚠️ Encontrados ${corruptedVideos.length} videos con datos corruptos:`);
                corruptedVideos.forEach((video, index) => {
                    console.log(`  Video ${index + 1}: ID=${video.id}, title="${video.title}", video_id="${video.video_id}"`);
                });
                
                console.log('\n🔧 RECOMENDACIÓN: Ejecutar corrección de datos...');
                console.log('   node database/final-fix.js');
            } else {
                console.log('✅ Todos los videos tienen datos válidos');
            }
            
            // Verificar otras tablas
            console.log('\n📋 PASO 4: Verificando otras tablas...');
            db.all("SELECT name FROM sqlite_master WHERE type='table'", [], (err, tables) => {
                if (err) {
                    console.error('❌ Error obteniendo lista de tablas:', err);
                } else {
                    console.log('📋 Tablas en la base de datos:');
                    tables.forEach(table => {
                        console.log(`  - ${table.name}`);
                    });
                }
                
                // Cerrar conexión
                db.close((err) => {
                    if (err) {
                        console.error('❌ Error cerrando base de datos:', err);
                    } else {
                        console.log('\n✅ Base de datos cerrada');
                        console.log('\n🎯 DIAGNÓSTICO COMPLETADO');
                    }
                });
            });
        });
    });
}
