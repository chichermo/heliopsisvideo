const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Script para insertar directamente los tokens en la base de datos
const tokens = [
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

// Conectar a la base de datos
const dbPath = path.join(__dirname, 'database', 'access_tokens.db');
console.log('🔍 Ruta de la base de datos:', dbPath);

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('❌ Error conectando a la base de datos:', err.message);
        return;
    }
    console.log('✅ Conectado a la base de datos');
    
    // Verificar si la tabla existe
    db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='simple_tokens'", [], (err, table) => {
        if (err) {
            console.error('❌ Error verificando tabla:', err);
            return;
        }
        
        if (!table) {
            console.log('❌ La tabla simple_tokens no existe');
            return;
        }
        
        console.log('✅ Tabla simple_tokens existe');
        
        // Contar tokens existentes
        db.get("SELECT COUNT(*) as count FROM simple_tokens", [], (err, result) => {
            if (err) {
                console.error('❌ Error contando tokens:', err);
                return;
            }
            
            console.log(`📊 Tokens existentes en la base de datos: ${result.count}`);
            
            // Insertar tokens
            insertTokens();
        });
    });
});

function insertTokens() {
    console.log('🔄 Iniciando inserción de tokens...');
    
    let insertedCount = 0;
    let errorCount = 0;
    let processedCount = 0;
    
    tokens.forEach((tokenData, index) => {
        const insertSQL = `
            INSERT OR REPLACE INTO simple_tokens 
            (token, email, video_ids, password, views, max_views, is_permanent, requires_password, status, is_active, last_accessed, notes, payment_status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        
        db.run(insertSQL, [
            tokenData.token,
            tokenData.email,
            JSON.stringify(['1-38V037fiJbvUytXNPhAtQQ10bPNeLnD', '1gb3uJnvBvpZ1ob51uiOiwtrpo4MvGbdE']),
            tokenData.password,
            0,
            999999,
            1,
            1,
            'permanente',
            1,
            new Date().toISOString(),
            'Token restaurado',
            'completed'
        ], function(err) {
            processedCount++;
            
            if (err) {
                console.error(`❌ Error insertando token ${tokenData.token}:`, err.message);
                errorCount++;
            } else {
                console.log(`✅ Token insertado: ${tokenData.email} (${index + 1}/${tokens.length})`);
                insertedCount++;
            }
            
            // Verificar si hemos procesado todos los tokens
            if (processedCount === tokens.length) {
                console.log('\n📊 RESUMEN DE INSERCIÓN:');
                console.log(`✅ Tokens insertados exitosamente: ${insertedCount}`);
                console.log(`❌ Errores: ${errorCount}`);
                console.log(`📊 Total procesados: ${processedCount}`);
                
                // Verificar el total final
                db.get("SELECT COUNT(*) as count FROM simple_tokens", [], (err, result) => {
                    if (err) {
                        console.error('❌ Error verificando total final:', err);
                    } else {
                        console.log(`📊 Total de tokens en la base de datos después de la inserción: ${result.count}`);
                    }
                    
                    // Cerrar conexión
                    db.close((err) => {
                        if (err) {
                            console.error('❌ Error cerrando base de datos:', err.message);
                        } else {
                            console.log('✅ Conexión cerrada');
                        }
                    });
                });
            }
        });
    });
}
