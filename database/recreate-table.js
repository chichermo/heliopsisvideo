const sqlite3 = require('sqlite3').verbose();

// Script para recrear la tabla simple_tokens con la estructura correcta
const db = new sqlite3.Database('./database/access_tokens.db', (err) => {
    if (err) {
        console.error('❌ Error conectando a la base de datos:', err.message);
        return;
    }
    console.log('✅ Conectado a la base de datos');
    
    // Eliminar tabla existente y recrearla
    console.log('🗑️ Eliminando tabla simple_tokens existente...');
    db.run('DROP TABLE IF EXISTS simple_tokens', (err) => {
        if (err) {
            console.error('❌ Error eliminando tabla:', err);
            return;
        }
        console.log('✅ Tabla eliminada');
        
        // Crear nueva tabla con estructura correcta
        console.log('🔧 Creando nueva tabla simple_tokens...');
        const createTableSQL = `
            CREATE TABLE simple_tokens (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                token TEXT UNIQUE NOT NULL,
                email TEXT NOT NULL,
                video_ids TEXT NOT NULL,
                password TEXT,
                views INTEGER DEFAULT 0,
                max_views INTEGER DEFAULT 1,
                is_permanent BOOLEAN DEFAULT 0,
                requires_password BOOLEAN DEFAULT 0,
                status TEXT DEFAULT 'activo',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                last_used DATETIME DEFAULT CURRENT_TIMESTAMP,
                is_active BOOLEAN DEFAULT 1,
                last_accessed DATETIME DEFAULT CURRENT_TIMESTAMP,
                notes TEXT,
                payment_status TEXT DEFAULT 'completed'
            )
        `;
        
        db.run(createTableSQL, (err) => {
            if (err) {
                console.error('❌ Error creando tabla:', err);
                return;
            }
            console.log('✅ Tabla simple_tokens creada con estructura correcta');
            
            // Insertar todos los tokens
            insertAllTokens();
        });
    });
});

function insertAllTokens() {
    console.log('🔄 Insertando todos los tokens...');
    
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
    
    let insertedCount = 0;
    
    tokens.forEach((tokenData, index) => {
        const insertSQL = `
            INSERT INTO simple_tokens 
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
        ], (err) => {
            if (err) {
                console.error(`❌ Error insertando token ${tokenData.token}:`, err);
            } else {
                console.log(`✅ Token ${index + 1}/${tokens.length}: ${tokenData.email}`);
                insertedCount++;
                
                if (insertedCount === tokens.length) {
                    console.log(`\n🎉 Todos los ${tokens.length} tokens insertados exitosamente`);
                    verifyTokens();
                }
            }
        });
    });
}

function verifyTokens() {
    console.log('\n🔍 Verificando tokens insertados...');
    
    // Probar la consulta exacta del panel de administración
    const query = `
        SELECT 
            id, token, email, password, video_ids, 
            created_at, views, max_views, is_active, 
            last_accessed, notes, payment_status
        FROM simple_tokens 
        ORDER BY created_at DESC
    `;
    
    db.all(query, [], (err, rows) => {
        if (err) {
            console.error('❌ Error en consulta del panel:', err);
        } else {
            console.log(`✅ Consulta exitosa: ${rows.length} tokens encontrados`);
            
            if (rows.length > 0) {
                console.log('\n📋 Primeros 5 tokens:');
                rows.slice(0, 5).forEach((row, index) => {
                    console.log(`   ${index + 1}. ${row.email} - ${row.token.substring(0, 8)}...`);
                });
                
                console.log('\n🎯 ¡Los tokens deberían aparecer ahora en el panel de administración!');
                console.log('🌐 URL: https://heliopsis-video.onrender.com/admin-simple');
            }
        }
        
        // Cerrar conexión
        setTimeout(() => {
            db.close((err) => {
                if (err) {
                    console.error('❌ Error cerrando base de datos:', err);
                } else {
                    console.log('✅ Conexión cerrada');
                }
                process.exit(0);
            });
        }, 2000);
    });
}
