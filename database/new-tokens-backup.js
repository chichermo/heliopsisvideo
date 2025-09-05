// Respaldo automático de tokens nuevos
// Generado el: 2025-09-05T21:04:26.375Z
// Total de tokens: 10

const { db } = require('./init');

async function insertNewTokens() {
    console.log('🔄 Insertando 10 tokens nuevos...');
    
    const newTokens = [
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
    
    for (let i = 0; i < newTokens.length; i++) {
        const token = newTokens[i];
        
        // Verificar si el token ya existe
        db.get('SELECT token FROM simple_tokens WHERE token = ?', [token.token], (err, existing) => {
            if (err) {
                console.error('❌ Error verificando token:', err);
                return;
            }
            
            if (existing) {
                console.log(`⚠️ Token ${token.token} ya existe, saltando...`);
                return;
            }
            
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
                    console.log(`✅ Token ${i + 1}/10 insertado: ${token.email} | ${token.token}`);
                }
            });
        });
    }
    
    setTimeout(() => {
        console.log('🎉 Respaldo de tokens completado');
        process.exit(0);
    }, 5000);
}

insertNewTokens();
