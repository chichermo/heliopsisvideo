const { db } = require('./init');

// Script para recuperar tokens existentes
async function recoverTokens() {
    console.log('🔍 Recuperando tokens existentes...');
    
    // Verificar todas las tablas
    db.all("SELECT name FROM sqlite_master WHERE type='table'", [], (err, tables) => {
        if (err) {
            console.error('❌ Error obteniendo tablas:', err);
            return;
        }
        
        console.log('📋 Tablas encontradas:');
        tables.forEach(table => {
            console.log(`  - ${table.name}`);
        });
        
        // Buscar tokens en access_tokens
        db.all("SELECT * FROM access_tokens", [], (err, tokens) => {
            if (err) {
                console.error('❌ Error obteniendo tokens:', err);
            } else {
                console.log(`\n🔑 Tokens encontrados (${tokens.length}):`);
                tokens.forEach(token => {
                    console.log(`  - Token: ${token.token}`);
                    console.log(`    Email: ${token.email}`);
                    console.log(`    Video ID: ${token.video_id}`);
                    console.log(`    Vistas: ${token.current_views}/${token.max_views}`);
                    console.log(`    Activo: ${token.is_active ? 'Sí' : 'No'}`);
                    console.log(`    Creado: ${token.created_at}`);
                    console.log('---');
                });
            }
        });
        
        // Buscar tokens en simple_tokens si existe
        db.all("SELECT name FROM sqlite_master WHERE type='table' AND name='simple_tokens'", [], (err, simpleTable) => {
            if (simpleTable && simpleTable.length > 0) {
                db.all("SELECT * FROM simple_tokens", [], (err, simpleTokens) => {
                    if (err) {
                        console.error('❌ Error obteniendo simple_tokens:', err);
                    } else {
                        console.log(`\n🔑 Simple Tokens encontrados (${simpleTokens.length}):`);
                        simpleTokens.forEach(token => {
                            console.log(`  - Token: ${token.token}`);
                            console.log(`    Email: ${token.email}`);
                            console.log(`    Video IDs: ${token.video_ids}`);
                            console.log(`    Vistas: ${token.views}/${token.max_views}`);
                            console.log(`    Permanente: ${token.is_permanent ? 'Sí' : 'No'}`);
                            console.log(`    Requiere Password: ${token.requires_password ? 'Sí' : 'No'}`);
                            console.log('---');
                        });
                    }
                });
            }
        });
        
        // Buscar videos permitidos
        db.all("SELECT * FROM allowed_videos", [], (err, videos) => {
            if (err) {
                console.error('❌ Error obteniendo videos:', err);
            } else {
                console.log(`\n🎥 Videos permitidos (${videos.length}):`);
                videos.forEach(video => {
                    console.log(`  - ID: ${video.video_id}`);
                    console.log(`    Título: ${video.title}`);
                    console.log(`    Activo: ${video.is_active ? 'Sí' : 'No'}`);
                    console.log('---');
                });
            }
        });
    });
}

// Ejecutar recuperación
recoverTokens();

// Cerrar conexión después de 5 segundos
setTimeout(() => {
    db.close((err) => {
        if (err) {
            console.error('❌ Error cerrando base de datos:', err);
        } else {
            console.log('✅ Conexión a base de datos cerrada');
        }
        process.exit(0);
    });
}, 5000);
