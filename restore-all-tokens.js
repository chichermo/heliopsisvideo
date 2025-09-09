const https = require('https');

// Script para restaurar todos los tokens del usuario
async function restoreAllTokens() {
    console.log('🔄 Restaurando todos los tokens del usuario...');
    
    const url = 'https://heliopsis-video.onrender.com/api/restore-exact-tokens';
    
    const postData = JSON.stringify({});
    
    const options = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(postData)
        }
    };
    
    const req = https.request(url, options, (res) => {
        console.log(`📡 Status: ${res.statusCode}`);
        
        let data = '';
        res.on('data', (chunk) => {
            data += chunk;
        });
        
        res.on('end', () => {
            try {
                const response = JSON.parse(data);
                if (response.success) {
                    console.log('✅ Tokens restaurados exitosamente');
                    console.log(`📊 ${response.count} tokens insertados`);
                } else {
                    console.error('❌ Error restaurando tokens:', response.error);
                }
            } catch (error) {
                console.error('❌ Error parseando respuesta:', error);
                console.log('📄 Respuesta:', data);
            }
        });
    });
    
    req.on('error', (error) => {
        console.error('❌ Error en la petición:', error);
    });
    
    req.write(postData);
    req.end();
}

// Ejecutar restauración
restoreAllTokens();
