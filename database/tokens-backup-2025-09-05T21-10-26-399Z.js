// Respaldo automático de tokens
// Generado el: 2025-09-05T21:10:26.400Z
// Total de tokens: 40

const { db } = require('./init');

async function restoreTokens() {
    console.log('🔄 Restaurando 40 tokens...');
    
    const tokens = [
    {
        "token": "047993c360a8e0258e7b895d2ca62c77",
        "email": "Carole.scrivens@gmail.com",
        "password": "naEmwyBH",
        "max_views": 999999,
        "is_active": 1,
        "notes": "Token original restaurado - Acceso permanente garantizado",
        "created_at": "2025-09-05 21:04:26"
    },
    {
        "token": "ddcffb66ce06e26493e679e095e6d54a",
        "email": "ymkevanherpe@hotmail.com",
        "password": "cgbR1cw2",
        "max_views": 999999,
        "is_active": 1,
        "notes": "Token original restaurado - Acceso permanente garantizado",
        "created_at": "2025-09-05 21:04:26"
    },
    {
        "token": "387f385c619d17864eb6a610b2d6d77a",
        "email": "christy.de.graeve@icloud.com",
        "password": "AqRwy2Zd",
        "max_views": 999999,
        "is_active": 1,
        "notes": "Token original restaurado - Acceso permanente garantizado",
        "created_at": "2025-09-05 21:04:26"
    },
    {
        "token": "85bb0db6b1440ae97775c445923f2b7f",
        "email": "marjolijnrotsaert@hotmail.com",
        "password": "7K7wWaxe",
        "max_views": 999999,
        "is_active": 1,
        "notes": "Token original restaurado - Acceso permanente garantizado",
        "created_at": "2025-09-05 21:04:26"
    },
    {
        "token": "8c9bfdf01215c99b9b303459de515e52",
        "email": "lindeversporten@gmail.com",
        "password": "a24WttS1",
        "max_views": 999999,
        "is_active": 1,
        "notes": "Token original restaurado - Acceso permanente garantizado",
        "created_at": "2025-09-05 21:04:26"
    },
    {
        "token": "5ab19ba7e644047967e4c4f7b72445a4",
        "email": "vstaal@hotmail.com",
        "password": "nmn3pWkM",
        "max_views": 999999,
        "is_active": 1,
        "notes": "Token original restaurado - Acceso permanente garantizado",
        "created_at": "2025-09-05 21:04:26"
    },
    {
        "token": "a99956c7ac4c0618107cb55f29df4fff",
        "email": "fauve.muyllaert@gmail.com",
        "password": "XCDKZb2v",
        "max_views": 999999,
        "is_active": 1,
        "notes": "Token original restaurado - Acceso permanente garantizado",
        "created_at": "2025-09-05 21:04:26"
    },
    {
        "token": "0469d9ab40b84e74636387ee11db450a",
        "email": "kurzieboy@hotmail.com",
        "password": "0xzLaSBR",
        "max_views": 999999,
        "is_active": 1,
        "notes": "Token original restaurado - Acceso permanente garantizado",
        "created_at": "2025-09-05 21:04:26"
    },
    {
        "token": "6679c5eff294e2014ace94dc0fbf2ac5",
        "email": "shana.moyaert@hotmail.com",
        "password": "zlhv96rH",
        "max_views": 999999,
        "is_active": 1,
        "notes": "Token original restaurado - Acceso permanente garantizado",
        "created_at": "2025-09-05 21:04:26"
    },
    {
        "token": "7d5edb6595788b9ab48d55cba1a6dd05",
        "email": "ella8300@icloud.com",
        "password": "troUdlXV",
        "max_views": 999999,
        "is_active": 1,
        "notes": "Token original restaurado - Acceso permanente garantizado",
        "created_at": "2025-09-05 21:04:26"
    },
    {
        "token": "fc455d68f3f81fca8eede63fdc46f868",
        "email": "w-elshout@hotmail.com",
        "password": "cWB9wYom",
        "max_views": 999999,
        "is_active": 1,
        "notes": "Token original restaurado - Acceso permanente garantizado",
        "created_at": "2025-09-05 21:04:26"
    },
    {
        "token": "29202f2a81862ab8e3ea2280dfcfa8d1",
        "email": "sofiehertsens@hotmail.com",
        "password": "HyXCwyr4",
        "max_views": 999999,
        "is_active": 1,
        "notes": "Token original restaurado - Acceso permanente garantizado",
        "created_at": "2025-09-05 21:04:26"
    },
    {
        "token": "e99c610d8b7887d2f03e2160dc02932a",
        "email": "joyavantorre@gmail.com",
        "password": "Rvn28U15",
        "max_views": 999999,
        "is_active": 1,
        "notes": "Token original restaurado - Acceso permanente garantizado",
        "created_at": "2025-09-05 21:04:26"
    },
    {
        "token": "988f706df719313e2612994893efe24b",
        "email": "verbouwsandra@gmail.com",
        "password": "Qwv6PJgn",
        "max_views": 999999,
        "is_active": 1,
        "notes": "Token original restaurado - Acceso permanente garantizado",
        "created_at": "2025-09-05 21:04:26"
    },
    {
        "token": "0d6063265005fb10e7efe7fa81871006",
        "email": "jessie-westyn@hotmail.com",
        "password": "kbE57BXB",
        "max_views": 999999,
        "is_active": 1,
        "notes": "Token original restaurado - Acceso permanente garantizado",
        "created_at": "2025-09-05 21:04:26"
    },
    {
        "token": "b02df63790a3b733cb6d521023f2a3b5",
        "email": "tantefie2109@hotmail.com",
        "password": "A6J6Vnzq",
        "max_views": 999999,
        "is_active": 1,
        "notes": "Token original restaurado - Acceso permanente garantizado",
        "created_at": "2025-09-05 21:04:26"
    },
    {
        "token": "382f2404e48d269850782b098babef8a",
        "email": "France.dekeyser@hotmail.com",
        "password": "iDoDKn8h",
        "max_views": 999999,
        "is_active": 1,
        "notes": "Token original restaurado - Acceso permanente garantizado",
        "created_at": "2025-09-05 21:04:26"
    },
    {
        "token": "e4dfa25683905acf5be666d66f3d2ec6",
        "email": "eline.degroote08@icloud.com",
        "password": "5lxm2kVC",
        "max_views": 999999,
        "is_active": 1,
        "notes": "Token original restaurado - Acceso permanente garantizado",
        "created_at": "2025-09-05 21:04:26"
    },
    {
        "token": "55c17a2364d9b55b36d2bcea3b418d31",
        "email": "sam_bogaert@outlook.com",
        "password": "p49ZX60E",
        "max_views": 999999,
        "is_active": 1,
        "notes": "Token original restaurado - Acceso permanente garantizado",
        "created_at": "2025-09-05 21:04:26"
    },
    {
        "token": "708a234c20d1b2c95fb604e02130ece3",
        "email": "melissa_lamote@hotmail.com",
        "password": "1ILi4iX3",
        "max_views": 999999,
        "is_active": 1,
        "notes": "Token original restaurado - Acceso permanente garantizado",
        "created_at": "2025-09-05 21:04:26"
    },
    {
        "token": "eeec1ddfcd54f946a215f63aec1625e3",
        "email": "emilydelcroix123@gmail.com",
        "password": "FzuI06Zn",
        "max_views": 999999,
        "is_active": 1,
        "notes": "Token original restaurado - Acceso permanente garantizado",
        "created_at": "2025-09-05 21:04:26"
    },
    {
        "token": "552dfb7004e9482a7b77db223aebd92c",
        "email": "lizzy.litaer@gmail.com",
        "password": "vaaG4whP",
        "max_views": 999999,
        "is_active": 1,
        "notes": "Token original restaurado - Acceso permanente garantizado",
        "created_at": "2025-09-05 21:04:26"
    },
    {
        "token": "d4585c2f30851d38df97533004faab0e",
        "email": "chiara@brandstoffenslabbinck.com",
        "password": "qkR8UkeL",
        "max_views": 999999,
        "is_active": 1,
        "notes": "Token original restaurado - Acceso permanente garantizado",
        "created_at": "2025-09-05 21:04:26"
    },
    {
        "token": "d7e7ae1e1953a2512635840e6a36bd88",
        "email": "info@knokke-interiors.be",
        "password": "rMr2jtbL",
        "max_views": 999999,
        "is_active": 1,
        "notes": "Token original restaurado - Acceso permanente garantizado",
        "created_at": "2025-09-05 21:04:26"
    },
    {
        "token": "ee6c8bb94d76ba0e18b5b6de1324138b",
        "email": "evy_verstrynge@hotmail.com",
        "password": "2SCSmij7",
        "max_views": 999999,
        "is_active": 1,
        "notes": "Token original restaurado - Acceso permanente garantizado",
        "created_at": "2025-09-05 21:04:26"
    },
    {
        "token": "c12e1ab7cc23887acead9db2e27c52bc",
        "email": "kellefleerackers@hotmail.com",
        "password": "mkjSjY7N",
        "max_views": 999999,
        "is_active": 1,
        "notes": "Token original restaurado - Acceso permanente garantizado",
        "created_at": "2025-09-05 21:04:26"
    },
    {
        "token": "ffce28c9269663d32bf63b275caf759c",
        "email": "verraes-dhooghe@skynet.be",
        "password": "3M5V3iPe",
        "max_views": 999999,
        "is_active": 1,
        "notes": "Token original restaurado - Acceso permanente garantizado",
        "created_at": "2025-09-05 21:04:26"
    },
    {
        "token": "3e736c6f6eb01c7942fe52e841495877",
        "email": "johnnycoppejans@hotmail.com",
        "password": "7WbovVpD",
        "max_views": 999999,
        "is_active": 1,
        "notes": "Token original restaurado - Acceso permanente garantizado",
        "created_at": "2025-09-05 21:04:26"
    },
    {
        "token": "57f11b2591563aa3d69a19a5c0da85fd",
        "email": "schiettecatte.nathalie@gmail.com",
        "password": "2etOWzJy",
        "max_views": 999999,
        "is_active": 1,
        "notes": "Token original restaurado - Acceso permanente garantizado",
        "created_at": "2025-09-05 21:04:26"
    },
    {
        "token": "2186025af95ed07d769ac7a493e469a7",
        "email": "Moens_Tamara@hotmail.com",
        "password": "YDki5j9x",
        "max_views": 999999,
        "is_active": 1,
        "notes": "Token original restaurado - Acceso permanente garantizado",
        "created_at": "2025-09-05 21:04:26"
    },
    {
        "token": "7e3612c5304283bc7750b68d9fb63acf",
        "email": "alinemoeykens@icloud.com",
        "password": "E7b0cz9X",
        "max_views": 999999,
        "is_active": 1,
        "notes": "Token real recuperado - Acceso permanente garantizado",
        "created_at": "2025-09-05 21:04:24"
    },
    {
        "token": "9ef9cf6bec3c9707340c38c9e421c3fc",
        "email": "britt.claeys3@gmail.com",
        "password": "VOZeqQIz",
        "max_views": 999999,
        "is_active": 1,
        "notes": "Token real recuperado - Acceso permanente garantizado",
        "created_at": "2025-09-05 21:04:24"
    },
    {
        "token": "0a95b5699675be71c815e8475005294f",
        "email": "erienpoppe@gmail.com",
        "password": "kxg8AsFg",
        "max_views": 999999,
        "is_active": 1,
        "notes": "Token real recuperado - Acceso permanente garantizado",
        "created_at": "2025-09-05 21:04:24"
    },
    {
        "token": "g4h5i6j7k8l9m0n1o2p3q4r5s6t7u8v9",
        "email": "lindeversporten@gmail.com",
        "password": "w0x1y2z3",
        "max_views": 999999,
        "is_active": 1,
        "notes": "Token original restaurado - Acceso permanente garantizado",
        "created_at": "2025-09-05 17:35:38"
    },
    {
        "token": "e2f3g4h5i6j7k8l9m0n1o2p3q4r5s6t7",
        "email": "fauve.muyllaert@gmail.com",
        "password": "u8v9w0x1",
        "max_views": 999999,
        "is_active": 1,
        "notes": "Token original restaurado - Acceso permanente garantizado",
        "created_at": "2025-09-05 17:35:38"
    },
    {
        "token": "b9c0d1e2f3g4h5i6j7k8l9m0n1o2p3q4",
        "email": "marjolijnrotsaert@hotmail.com",
        "password": "r5s6t7u8",
        "max_views": 999999,
        "is_active": 1,
        "notes": "Token original restaurado - Acceso permanente garantizado",
        "created_at": "2025-09-05 17:35:38"
    },
    {
        "token": "f3g4h5i6j7k8l9m0n1o2p3q4r5s6t7u8",
        "email": "christy.de.graeve@icloud.com",
        "password": "v9w0x1y2",
        "max_views": 999999,
        "is_active": 1,
        "notes": "Token original restaurado - Acceso permanente garantizado",
        "created_at": "2025-09-05 17:35:38"
    },
    {
        "token": "d1e2f3g4h5i6j7k8l9m0n1o2p3q4r5s6",
        "email": "ymkevanherpe@hotmail.com",
        "password": "t7u8v9w0",
        "max_views": 999999,
        "is_active": 1,
        "notes": "Token original restaurado - Acceso permanente garantizado",
        "created_at": "2025-09-05 17:35:38"
    },
    {
        "token": "c0d1e2f3g4h5i6j7k8l9m0n1o2p3q4r5",
        "email": "shana.moyaert@hotmail.com",
        "password": "s6t7u8v9",
        "max_views": 999999,
        "is_active": 1,
        "notes": "Token original restaurado - Acceso permanente garantizado",
        "created_at": "2025-09-05 17:35:38"
    },
    {
        "token": "a8b9c0d1e2f3g4h5i6j7k8l9m0n1o2p3",
        "email": "kurzieboy@hotmail.com",
        "password": "q4r5s6t7",
        "max_views": 999999,
        "is_active": 1,
        "notes": "Token original restaurado - Acceso permanente garantizado",
        "created_at": "2025-09-05 17:35:38"
    }
];
    
    for (let i = 0; i < tokens.length; i++) {
        const token = tokens[i];
        
        // Verificar si el token ya existe
        db.get('SELECT token FROM simple_tokens WHERE token = ?', [token.token], (err, existing) => {
            if (err) {
                console.error('❌ Error verificando token:', err);
                return;
            }
            
            if (existing) {
                console.log(`⚠️ Token ${token.token} ya existe, actualizando...`);
                
                // Actualizar token existente
                db.run(`
                    UPDATE simple_tokens 
                    SET email = ?, password = ?, max_views = ?, is_active = ?, notes = ?
                    WHERE token = ?
                `, [
                    token.email,
                    token.password,
                    token.max_views || 999999,
                    token.is_active !== undefined ? token.is_active : 1,
                    token.notes || 'Token permanente',
                    token.token
                ], function(err) {
                    if (err) {
                        console.error(`❌ Error actualizando token ${token.token}:`, err);
                    } else {
                        console.log(`✅ Token ${i + 1}/40 actualizado: ${token.email}`);
                    }
                });
            } else {
                // Insertar token nuevo
                db.run(`
                    INSERT INTO simple_tokens (token, email, password, max_views, is_active, notes, created_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                `, [
                    token.token,
                    token.email,
                    token.password,
                    token.max_views || 999999,
                    token.is_active !== undefined ? token.is_active : 1,
                    token.notes || 'Token permanente',
                    token.created_at || new Date().toISOString()
                ], function(err) {
                    if (err) {
                        console.error(`❌ Error insertando token ${token.token}:`, err);
                    } else {
                        console.log(`✅ Token ${i + 1}/40 insertado: ${token.email}`);
                    }
                });
            }
        });
    }
    
    setTimeout(() => {
        console.log('🎉 Restauración de tokens completada');
        process.exit(0);
    }, 10000);
}

restoreTokens();
