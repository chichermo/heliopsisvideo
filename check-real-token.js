const { db } = require('./database/init');

console.log('🔍 Verificando token real encontrado...');

const realToken = '9ef9cf6bec3c9707340c38c9e421c3fc';

// Verificar si el token existe en simple_tokens
db.get('SELECT * FROM simple_tokens WHERE token = ?', [realToken], (err, token) => {
    if (err) {
        console.error('❌ Error consultando token:', err);
        return;
    }
    
    if (token) {
        console.log('✅ Token encontrado en simple_tokens:');
        console.log(`  - Token: ${token.token}`);
        console.log(`  - Email: ${token.email}`);
        console.log(`  - Password: ${token.password}`);
        console.log(`  - Video IDs: ${token.video_ids}`);
        console.log(`  - Max Views: ${token.max_views}`);
        console.log(`  - Created: ${token.created_at}`);
        console.log(`  - Is Active: ${token.is_active}`);
    } else {
        console.log('❌ Token no encontrado en simple_tokens');
        
        // Verificar en access_tokens
        db.get('SELECT * FROM access_tokens WHERE token = ?', [realToken], (err, accessToken) => {
            if (err) {
                console.error('❌ Error consultando access_tokens:', err);
                return;
            }
            
            if (accessToken) {
                console.log('✅ Token encontrado en access_tokens:');
                console.log(`  - Token: ${accessToken.token}`);
                console.log(`  - Email: ${accessToken.email}`);
                console.log(`  - Video ID: ${accessToken.video_id}`);
                console.log(`  - Max Views: ${accessToken.max_views}`);
                console.log(`  - Current Views: ${accessToken.current_views}`);
                console.log(`  - Created: ${accessToken.created_at}`);
                console.log(`  - Expires: ${accessToken.expires_at}`);
                console.log(`  - Is Active: ${accessToken.is_active}`);
            } else {
                console.log('❌ Token no encontrado en ninguna tabla');
                console.log('🔄 Necesitamos recrear este token');
            }
            process.exit();
        });
    }
});
