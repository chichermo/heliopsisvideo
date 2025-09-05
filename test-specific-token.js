const https = require('https');

console.log('🔍 PROBANDO TOKEN ESPECÍFICO: info@knokke-interiors.be\n');

// Token específico que estaba fallando
const tokenData = {
    email: 'info@knokke-interiors.be',
    token: 'd7e7ae1e1953a2512635840e6a36bd88',
    password: 'rMr2jtbL'
};

// Función para insertar token en Render
function insertTokenToRender(tokenData) {
    return new Promise((resolve, reject) => {
        const postData = JSON.stringify({
            token: tokenData.token,
            email: tokenData.email,
            password: tokenData.password,
            video_ids: '1-38V037fiJbvUytXNPhAtQQ10bPNeLnD,1gb3uJnvBvpZ1ob51uiOiwtrpo4MvGbdE',
            max_views: 999999,
            notes: 'Token original restaurado - Acceso permanente garantizado',
            payment_status: 'paid'
        });

        const options = {
            hostname: 'heliopsis-video.onrender.com',
            port: 443,
            path: '/api/video-simple/insert-token-direct',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
            }
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
            res.on('end', () => {
                try {
                    const response = JSON.parse(data);
                    if (response.success) {
                        resolve(response);
                    } else {
                        reject(new Error(response.error));
                    }
                } catch (error) {
                    reject(error);
                }
            });
        });

        req.on('error', (error) => {
            reject(error);
        });

        req.write(postData);
        req.end();
    });
}

// Función para verificar si el token existe
function checkToken(token) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'heliopsis-video.onrender.com',
            port: 443,
            path: `/api/video-simple/check-simple/${token}`,
            method: 'GET'
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
            res.on('end', () => {
                try {
                    const response = JSON.parse(data);
                    resolve(response);
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
async function testSpecificToken() {
    try {
        console.log('🔍 Verificando si el token ya existe...');
        const checkResult = await checkToken(tokenData.token);
        
        if (checkResult.success) {
            console.log('✅ El token ya existe en Render');
            console.log(`   Email: ${checkResult.data.email}`);
            console.log(`   Max Views: ${checkResult.data.max_views}`);
            console.log(`   Status: ${checkResult.data.is_active ? 'ACTIVO' : 'INACTIVO'}`);
        } else {
            console.log('❌ El token no existe, insertándolo...');
            
            const insertResult = await insertTokenToRender(tokenData);
            
            if (insertResult.success) {
                console.log('✅ Token insertado exitosamente');
                console.log(`   Email: ${tokenData.email}`);
                console.log(`   Token: ${tokenData.token}`);
                console.log(`   Password: ${tokenData.password}`);
                console.log(`   Link: https://heliopsis-video.onrender.com/watch-simple/${tokenData.token}`);
            }
        }
        
    } catch (error) {
        console.log(`❌ Error: ${error.message}`);
    }
}

// Ejecutar
testSpecificToken();
