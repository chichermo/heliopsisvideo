const { db } = require('./init');

// Script de diagnóstico completo
async function diagnoseTokens() {
    console.log('🔍 DIAGNÓSTICO COMPLETO DE TOKENS');
    console.log('==================================');
    
    // 1. Verificar estructura de la tabla
    console.log('\n1. 📋 Estructura de la tabla simple_tokens:');
    db.all("PRAGMA table_info(simple_tokens)", [], (err, columns) => {
        if (err) {
            console.error('❌ Error obteniendo estructura:', err);
            return;
        }
        
        columns.forEach(col => {
            console.log(`   - ${col.name}: ${col.type} ${col.notnull ? 'NOT NULL' : ''} ${col.pk ? 'PRIMARY KEY' : ''}`);
        });
        
        // 2. Contar tokens
        console.log('\n2. 📊 Contando tokens:');
        db.get("SELECT COUNT(*) as count FROM simple_tokens", [], (err, result) => {
            if (err) {
                console.error('❌ Error contando tokens:', err);
                return;
            }
            
            console.log(`   Total de tokens: ${result.count}`);
            
            if (result.count === 0) {
                console.log('⚠️ No hay tokens en la base de datos');
                checkIfTokensExist();
                return;
            }
            
            // 3. Mostrar algunos tokens
            console.log('\n3. 🔑 Primeros 5 tokens:');
            db.all("SELECT token, email, password, created_at FROM simple_tokens LIMIT 5", [], (err, tokens) => {
                if (err) {
                    console.error('❌ Error obteniendo tokens:', err);
                    return;
                }
                
                tokens.forEach((token, index) => {
                    console.log(`   ${index + 1}. ${token.token.substring(0, 8)}... (${token.email}) - ${token.created_at}`);
                });
                
                // 4. Verificar columnas específicas
                console.log('\n4. 🔍 Verificando columnas específicas:');
                db.all("SELECT token, email, is_active, last_accessed, notes, payment_status FROM simple_tokens LIMIT 3", [], (err, rows) => {
                    if (err) {
                        console.error('❌ Error verificando columnas específicas:', err);
                        console.log('   Esto indica que faltan columnas en la tabla');
                        
                        // Intentar agregar las columnas faltantes
                        addMissingColumns();
                        return;
                    }
                    
                    console.log('   ✅ Todas las columnas están presentes');
                    rows.forEach((row, index) => {
                        console.log(`   ${index + 1}. Token: ${row.token.substring(0, 8)}...`);
                        console.log(`      Email: ${row.email}`);
                        console.log(`      Active: ${row.is_active}`);
                        console.log(`      Last Accessed: ${row.last_accessed}`);
                        console.log(`      Notes: ${row.notes}`);
                        console.log(`      Payment Status: ${row.payment_status}`);
                    });
                    
                    // 5. Probar la consulta exacta del panel
                    console.log('\n5. 🧪 Probando consulta del panel de administración:');
                    testAdminQuery();
                });
            });
        });
    });
}

function checkIfTokensExist() {
    console.log('\n🔍 Verificando si los tokens existen en otros lugares...');
    
    // Verificar si hay tokens en access_tokens
    db.get("SELECT COUNT(*) as count FROM access_tokens", [], (err, result) => {
        if (err) {
            console.log('   ⚠️ Tabla access_tokens no existe o tiene error');
        } else {
            console.log(`   📊 Tokens en access_tokens: ${result.count}`);
        }
        
        // Verificar si hay tokens en allowed_videos
        db.get("SELECT COUNT(*) as count FROM allowed_videos", [], (err, result) => {
            if (err) {
                console.log('   ⚠️ Tabla allowed_videos no existe o tiene error');
            } else {
                console.log(`   📊 Videos en allowed_videos: ${result.count}`);
            }
            
            console.log('\n💡 RECOMENDACIÓN: Ejecutar el script de restauración de tokens');
        });
    });
}

function addMissingColumns() {
    console.log('\n🔧 Agregando columnas faltantes...');
    
    const columnsToAdd = [
        { name: 'is_active', type: 'BOOLEAN DEFAULT 1' },
        { name: 'last_accessed', type: 'DATETIME DEFAULT CURRENT_TIMESTAMP' },
        { name: 'notes', type: 'TEXT' },
        { name: 'payment_status', type: 'TEXT DEFAULT "completed"' }
    ];
    
    let addedCount = 0;
    
    columnsToAdd.forEach(column => {
        db.run(`ALTER TABLE simple_tokens ADD COLUMN ${column.name} ${column.type}`, (err) => {
            if (err) {
                console.log(`   ⚠️ Columna ${column.name} ya existe o error: ${err.message}`);
            } else {
                console.log(`   ✅ Columna ${column.name} agregada`);
            }
            
            addedCount++;
            if (addedCount === columnsToAdd.length) {
                updateTokensWithDefaults();
            }
        });
    });
}

function updateTokensWithDefaults() {
    console.log('\n🔄 Actualizando tokens con valores por defecto...');
    
    db.run(`UPDATE simple_tokens SET 
        is_active = 1,
        last_accessed = CURRENT_TIMESTAMP,
        notes = 'Token restaurado',
        payment_status = 'completed'`, (err) => {
        if (err) {
            console.error('❌ Error actualizando tokens:', err);
        } else {
            console.log('✅ Tokens actualizados');
            testAdminQuery();
        }
    });
}

function testAdminQuery() {
    console.log('\n🧪 Probando consulta exacta del panel de administración...');
    
    const query = `
        SELECT 
            id, token, email, password, video_ids, 
            created_at, views, max_views, is_active, 
            last_accessed, notes, payment_status
        FROM simple_tokens 
        ORDER BY created_at DESC
    `;
    
    db.all(query, [], (err, rows) => {
        if (err) {
            console.error('❌ Error en consulta del panel:', err);
            console.log('   Esto explica por qué no aparecen los tokens');
        } else {
            console.log(`✅ Consulta exitosa: ${rows.length} tokens encontrados`);
            
            if (rows.length > 0) {
                console.log('\n📋 Primeros 3 tokens de la consulta:');
                rows.slice(0, 3).forEach((row, index) => {
                    console.log(`   ${index + 1}. ${row.email} - ${row.token.substring(0, 8)}...`);
                });
            } else {
                console.log('⚠️ La consulta funciona pero no devuelve tokens');
            }
        }
        
        // Cerrar conexión
        setTimeout(() => {
            db.close((err) => {
                if (err) {
                    console.error('❌ Error cerrando base de datos:', err);
                } else {
                    console.log('\n✅ Diagnóstico completado');
                }
                process.exit(0);
            });
        }, 2000);
    });
}

// Ejecutar diagnóstico
diagnoseTokens();
