const { db } = require('./database/init');

console.log('🔍 Debug de base de datos...');

// Verificar tablas
db.all("SELECT name FROM sqlite_master WHERE type='table'", [], (err, tables) => {
    if (err) {
        console.error('❌ Error listando tablas:', err);
        return;
    }
    
    console.log('📋 Tablas encontradas:', tables.map(t => t.name));
    
    // Verificar si existe simple_tokens
    const hasSimpleTokens = tables.some(t => t.name === 'simple_tokens');
    console.log('🔑 Tabla simple_tokens existe:', hasSimpleTokens);
    
    if (hasSimpleTokens) {
        // Contar tokens
        db.get('SELECT COUNT(*) as count FROM simple_tokens', [], (err, result) => {
            if (err) {
                console.error('❌ Error contando tokens:', err);
            } else {
                console.log('📊 Total de tokens:', result.count);
                
                // Mostrar algunos tokens
                db.all('SELECT token, email, max_views, created_at FROM simple_tokens LIMIT 5', [], (err, rows) => {
                    if (err) {
                        console.error('❌ Error obteniendo tokens:', err);
                    } else {
                        console.log('🔑 Primeros 5 tokens:');
                        rows.forEach((row, i) => {
                            console.log(`${i+1}. ${row.token.substring(0,8)}... | ${row.email} | Max: ${row.max_views} | ${row.created_at}`);
                        });
                    }
                    process.exit();
                });
            }
        });
    } else {
        console.log('❌ No existe la tabla simple_tokens');
        process.exit();
    }
});
