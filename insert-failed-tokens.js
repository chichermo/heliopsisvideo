const https = require('https');

console.log('🚀 INSERTANDO TOKENS FALTANTES EN RENDER...\n');

// Tokens que fallaron en el primer intento
const failedTokens = [
    { email: 'chiara@brandstoffenslabbinck.com', token: 'd4585c2f30851d38df97533004faab0e', password: 'qkR8UkeL' },
    { email: 'info@knokke-interiors.be', token: 'd7e7ae1e1953a2512635840e6a36bd88', password: 'rMr2jtbL' },
    { email: 'kellefleerackers@hotmail.com', token: 'c12e1ab7cc23887acead9db2e27c52bc', password: 'mkjSjY7N' },
    { email: 'evy_verstrynge@hotmail.com', token: 'ee6c8bb94d76ba0e18b5b6de1324138b', password: '2SCSmij7' },
    { email: 'emilydelcroix123@gmail.com', token: 'eeec1ddfcd54f946a215f63aec1625e3', password: 'FzuI06Zn' },
    { email: 'jessie-westyn@hotmail.com', token: '0d6063265005fb10e7efe7fa81871006', password: 'kbE57BXB' },
    { email: 'ella8300@icloud.com', token: '7d5edb6595788b9ab48d55cba1a6dd05', password: 'troUdlXV' },
    { email: 'shana.moyaert@hotmail.com', token: '6679c5eff294e2014ace94dc0fbf2ac5', password: 'zlhv96rH' },
    { email: 'ymkevanherpe@hotmail.com', token: 'ddcffb66ce06e26493e679e095e6d54a', password: 'cgbR1cw2' },
    { email: 'christy.de.graeve@icloud.com', token: '387f385c619d17864eb6a610b2d6d77a', password: 'AqRwy2Zd' },
    { email: 'Carole.scrivens@gmail.com', token: '047993c360a8e0258e7b895d2ca62c77', password: 'naEmwyBH' }
];

console.log(`📊 Total de tokens faltantes: ${failedTokens.length}\n`);

// Función para insertar token en Render
function insertTokenToRender(tokenData, index) {
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

// Función principal para insertar tokens faltantes
async function insertFailedTokens() {
    let successCount = 0;
    let errorCount = 0;
    const successfulTokens = [];

    for (let i = 0; i < failedTokens.length; i++) {
        const tokenData = failedTokens[i];
        
        try {
            await insertTokenToRender(tokenData, i);
            console.log(`✅ Token ${i + 1}/${failedTokens.length} insertado: ${tokenData.email}`);
            console.log(`   Token: ${tokenData.token}`);
            console.log(`   Password: ${tokenData.password}`);
            console.log(`   Link: https://heliopsis-video.onrender.com/watch-simple/${tokenData.token}`);
            console.log('   ---');
            
            successfulTokens.push(tokenData);
            successCount++;
            
            // Pausa más larga entre requests para evitar límites
            if (i < failedTokens.length - 1) {
                console.log('⏳ Esperando 3 segundos antes del siguiente token...');
                await new Promise(resolve => setTimeout(resolve, 3000));
            }
            
        } catch (error) {
            console.log(`❌ Error insertando token ${i + 1} para ${tokenData.email}: ${error.message}`);
            errorCount++;
        }
    }

    console.log(`\n📈 RESUMEN:`);
    console.log(`   ✅ Tokens insertados exitosamente: ${successCount}/${failedTokens.length}`);
    console.log(`   ❌ Errores: ${errorCount}`);

    if (successCount > 0) {
        console.log(`\n🎉 ¡${successCount} tokens adicionales insertados en Render!`);
        console.log('🔗 Los usuarios ya pueden usar sus links y passwords originales');
        console.log('🔒 Todos los tokens son permanentes (999999 views)');
    }
}

// Ejecutar la inserción
insertFailedTokens().catch(error => {
    console.error('❌ Error general:', error.message);
});
