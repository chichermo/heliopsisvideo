const { db } = require('./database/init');

console.log('🔍 VERIFICANDO TOKENS EN LA BASE DE DATOS...\n');

// Verificar todos los tokens
const query = `
    SELECT 
        token, email, password, video_ids, 
        created_at, views, max_views, is_active, 
        last_accessed, notes, payment_status
    FROM simple_tokens 
    ORDER BY created_at DESC
`;

db.all(query, [], (err, rows) => {
    if (err) {
        console.error('❌ Error consultando tokens:', err);
        return;
    }
    
    console.log(`📊 TOTAL DE TOKENS: ${rows.length}\n`);
    
    rows.forEach((row, index) => {
        const isPermanent = row.max_views >= 999999;
        const status = row.is_active === 1 ? 'ACTIVO' : 'INACTIVO';
        const permanentStatus = isPermanent ? 'PERMANENTE' : 'LIMITADO';
        
        console.log(`${index + 1}. TOKEN: ${row.token.substring(0, 8)}...`);
        console.log(`   Email: ${row.email}`);
        console.log(`   Password: ${row.password}`);
        console.log(`   Max Views: ${row.max_views} (${permanentStatus})`);
        console.log(`   Current Views: ${row.views}`);
        console.log(`   Status: ${status}`);
        console.log(`   Created: ${row.created_at}`);
        console.log(`   Last Access: ${row.last_accessed || 'Never'}`);
        console.log(`   Notes: ${row.notes || 'None'}`);
        console.log(`   Payment: ${row.payment_status || 'Unknown'}`);
        console.log('   ---');
    });
    
    // Estadísticas
    const permanentTokens = rows.filter(row => row.max_views >= 999999);
    const activeTokens = rows.filter(row => row.is_active === 1);
    const todayTokens = rows.filter(row => {
        const today = new Date().toISOString().split('T')[0];
        return row.created_at.startsWith(today);
    });
    
    console.log('\n📈 ESTADÍSTICAS:');
    console.log(`   Tokens Permanentes: ${permanentTokens.length}/${rows.length}`);
    console.log(`   Tokens Activos: ${activeTokens.length}/${rows.length}`);
    console.log(`   Tokens de Hoy: ${todayTokens.length}`);
    
    if (todayTokens.length > 0) {
        console.log('\n🗓️ TOKENS CREADOS HOY:');
        todayTokens.forEach((row, index) => {
            const isPermanent = row.max_views >= 999999;
            console.log(`   ${index + 1}. ${row.email} - ${isPermanent ? 'PERMANENTE' : 'LIMITADO'} (${row.max_views} views)`);
        });
    }
    
    db.close();
});