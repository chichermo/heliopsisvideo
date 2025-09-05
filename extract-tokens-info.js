const http = require('http');

console.log('🔍 EXTRAYENDO INFORMACIÓN DE TOKENS CREADOS...\n');

// Función para obtener lista de tokens
function getTokensList() {
    return new Promise((resolve, reject) => {
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
                    resolve(response.data);
                } catch (error) {
                    reject(error);
                }
            });
        });

        req.on('error', (error) => {
            reject(error);
        });

        req.end();
    });
}

// Función principal
async function extractTokensInfo() {
    try {
        const tokens = await getTokensList();
        
        console.log(`📊 Total de tokens en base de datos: ${tokens.length}\n`);
        
        // Filtrar tokens reales (no de ejemplo)
        const realTokens = tokens.filter(token => 
            !token.email.includes('example') && 
            !token.email.includes('test') &&
            token.email !== 'test-nuevo@example.com'
        );
        
        console.log(`🔍 Tokens reales encontrados: ${realTokens.length}\n`);
        
        console.log('📋 INFORMACIÓN COMPLETA DE TOKENS:');
        console.log('================================================');
        
        realTokens.forEach((token, index) => {
            console.log(`${index + 1}. ${token.email}`);
            console.log(`   Token: ${token.token}`);
            console.log(`   Password: ${token.password}`);
            console.log(`   Link: https://heliopsis-video.onrender.com/watch-simple/${token.token}`);
            console.log(`   Max Views: ${token.max_views}`);
            console.log(`   Permanent: ${token.is_permanent}`);
            console.log(`   Status: ${token.is_active ? 'ACTIVO' : 'INACTIVO'}`);
            console.log(`   Notes: ${token.notes || 'N/A'}`);
            console.log('   ---');
        });
        
        console.log('================================================');
        console.log(`🎉 ¡${realTokens.length} tokens listos para usuarios!`);
        console.log('🔒 Todos los tokens son permanentes (999999 views)');
        console.log('📝 Los tokens están guardados en la base de datos local');
        console.log('🚀 Para que estén disponibles en Render, necesitas subir los cambios a git');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

// Ejecutar
extractTokensInfo();
