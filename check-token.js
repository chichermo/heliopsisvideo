const { db } = require('./database/init');

console.log('🔍 Verificando token específico...\n');

// Token que está fallando
const testToken = 'e9552cb9493b4413';

console.log(`📋 Verificando token: ${testToken}\n`);

// Verificar si el token existe
db.get("SELECT * FROM access_tokens WHERE token = ?", [testToken], (err, token) => {
    if (err) {
        console.log('❌ Error consultando token:', err.message);
        return;
    }
    
    if (!token) {
        console.log('❌ Token no encontrado en la base de datos');
        return;
    }
    
    console.log('✅ Token encontrado en la base de datos:');
    console.log('📊 Detalles del token:');
    console.log(`  - ID: ${token.id}`);
    console.log(`  - Token: ${token.token}`);
    console.log(`  - Email: ${token.email}`);
    console.log(`  - Video ID: ${token.video_id}`);
    console.log(`  - Creado: ${token.created_at}`);
    console.log(`  - Expira: ${token.expires_at}`);
    console.log(`  - Máximo de vistas: ${token.max_views}`);
    console.log(`  - Vistas actuales: ${token.current_views}`);
    console.log(`  - Activo: ${token.is_active}`);
    console.log(`  - Notas: ${token.notes || 'Sin notas'}`);
    
    console.log('\n📋 Verificando validez del token...');
    
    // Verificar si se puede usar
    const now = new Date();
    const expiresAt = token.expires_at ? new Date(token.expires_at) : null;
    const canUse = token.current_views < token.max_views && 
                  (!expiresAt || expiresAt > now);
    
    console.log(`📊 Análisis de validez:`);
    console.log(`  - Fecha actual: ${now.toISOString()}`);
    console.log(`  - Fecha de expiración: ${expiresAt ? expiresAt.toISOString() : 'Sin expiración'}`);
    console.log(`  - Vistas actuales < máximo: ${token.current_views} < ${token.max_views} = ${token.current_views < token.max_views}`);
    console.log(`  - No ha expirado: ${!expiresAt || expiresAt > now}`);
    console.log(`  - ¿Se puede usar?: ${canUse ? 'SÍ' : 'NO'}`);
    
    if (!canUse) {
        if (token.current_views >= token.max_views) {
            console.log('❌ Token no válido: Se excedió el número máximo de vistas');
        }
        if (expiresAt && expiresAt <= now) {
            console.log('❌ Token no válido: Ha expirado');
        }
    } else {
        console.log('✅ Token válido para uso');
    }
    
    console.log('\n📋 Verificando video en allowed_videos...');
    
    // Verificar si el video está en la lista de videos permitidos
    db.get("SELECT * FROM allowed_videos WHERE video_id = ?", [token.video_id], (err, video) => {
        if (err) {
            console.log('❌ Error consultando video:', err.message);
        } else if (!video) {
            console.log('❌ Video no encontrado en allowed_videos');
            console.log('💡 El video_id del token no coincide con ningún video permitido');
        } else {
            console.log('✅ Video encontrado en allowed_videos:');
            console.log(`  - ID: ${video.id}`);
            console.log(`  - Título: ${video.title}`);
            console.log(`  - Descripción: ${video.description || 'Sin descripción'}`);
            console.log(`  - Tamaño: ${video.file_size || 'Desconocido'}`);
            console.log(`  - Duración: ${video.duration || 'Desconocida'}`);
            console.log(`  - Activo: ${video.is_active}`);
        }
        
        // Cerrar base de datos
        db.close((err) => {
            if (err) {
                console.log('❌ Error cerrando base de datos:', err.message);
            } else {
                console.log('✅ Base de datos cerrada');
            }
            console.log('\n🎯 VERIFICACIÓN COMPLETADA');
        });
    });
});
