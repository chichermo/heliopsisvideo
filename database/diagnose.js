const { db } = require('./init');

function diagnoseDatabase() {
    console.log('🔍 Diagnóstico de base de datos...');
    
    // Verificar si la tabla existe
    db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='simple_tokens'", [], (err, table) => {
        if (err) {
            console.error('❌ Error verificando tabla:', err);
            return;
        }
        
        if (!table) {
            console.log('❌ Tabla simple_tokens NO existe');
            return;
        }
        
        console.log('✅ Tabla simple_tokens existe');
        
        // Verificar estructura de la tabla
        db.all("PRAGMA table_info(simple_tokens)", [], (err, columns) => {
            if (err) {
                console.error('❌ Error obteniendo estructura:', err);
                return;
            }
            
            console.log('📋 Estructura de la tabla:');
            columns.forEach(col => {
                console.log(`  - ${col.name}: ${col.type} ${col.notnull ? 'NOT NULL' : ''}`);
            });
            
            // Verificar si hay datos
            db.get("SELECT COUNT(*) as count FROM simple_tokens", [], (err, result) => {
                if (err) {
                    console.error('❌ Error contando registros:', err);
                    return;
                }
                
                console.log(`📊 Total de registros: ${result.count}`);
                
                if (result.count > 0) {
                    // Mostrar todos los tokens
                    db.all("SELECT token, email, video_ids, max_views, is_active FROM simple_tokens", [], (err, rows) => {
                        if (err) {
                            console.error('❌ Error obteniendo tokens:', err);
                            return;
                        }
                        
                        console.log('🔑 Tokens en la base de datos:');
                        rows.forEach((row, index) => {
                            console.log(`  ${index + 1}. Token: ${row.token}`);
                            console.log(`     Email: ${row.email}`);
                            console.log(`     Video IDs: ${row.video_ids || 'NULL'}`);
                            console.log(`     Max Views: ${row.max_views}`);
                            console.log(`     Active: ${row.is_active}`);
                            console.log('');
                        });
                        
                        // Verificar token específico
                        const testToken = '0a95b5699675be71c815e8475005294f';
                        db.get("SELECT * FROM simple_tokens WHERE token = ?", [testToken], (err, row) => {
                            if (err) {
                                console.error('❌ Error verificando token específico:', err);
                                return;
                            }
                            
                            if (row) {
                                console.log(`✅ Token ${testToken} encontrado:`);
                                console.log(`   Email: ${row.email}`);
                                console.log(`   Video IDs: ${row.video_ids}`);
                                console.log(`   Max Views: ${row.max_views}`);
                                console.log(`   Active: ${row.is_active}`);
                            } else {
                                console.log(`❌ Token ${testToken} NO encontrado`);
                            }
                        });
                    });
                } else {
                    console.log('⚠️ No hay registros en la tabla');
                }
            });
        });
    });
}

module.exports = {
    diagnoseDatabase
};

// Ejecutar si se llama directamente
if (require.main === module) {
    diagnoseDatabase();
}