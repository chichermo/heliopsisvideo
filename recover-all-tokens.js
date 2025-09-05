const sqlite3 = require('sqlite3').verbose();
const https = require('https');
const path = require('path');

console.log('🚀 RECUPERANDO TODOS LOS TOKENS PERDIDOS...\n');

// Lista de tokens que se perdieron
const lostTokens = [
    { email: 'Moens_Tamara@hotmail.com', token: '2186025af95ed07d769ac7a493e469a7', password: 'YDki5j9x' },
    { email: 'chiara@brandstoffenslabbinck.com', token: 'd4585c2f30851d38df97533004faab0e', password: 'qkR8UkeL' },
    { email: 'johnnycoppejans@hotmail.com', token: '3e736c6f6eb01c7942fe52e841495877', password: '7WbovVpD' },
    { email: 'verraes-dhooghe@skynet.be', token: 'ffce28c9269663d32bf63b275caf759c', password: '3M5V3iPe' },
    { email: 'schiettecatte.nathalie@gmail.com', token: '57f11b2591563aa3d69a19a5c0da85fd', password: '2etOWzJy' },
    { email: 'lizzy.litaer@gmail.com', token: '552dfb7004e9482a7b77db223aebd92c', password: 'vaaG4whP' },
    { email: 'info@knokke-interiors.be', token: 'd7e7ae1e1953a2512635840e6a36bd88', password: 'rMr2jtbL' },
    { email: 'kellefleerackers@hotmail.com', token: 'c12e1ab7cc23887acead9db2e27c52bc', password: 'mkjSjY7N' },
    { email: 'evy_verstrynge@hotmail.com', token: 'ee6c8bb94d76ba0e18b5b6de1324138b', password: '2SCSmij7' },
    { email: 'eline.degroote08@icloud.com', token: 'e4dfa25683905acf5be666d66f3d2ec6', password: '5lxm2kVC' },
    { email: 'melissa_lamote@hotmail.com', token: '708a234c20d1b2c95fb604e02130ece3', password: '1ILi4iX3' },
    { email: 'tantefie2109@hotmail.com', token: 'b02df63790a3b733cb6d521023f2a3b5', password: 'A6J6Vnzq' },
    { email: 'emilydelcroix123@gmail.com', token: 'eeec1ddfcd54f946a215f63aec1625e3', password: 'FzuI06Zn' },
    { email: 'verbouwsandra@gmail.com', token: '988f706df719313e2612994893efe24b', password: 'Qwv6PJgn' },
    { email: 'sam_bogaert@outlook.com', token: '55c17a2364d9b55b36d2bcea3b418d31', password: 'p49ZX60E' },
    { email: 'jessie-westyn@hotmail.com', token: '0d6063265005fb10e7efe7fa81871006', password: 'kbE57BXB' },
    { email: 'France.dekeyser@hotmail.com', token: '382f2404e48d269850782b098babef8a', password: 'iDoDKn8h' },
    { email: 'ella8300@icloud.com', token: '7d5edb6595788b9ab48d55cba1a6dd05', password: 'troUdlXV' },
    { email: 'sofiehertsens@hotmail.com', token: '29202f2a81862ab8e3ea2280dfcfa8d1', password: 'HyXCwyr4' },
    { email: 'w-elshout@hotmail.com', token: 'fc455d68f3f81fca8eede63fdc46f868', password: 'cWB9wYom' },
    { email: 'joyavantorre@gmail.com', token: 'e99c610d8b7887d2f03e2160dc02932a', password: 'Rvn28U15' },
    { email: 'vstaal@hotmail.com', token: '5ab19ba7e644047967e4c4f7b72445a4', password: 'nmn3pWkM' },
    { email: 'kurzieboy@hotmail.com', token: '0469d9ab40b84e74636387ee11db450a', password: '0xzLaSBR' },
    { email: 'marjolijnrotsaert@hotmail.com', token: '85bb0db6b1440ae97775c445923f2b7f', password: '7K7wWaxe' },
    { email: 'shana.moyaert@hotmail.com', token: '6679c5eff294e2014ace94dc0fbf2ac5', password: 'zlhv96rH' },
    { email: 'ymkevanherpe@hotmail.com', token: 'ddcffb66ce06e26493e679e095e6d54a', password: 'cgbR1cw2' },
    { email: 'fauve.muyllaert@gmail.com', token: 'a99956c7ac4c0618107cb55f29df4fff', password: 'XCDKZb2v' },
    { email: 'christy.de.graeve@icloud.com', token: '387f385c619d17864eb6a610b2d6d77a', password: 'AqRwy2Zd' },
    { email: 'lindeversporten@gmail.com', token: '8c9bfdf01215c99b9b303459de515e52', password: 'a24WttS1' },
    { email: 'Carole.scrivens@gmail.com', token: '047993c360a8e0258e7b895d2ca62c77', password: 'naEmwyBH' }
];

console.log(`📊 Total de tokens a recuperar: ${lostTokens.length}\n`);

// Conectar a la base de datos local
const dbPath = path.join(__dirname, 'database', 'access_tokens.db');
const db = new sqlite3.Database(dbPath);

// Función para insertar token en base de datos local
function insertTokenLocal(tokenData) {
    return new Promise((resolve, reject) => {
        const insertQuery = `
            INSERT OR REPLACE INTO simple_tokens 
            (token, email, password, video_ids, max_views, notes, payment_status, is_active, views, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, 1, 0, CURRENT_TIMESTAMP)
        `;
        
        db.run(insertQuery, [
            tokenData.token,
            tokenData.email,
            tokenData.password,
            '1-38V037fiJbvUytXNPhAtQQ10bPNeLnD,1gb3uJnvBvpZ1ob51uiOiwtrpo4MvGbdE',
            999999,
            'Token recuperado - Acceso permanente garantizado',
            'paid'
        ], function(err) {
            if (err) {
                reject(err);
            } else {
                resolve(this.changes);
            }
        });
    });
}

// Función para insertar token en Render
function insertTokenToRender(tokenData, index) {
    return new Promise((resolve, reject) => {
        const postData = JSON.stringify({
            token: tokenData.token,
            email: tokenData.email,
            password: tokenData.password,
            video_ids: '1-38V037fiJbvUytXNPhAtQQ10bPNeLnD,1gb3uJnvBvpZ1ob51uiOiwtrpo4MvGbdE',
            max_views: 999999,
            notes: 'Token recuperado - Acceso permanente garantizado',
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

// Función principal para recuperar todos los tokens
async function recoverAllTokens() {
    let localSuccess = 0;
    let renderSuccess = 0;
    let errors = 0;

    console.log('🔄 Insertando tokens en base de datos local...\n');

    for (let i = 0; i < lostTokens.length; i++) {
        const tokenData = lostTokens[i];
        
        try {
            // Insertar en base de datos local
            await insertTokenLocal(tokenData);
            console.log(`✅ Local ${i + 1}/${lostTokens.length}: ${tokenData.email}`);
            localSuccess++;
            
            // Pequeña pausa
            await new Promise(resolve => setTimeout(resolve, 100));
            
        } catch (error) {
            console.log(`❌ Error local ${i + 1}: ${error.message}`);
            errors++;
        }
    }

    console.log('\n🔄 Insertando tokens en Render...\n');

    for (let i = 0; i < lostTokens.length; i++) {
        const tokenData = lostTokens[i];
        
        try {
            // Insertar en Render
            await insertTokenToRender(tokenData, i);
            console.log(`✅ Render ${i + 1}/${lostTokens.length}: ${tokenData.email}`);
            renderSuccess++;
            
            // Pausa entre requests para no sobrecargar Render
            if (i < lostTokens.length - 1) {
                await new Promise(resolve => setTimeout(resolve, 500));
            }
            
        } catch (error) {
            console.log(`❌ Error Render ${i + 1}: ${error.message}`);
            errors++;
        }
    }

    console.log(`\n📈 RESUMEN FINAL:`);
    console.log(`   ✅ Tokens insertados en local: ${localSuccess}/${lostTokens.length}`);
    console.log(`   ✅ Tokens insertados en Render: ${renderSuccess}/${lostTokens.length}`);
    console.log(`   ❌ Errores totales: ${errors}`);

    if (renderSuccess > 0) {
        console.log(`\n🎉 ¡${renderSuccess} tokens recuperados exitosamente!`);
        console.log('🔗 Los usuarios ya pueden acceder a sus videos');
        console.log('🔒 Todos los tokens son permanentes (999999 views)');
    }

    db.close();
}

// Ejecutar la recuperación
recoverAllTokens().catch(error => {
    console.error('❌ Error general:', error.message);
    db.close();
});
