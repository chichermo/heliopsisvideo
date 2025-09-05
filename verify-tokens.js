const { db } = require('./database/init');

console.log('🔍 Verificando tokens reales en base de datos local...');

const realTokens = [
    '0a95b5699675be71c815e8475005294f',
    '7e3612c5304283bc7750b68d9fb63acf',
    '9ef9cf6bec3c9707340c38c9e421c3fc'
];

db.all('SELECT token, email, max_views, is_active, views FROM simple_tokens WHERE token IN (?, ?, ?)', realTokens, (err, rows) => {
    if (err) {
        console.error('❌ Error consultando tokens:', err);
        return;
    }
    
    console.log(`📊 Tokens encontrados en BD local: ${rows.length}/3`);
    
    if (rows.length === 0) {
        console.log('❌ No hay tokens en la base de datos local');
    } else {
        rows.forEach((row, i) => {
            const isPermanent = row.max_views >= 999999;
            const status = isPermanent ? '✅ PERMANENTE' : '⚠️ TEMPORAL';
            console.log(`${i+1}. ${row.token.substring(0,8)}... | ${row.email} | ${status} | Views: ${row.views}/${row.max_views} | Active: ${row.is_active}`);
        });
    }
    
    console.log('\n🔍 Verificando si Render tiene los tokens...');
    console.log('⚠️  Los tokens están en BD local pero Render puede no tenerlos aún');
    console.log('🔄 Render se está desplegando automáticamente...');
    
    process.exit();
});
