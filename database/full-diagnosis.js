const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Script de diagnóstico completo
console.log('🔍 DIAGNÓSTICO COMPLETO DEL SISTEMA');
console.log('===================================');

// Verificar archivos
console.log('\n1. 📁 Verificando archivos:');
const dbPath = './database/access_tokens.db';
const fs = require('fs');

if (fs.existsSync(dbPath)) {
    console.log('✅ Base de datos existe:', dbPath);
    const stats = fs.statSync(dbPath);
    console.log(`   Tamaño: ${stats.size} bytes`);
    console.log(`   Modificado: ${stats.mtime}`);
} else {
    console.log('❌ Base de datos NO existe:', dbPath);
}

// Conectar a la base de datos
console.log('\n2. 🔌 Conectando a la base de datos...');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('❌ Error conectando:', err.message);
        return;
    }
    console.log('✅ Conectado exitosamente');
    
    // Verificar tablas
    console.log('\n3. 📋 Verificando tablas:');
    db.all("SELECT name FROM sqlite_master WHERE type='table'", [], (err, tables) => {
        if (err) {
            console.error('❌ Error obteniendo tablas:', err);
            return;
        }
        
        console.log('Tablas encontradas:');
        tables.forEach(table => {
            console.log(`   - ${table.name}`);
        });
        
        // Verificar tabla simple_tokens específicamente
        const hasSimpleTokens = tables.some(t => t.name === 'simple_tokens');
        if (hasSimpleTokens) {
            console.log('\n4. 🔍 Verificando tabla simple_tokens:');
            db.all("PRAGMA table_info(simple_tokens)", [], (err, columns) => {
                if (err) {
                    console.error('❌ Error obteniendo estructura:', err);
                    return;
                }
                
                console.log('Estructura de simple_tokens:');
                columns.forEach(col => {
                    console.log(`   - ${col.name}: ${col.type}`);
                });
                
                // Contar tokens
                console.log('\n5. 📊 Contando tokens:');
                db.get("SELECT COUNT(*) as count FROM simple_tokens", [], (err, result) => {
                    if (err) {
                        console.error('❌ Error contando tokens:', err);
                        return;
                    }
                    
                    console.log(`Total de tokens: ${result.count}`);
                    
                    if (result.count === 0) {
                        console.log('⚠️ No hay tokens en la tabla');
                        insertTestTokens();
                    } else {
                        console.log('✅ Hay tokens en la tabla');
                        showTokens();
                    }
                });
            });
        } else {
            console.log('❌ La tabla simple_tokens NO existe');
            createTableAndInsertTokens();
        }
    });
});

function createTableAndInsertTokens() {
    console.log('\n🔧 Creando tabla simple_tokens...');
    
    const createTableSQL = `
        CREATE TABLE simple_tokens (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            token TEXT UNIQUE NOT NULL,
            email TEXT NOT NULL,
            video_ids TEXT NOT NULL,
            password TEXT,
            views INTEGER DEFAULT 0,
            max_views INTEGER DEFAULT 1,
            is_permanent BOOLEAN DEFAULT 0,
            requires_password BOOLEAN DEFAULT 0,
            status TEXT DEFAULT 'activo',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            last_used DATETIME DEFAULT CURRENT_TIMESTAMP,
            is_active BOOLEAN DEFAULT 1,
            last_accessed DATETIME DEFAULT CURRENT_TIMESTAMP,
            notes TEXT,
            payment_status TEXT DEFAULT 'completed'
        )
    `;
    
    db.run(createTableSQL, (err) => {
        if (err) {
            console.error('❌ Error creando tabla:', err);
            return;
        }
        console.log('✅ Tabla simple_tokens creada');
        insertTestTokens();
    });
}

function insertTestTokens() {
    console.log('\n🔄 Insertando tokens de prueba...');
    
    const testTokens = [
        { email: 'test1@example.com', token: 'test123456789012345678901234567890', password: 'testpass1' },
        { email: 'test2@example.com', token: 'test234567890123456789012345678901', password: 'testpass2' },
        { email: 'johnnycoppejans@hotmail.com', token: '3e736c6f6eb01c7942fe52e841495877', password: '7WbovVpD' }
    ];
    
    let insertedCount = 0;
    
    testTokens.forEach((tokenData, index) => {
        const insertSQL = `
            INSERT INTO simple_tokens 
            (token, email, video_ids, password, views, max_views, is_permanent, requires_password, status, is_active, last_accessed, notes, payment_status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        
        db.run(insertSQL, [
            tokenData.token,
            tokenData.email,
            JSON.stringify(['1-38V037fiJbvUytXNPhAtQQ10bPNeLnD', '1gb3uJnvBvpZ1ob51uiOiwtrpo4MvGbdE']),
            tokenData.password,
            0,
            999999,
            1,
            1,
            'permanente',
            1,
            new Date().toISOString(),
            'Token de prueba',
            'completed'
        ], (err) => {
            if (err) {
                console.error(`❌ Error insertando token ${index + 1}:`, err);
            } else {
                console.log(`✅ Token ${index + 1} insertado: ${tokenData.email}`);
                insertedCount++;
                
                if (insertedCount === testTokens.length) {
                    console.log(`\n🎉 ${testTokens.length} tokens de prueba insertados`);
                    testAdminQuery();
                }
            }
        });
    });
}

function showTokens() {
    console.log('\n📋 Mostrando tokens existentes:');
    
    db.all("SELECT token, email, password FROM simple_tokens LIMIT 5", [], (err, rows) => {
        if (err) {
            console.error('❌ Error obteniendo tokens:', err);
            return;
        }
        
        rows.forEach((row, index) => {
            console.log(`   ${index + 1}. ${row.email} - ${row.token.substring(0, 8)}...`);
        });
        
        testAdminQuery();
    });
}

function testAdminQuery() {
    console.log('\n6. 🧪 Probando consulta del panel de administración:');
    
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
                    console.log(`      Active: ${row.is_active}, Status: ${row.payment_status}`);
                });
                
                console.log('\n🎯 La consulta funciona correctamente');
                console.log('💡 El problema puede estar en:');
                console.log('   - La ruta de la API en el servidor');
                console.log('   - El servidor no está usando esta base de datos');
                console.log('   - Hay un problema de caché en Render');
            } else {
                console.log('⚠️ La consulta funciona pero no devuelve tokens');
            }
        }
        
        // Verificar si hay tokens en otras tablas
        console.log('\n7. 🔍 Verificando otras tablas:');
        db.all("SELECT name FROM sqlite_master WHERE type='table'", [], (err, tables) => {
            if (err) {
                console.error('❌ Error obteniendo tablas:', err);
                return;
            }
            
            tables.forEach(table => {
                if (table.name !== 'simple_tokens') {
                    db.get(`SELECT COUNT(*) as count FROM ${table.name}`, [], (err, result) => {
                        if (!err) {
                            console.log(`   ${table.name}: ${result.count} registros`);
                        }
                    });
                }
            });
            
            // Cerrar conexión
            setTimeout(() => {
                db.close((err) => {
                    if (err) {
                        console.error('❌ Error cerrando base de datos:', err);
                    } else {
                        console.log('\n✅ Diagnóstico completado');
                        console.log('\n💡 RECOMENDACIONES:');
                        console.log('1. Verificar que el servidor esté usando la base de datos correcta');
                        console.log('2. Reiniciar el servidor en Render');
                        console.log('3. Verificar las rutas de la API');
                    }
                    process.exit(0);
                });
            }, 2000);
        });
    });
}
