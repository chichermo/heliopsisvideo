const http = require('http');

console.log('🚀 CREANDO TOKENS USANDO SERVIDOR LOCAL...\n');

// Lista de emails de usuarios
const emails = [
    'Moens_Tamara@hotmail.com',
    'chiara@brandstoffenslabbinck.com', 
    'johnnycoppejans@hotmail.com',
    'verraes-dhooghe@skynet.be',
    'schiettecatte.nathalie@gmail.com',
    'lizzy.litaer@gmail.com',
    'info@knokke-interiors.be',
    'kellefleerackers@hotmail.com',
    'evy_verstrynge@hotmail.com',
    'eline.degroote08@icloud.com',
    'melissa_lamote@hotmail.com',
    'tantefie2109@hotmail.com',
    'emilydelcroix123@gmail.com',
    'verbouwsandra@gmail.com',
    'sam_bogaert@outlook.com',
    'jessie-westyn@hotmail.com',
    'France.dekeyser@hotmail.com',
    'ella8300@icloud.com',
    'sofiehertsens@hotmail.com',
    'w-elshout@hotmail.com',
    'joyavantorre@gmail.com',
    'vstaal@hotmail.com',
    'kurzieboy@hotmail.com',
    'marjolijnrotsaert@hotmail.com',
    'shana.moyaert@hotmail.com',
    'ymkevanherpe@hotmail.com',
    'fauve.muyllaert@gmail.com',
    'christy.de.graeve@icloud.com',
    'lindeversporten@gmail.com',
    'Carole.scrivens@gmail.com'
];

console.log(`📊 Total de usuarios: ${emails.length}\n`);

// Función para crear token usando servidor local
function createTokenLocal(email, index) {
    return new Promise((resolve, reject) => {
        const postData = JSON.stringify({
            email: email,
            video_ids: '1-38V037fiJbvUytXNPhAtQQ10bPNeLnD,1gb3uJnvBvpZ1ob51uiOiwtrpo4MvGbdE'
        });

        const options = {
            hostname: 'localhost',
            port: 3001,
            path: '/api/video-simple/create-simple',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
            }
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
                        resolve(response.data);
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

// Función principal
async function createAllTokensLocal() {
    let successCount = 0;
    let errorCount = 0;
    const createdTokens = [];

    for (let i = 0; i < emails.length; i++) {
        const email = emails[i];
        
        try {
            const tokenData = await createTokenLocal(email, i);
            console.log(`✅ Token ${i + 1}/${emails.length} creado para: ${email}`);
            console.log(`   Token: ${tokenData.token}`);
            console.log(`   Password: ${tokenData.password}`);
            console.log(`   Link: ${tokenData.watchUrl}`);
            console.log(`   Max Views: ${tokenData.max_views}`);
            console.log(`   Permanent: ${tokenData.is_permanent}`);
            console.log('   ---');
            
            createdTokens.push({
                email: email,
                token: tokenData.token,
                password: tokenData.password,
                link: tokenData.watchUrl
            });
            
            successCount++;
            
            // Pausa pequeña
            await new Promise(resolve => setTimeout(resolve, 100));
            
        } catch (error) {
            console.log(`❌ Error creando token ${i + 1} para ${email}: ${error.message}`);
            errorCount++;
        }
    }

    console.log(`\n📈 RESUMEN:`);
    console.log(`   ✅ Tokens creados exitosamente: ${successCount}/${emails.length}`);
    console.log(`   ❌ Errores: ${errorCount}`);

    if (successCount > 0) {
        console.log(`\n🎉 ¡${successCount} tokens creados localmente!`);
        console.log('🔗 Links de acceso para usuarios:');
        console.log('================================================');
        
        createdTokens.forEach((token, index) => {
            console.log(`${index + 1}. ${token.email}`);
            console.log(`   Link: ${token.link}`);
            console.log(`   Password: ${token.password}`);
            console.log('');
        });
        
        console.log('================================================');
        console.log('🔒 Todos los tokens son permanentes (999999 views)');
        console.log('\n📝 NOTA: Estos tokens están en la base de datos local.');
        console.log('   Para que estén disponibles en Render, necesitas:');
        console.log('   1. Subir los cambios a git');
        console.log('   2. Esperar que Render se despliegue');
        console.log('   3. Los tokens estarán disponibles automáticamente');
    }
}

// Ejecutar
createAllTokensLocal().catch(error => {
    console.error('❌ Error general:', error.message);
});
