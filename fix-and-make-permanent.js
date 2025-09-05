const { db } = require('./database/init');

console.log('🔧 Actualizando estructura de la tabla simple_tokens...');

// Agregar columnas faltantes
const alterQueries = [
    'ALTER TABLE simple_tokens ADD COLUMN notes TEXT',
    'ALTER TABLE simple_tokens ADD COLUMN last_accessed DATETIME',
    'ALTER TABLE simple_tokens ADD COLUMN payment_status TEXT DEFAULT "paid"'
];

let completedQueries = 0;

alterQueries.forEach((query, index) => {
    db.run(query, [], function(err) {
        if (err) {
            // Si la columna ya existe, no es un error
            if (err.message.includes('duplicate column name')) {
                console.log(`✅ Columna ya existe (${index + 1}/${alterQueries.length})`);
            } else {
                console.error(`❌ Error en query ${index + 1}:`, err.message);
            }
        } else {
            console.log(`✅ Columna agregada (${index + 1}/${alterQueries.length})`);
        }
        
        completedQueries++;
        
        if (completedQueries === alterQueries.length) {
            console.log('\n🔒 Haciendo tokens permanentes...');
            
            // Actualizar tokens a permanentes
            const updateQuery = `
                UPDATE simple_tokens 
                SET max_views = 999999, 
                    notes = 'Token permanente garantizado', 
                    payment_status = 'paid',
                    is_active = 1
                WHERE max_views < 999999
            `;
            
            db.run(updateQuery, [], function(err) {
                if (err) {
                    console.error('❌ Error actualizando tokens:', err);
                } else {
                    console.log(`✅ ${this.changes} tokens convertidos a permanentes`);
                    
                    // Verificar resultado
                    db.all('SELECT token, email, max_views FROM simple_tokens', [], (err, rows) => {
                        if (err) {
                            console.error('❌ Error verificando tokens:', err);
                        } else {
                            console.log('\n📊 TOKENS PERMANENTES:');
                            rows.forEach((row, i) => {
                                const isPermanent = row.max_views >= 999999;
                                const status = isPermanent ? '✅ PERMANENTE' : '⚠️ TEMPORAL';
                                console.log(`${i+1}. ${row.token.substring(0,8)}... | ${row.email} | ${status}`);
                            });
                            
                            const permanentes = rows.filter(row => row.max_views >= 999999).length;
                            console.log(`\n🎉 Resumen: ${permanentes}/${rows.length} tokens son permanentes`);
                            console.log('🔗 Los links de acceso están listos para usar');
                        }
                        process.exit();
                    });
                }
            });
        }
    });
});
