const sqlite3 = require('sqlite3').verbose();
const path = require('path');

console.log('🔍 VERIFICANDO BASE DE DATOS LOCAL DIRECTAMENTE...\n');

// Conectar a la base de datos local
const dbPath = path.join(__dirname, 'database', 'access_tokens.db');
const db = new sqlite3.Database(dbPath);

// Verificar todos los tokens simples
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
    
    console.log(`📊 TOTAL DE TOKENS EN BASE DE DATOS LOCAL: ${rows.length}\n`);
    
    if (rows.length === 0) {
        console.log('❌ No hay tokens en la base de datos local');
        db.close();
        return;
    }
    
    rows.forEach((row, index) => {
        const isPermanent = row.max_views >= 999999;
        const status = row.is_active === 1 ? 'ACTIVO' : 'INACTIVO';
        const permanentStatus = isPermanent ? 'PERMANENTE' : 'LIMITADO';
        
        console.log(`${index + 1}. ${row.email}`);
        console.log(`   Token: ${row.token.substring(0, 8)}...`);
        console.log(`   Password: ${row.password}`);
        console.log(`   Max Views: ${row.max_views} (${permanentStatus})`);
        console.log(`   Status: ${status}`);
        console.log(`   Created: ${row.created_at}`);
        console.log(`   Last Access: ${row.last_accessed || 'Never'}`);
        console.log(`   Notes: ${row.notes || 'None'}`);
        console.log(`   Link: https://heliopsis-video.onrender.com/watch-simple/${row.token}`);
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
            console.log(`      Token: ${row.token}`);
            console.log(`      Password: ${row.password}`);
            console.log(`      Link: https://heliopsis-video.onrender.com/watch-simple/${row.token}`);
        });
    }
    
    console.log('\n🔍 COMPARACIÓN CON RENDER:');
    console.log(`   Tokens locales: ${rows.length}`);
    console.log(`   Tokens en Render: 4 (verificado anteriormente)`);
    console.log(`   Diferencia: ${rows.length - 4} tokens no están en Render`);
    
    db.close();
});
