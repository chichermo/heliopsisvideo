const sqlite3 = require('sqlite3').verbose();
const path = require('path');

console.log('🚨 CORRIGIENDO ERROR - RESTAURANDO TOKENS ORIGINALES...\n');

// Conectar a la base de datos
const dbPath = path.join(__dirname, 'database', 'access_tokens.db');
const db = new sqlite3.Database(dbPath);

// Lista de tokens ORIGINALES que me enviaste
const originalTokens = [
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

console.log(`📊 Total de tokens ORIGINALES a restaurar: ${originalTokens.length}\n`);

// Función para eliminar tokens duplicados creados por error
function deleteDuplicateTokens() {
    return new Promise((resolve, reject) => {
        // Eliminar tokens que NO están en la lista original
        const deleteQuery = `
            DELETE FROM simple_tokens 
            WHERE email IN (
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
            )
            AND token NOT IN (
                '2186025af95ed07d769ac7a493e469a7',
                'd4585c2f30851d38df97533004faab0e',
                '3e736c6f6eb01c7942fe52e841495877',
                'ffce28c9269663d32bf63b275caf759c',
                '57f11b2591563aa3d69a19a5c0da85fd',
                '552dfb7004e9482a7b77db223aebd92c',
                'd7e7ae1e1953a2512635840e6a36bd88',
                'c12e1ab7cc23887acead9db2e27c52bc',
                'ee6c8bb94d76ba0e18b5b6de1324138b',
                'e4dfa25683905acf5be666d66f3d2ec6',
                '708a234c20d1b2c95fb604e02130ece3',
                'b02df63790a3b733cb6d521023f2a3b5',
                'eeec1ddfcd54f946a215f63aec1625e3',
                '988f706df719313e2612994893efe24b',
                '55c17a2364d9b55b36d2bcea3b418d31',
                '0d6063265005fb10e7efe7fa81871006',
                '382f2404e48d269850782b098babef8a',
                '7d5edb6595788b9ab48d55cba1a6dd05',
                '29202f2a81862ab8e3ea2280dfcfa8d1',
                'fc455d68f3f81fca8eede63fdc46f868',
                'e99c610d8b7887d2f03e2160dc02932a',
                '5ab19ba7e644047967e4c4f7b72445a4',
                '0469d9ab40b84e74636387ee11db450a',
                '85bb0db6b1440ae97775c445923f2b7f',
                '6679c5eff294e2014ace94dc0fbf2ac5',
                'ddcffb66ce06e26493e679e095e6d54a',
                'a99956c7ac4c0618107cb55f29df4fff',
                '387f385c619d17864eb6a610b2d6d77a',
                '8c9bfdf01215c99b9b303459de515e52',
                '047993c360a8e0258e7b895d2ca62c77'
            )
        `;
        
        db.run(deleteQuery, [], function(err) {
            if (err) {
                reject(err);
            } else {
                console.log(`🗑️ Tokens duplicados eliminados: ${this.changes}`);
                resolve(this.changes);
            }
        });
    });
}

// Función para restaurar tokens originales
function restoreOriginalTokens() {
    return new Promise((resolve, reject) => {
        let successCount = 0;
        let errorCount = 0;
        
        originalTokens.forEach((tokenData, index) => {
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
                'Token original restaurado - Acceso permanente garantizado',
                'paid'
            ], function(err) {
                if (err) {
                    console.log(`❌ Error restaurando token ${index + 1}: ${err.message}`);
                    errorCount++;
                } else {
                    console.log(`✅ Token original ${index + 1}/${originalTokens.length} restaurado: ${tokenData.email}`);
                    successCount++;
                }
                
                if (successCount + errorCount === originalTokens.length) {
                    resolve({ successCount, errorCount });
                }
            });
        });
    });
}

// Función principal
async function fixTokens() {
    try {
        console.log('🗑️ Eliminando tokens duplicados creados por error...');
        await deleteDuplicateTokens();
        
        console.log('\n🔄 Restaurando tokens originales...');
        const result = await restoreOriginalTokens();
        
        console.log(`\n📈 RESUMEN:`);
        console.log(`   ✅ Tokens originales restaurados: ${result.successCount}/${originalTokens.length}`);
        console.log(`   ❌ Errores: ${result.errorCount}`);
        
        if (result.successCount > 0) {
            console.log(`\n🎉 ¡${result.successCount} tokens originales restaurados!`);
            console.log('🔗 Los usuarios pueden usar sus links y passwords originales');
            console.log('🔒 Todos los tokens son permanentes (999999 views)');
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        db.close();
    }
}

// Ejecutar
fixTokens();
