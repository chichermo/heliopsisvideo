const { db } = require('./database/init');

console.log('🔒 Haciendo tokens permanentes...');

const updateQuery = `
    UPDATE simple_tokens 
    SET max_views = 999999, 
        notes = COALESCE(notes, '') || ' | Token permanente garantizado', 
        payment_status = 'paid',
        is_active = 1
    WHERE max_views < 999999
`;

db.run(updateQuery, [], function(err) {
    if (err) {
        console.error('❌ Error actualizando tokens:', err);
    } else {
        console.log(`✅ ${this.changes} tokens convertidos a permanentes`);
        
        // Verificar el resultado
        db.all('SELECT token, email, max_views, notes FROM simple_tokens', [], (err, rows) => {
            if (err) {
                console.error('❌ Error verificando tokens:', err);
            } else {
                console.log('\n📊 TOKENS PERMANENTES:');
                rows.forEach((row, i) => {
                    const isPermanent = row.max_views >= 999999;
                    const status = isPermanent ? '✅ PERMANENTE' : '⚠️ TEMPORAL';
                    console.log(`${i+1}. ${row.token.substring(0,8)}... | ${row.email} | ${status} | ${row.notes || 'Sin notas'}`);
                });
                
                const permanentes = rows.filter(row => row.max_views >= 999999).length;
                console.log(`\n🎉 Resumen: ${permanentes}/${rows.length} tokens son permanentes`);
            }
            process.exit();
        });
    }
});
