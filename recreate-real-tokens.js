const { db } = require('./database/init');

console.log('🔄 Recreando tokens reales perdidos...');

// Tokens reales con información completa
const realTokens = [
    {
        token: '0a95b5699675be71c815e8475005294f',
        email: 'erienpoppe@gmail.com',
        password: 'kxg8AsFg',
        video_ids: '1-38V037fiJbvUytXNPhAtQQ10bPNeLnD,1gb3uJnvBvpZ1ob51uiOiwtrpo4MvGbdE'
    },
    {
        token: '7e3612c5304283bc7750b68d9fb63acf',
        email: 'alinemoeykens@icloud.com',
        password: 'E7b0cz9X',
        video_ids: '1-38V037fiJbvUytXNPhAtQQ10bPNeLnD,1gb3uJnvBvpZ1ob51uiOiwtrpo4MvGbdE'
    },
    {
        token: '9ef9cf6bec3c9707340c38c9e421c3fc',
        email: 'britt.claeys3@gmail.com',
        password: 'VOZeqQIz',
        video_ids: '1-38V037fiJbvUytXNPhAtQQ10bPNeLnD,1gb3uJnvBvpZ1ob51uiOiwtrpo4MvGbdE'
    }
];

console.log('📋 Tokens a recrear:');
realTokens.forEach((tokenData, index) => {
    console.log(`${index + 1}. Token: ${tokenData.token.substring(0,8)}... | Email: ${tokenData.email} | Password: ${tokenData.password}`);
});

console.log('\n🔄 Recreando tokens con información completa...');

realTokens.forEach((tokenData, index) => {
    const insertQuery = `
        INSERT OR REPLACE INTO simple_tokens 
        (token, email, password, video_ids, max_views, notes, payment_status, is_active)
        VALUES (?, ?, ?, ?, 999999, 'Token real recuperado - Acceso permanente garantizado', 'paid', 1)
    `;
    
    db.run(insertQuery, [
        tokenData.token, 
        tokenData.email, 
        tokenData.password, 
        tokenData.video_ids
    ], function(err) {
        if (err) {
            console.error(`❌ Error recreando token ${index + 1}:`, err.message);
        } else {
            console.log(`✅ Token ${index + 1} recreado: ${tokenData.token.substring(0,8)}... | ${tokenData.email}`);
        }
        
        if (index === realTokens.length - 1) {
            console.log('\n🎉 Verificando tokens recreados...');
            
            db.all('SELECT token, email, max_views FROM simple_tokens WHERE notes LIKE "%real%"', [], (err, rows) => {
                if (err) {
                    console.error('❌ Error verificando tokens:', err);
                } else {
                    console.log(`📊 Total de tokens reales recreados: ${rows.length}`);
                    rows.forEach((row, i) => {
                        console.log(`${i+1}. ${row.token.substring(0,8)}... | ${row.email} | PERMANENTE`);
                    });
                    
                    console.log('\n🔗 Links de acceso restaurados:');
                    console.log('================================================');
                    console.log('1. https://heliopsis-video.onrender.com/watch-simple/0a95b5699675be71c815e8475005294f');
                    console.log('   Email: erienpoppe@gmail.com | Password: kxg8AsFg');
                    console.log('');
                    console.log('2. https://heliopsis-video.onrender.com/watch-simple/7e3612c5304283bc7750b68d9fb63acf');
                    console.log('   Email: alinemoeykens@icloud.com | Password: E7b0cz9X');
                    console.log('');
                    console.log('3. https://heliopsis-video.onrender.com/watch-simple/9ef9cf6bec3c9707340c38c9e421c3fc');
                    console.log('   Email: britt.claeys3@gmail.com | Password: VOZeqQIz');
                    console.log('================================================');
                    
                    console.log('\n✅ ¡Todos los tokens han sido recreados y son permanentes!');
                    console.log('🚀 Los usuarios pueden acceder inmediatamente con sus emails y contraseñas.');
                }
                process.exit();
            });
        }
    });
});
