const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Conectar a la base de datos
const dbPath = path.join(__dirname, 'database', 'access_tokens.db');
const db = new sqlite3.Database(dbPath);

console.log('🔍 VERIFICANDO TABLAS EN LA BASE DE DATOS...\n');

// Verificar qué tablas existen
db.all("SELECT name FROM sqlite_master WHERE type='table'", [], (err, rows) => {
    if (err) {
        console.error('❌ Error consultando tablas:', err);
        return;
    }
    
    console.log('📊 TABLAS ENCONTRADAS:');
    rows.forEach((row, index) => {
        console.log(`   ${index + 1}. ${row.name}`);
    });
    
    // Si existe la tabla simple_tokens, verificar su contenido
    const hasSimpleTokens = rows.some(row => row.name === 'simple_tokens');
    
    if (hasSimpleTokens) {
        console.log('\n🔍 VERIFICANDO CONTENIDO DE SIMPLE_TOKENS...');
        
        db.all('SELECT COUNT(*) as count FROM simple_tokens', [], (err, countRows) => {
            if (err) {
                console.error('❌ Error contando tokens:', err);
            } else {
                console.log(`📊 TOTAL DE TOKENS: ${countRows[0].count}`);
                
                if (countRows[0].count > 0) {
                    // Mostrar algunos tokens de ejemplo
                    db.all('SELECT token, email, max_views, is_active, created_at FROM simple_tokens ORDER BY created_at DESC LIMIT 5', [], (err, tokenRows) => {
                        if (err) {
                            console.error('❌ Error consultando tokens:', err);
                        } else {
                            console.log('\n📋 ÚLTIMOS 5 TOKENS:');
                            tokenRows.forEach((row, index) => {
                                const isPermanent = row.max_views >= 999999;
                                const status = row.is_active === 1 ? 'ACTIVO' : 'INACTIVO';
                                console.log(`   ${index + 1}. ${row.email} - ${isPermanent ? 'PERMANENTE' : 'LIMITADO'} (${row.max_views} views) - ${status}`);
                                console.log(`      Token: ${row.token.substring(0, 8)}...`);
                                console.log(`      Created: ${row.created_at}`);
                            });
                        }
                        db.close();
                    });
                } else {
                    console.log('❌ No hay tokens en la tabla simple_tokens');
                    db.close();
                }
            }
        });
    } else {
        console.log('❌ La tabla simple_tokens no existe');
        db.close();
    }
});
