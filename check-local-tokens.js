const http = require('http');

console.log('🔍 VERIFICANDO TOKENS LOCALES...\n');

const options = {
    hostname: 'localhost',
    port: 3001,
    path: '/api/video-simple/list-simple',
    method: 'GET'
};

const req = http.request(options, (res) => {
    let data = '';
    
    res.on('data', (chunk) => {
        data += chunk;
    });
    
    res.on('end', () => {
        try {
            const response = JSON.parse(data);
            
            if (response.success) {
                console.log(`📊 TOTAL DE TOKENS LOCALES: ${response.data.length}\n`);
                
                response.data.forEach((token, index) => {
                    const isPermanent = token.max_views >= 999999;
                    const status = token.is_active ? 'ACTIVO' : 'INACTIVO';
                    const permanentStatus = isPermanent ? 'PERMANENTE' : 'LIMITADO';
                    
                    console.log(`${index + 1}. ${token.email}`);
                    console.log(`   Token: ${token.token.substring(0, 8)}...`);
                    console.log(`   Password: ${token.password}`);
                    console.log(`   Max Views: ${token.max_views} (${permanentStatus})`);
                    console.log(`   Status: ${status}`);
                    console.log(`   Created: ${token.created_at}`);
                    console.log(`   Link: http://localhost:3001/watch-simple/${token.token}`);
                    console.log('   ---');
                });
                
                // Estadísticas
                const permanentTokens = response.data.filter(token => token.max_views >= 999999);
                const activeTokens = response.data.filter(token => token.is_active);
                const todayTokens = response.data.filter(token => {
                    const today = new Date().toISOString().split('T')[0];
                    return token.created_at.startsWith(today);
                });
                
                console.log('\n📈 ESTADÍSTICAS LOCALES:');
                console.log(`   Tokens Permanentes: ${permanentTokens.length}/${response.data.length}`);
                console.log(`   Tokens Activos: ${activeTokens.length}/${response.data.length}`);
                console.log(`   Tokens de Hoy: ${todayTokens.length}`);
                
                if (todayTokens.length > 0) {
                    console.log('\n🗓️ TOKENS CREADOS HOY (LOCALES):');
                    todayTokens.forEach((token, index) => {
                        console.log(`   ${index + 1}. ${token.email} - ${token.token.substring(0, 8)}...`);
                    });
                }
                
            } else {
                console.log('❌ Error:', response.error);
            }
        } catch (error) {
            console.log('❌ Error parsing response:', error.message);
        }
    });
});

req.on('error', (error) => {
    console.log('❌ Error:', error.message);
});

req.end();
