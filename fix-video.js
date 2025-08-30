const { db } = require('./database/init');

console.log('🔧 Insertando video faltante...\n');

// Video ID que está en el token
const videoId = '38V037fiJbvUytXNPhAtQQ10bPNeLnD';

// Verificar si el video ya existe
db.get("SELECT * FROM allowed_videos WHERE video_id = ?", [videoId], (err, video) => {
    if (err) {
        console.log('❌ Error consultando video:', err.message);
        return;
    }
    
    if (video) {
        console.log('✅ Video ya existe:', video.title);
        finishFix();
        return;
    }
    
    console.log('📋 Video no encontrado, insertando...');
    
    // Insertar el video
    const sql = `INSERT INTO allowed_videos (video_id, title, description, file_size, duration, notes)
                  VALUES (?, ?, ?, ?, ?, ?)`;
    
    db.run(sql, [
        videoId,
        'Video de Prueba',
        'Video para probar el sistema de acceso controlado',
        1024 * 1024 * 100, // 100 MB
        120, // 2 minutos
        'Video insertado para corregir error 500'
    ], function(err) {
        if (err) {
            console.log('❌ Error insertando video:', err.message);
            return;
        }
        
        console.log('✅ Video insertado correctamente');
        console.log(`📊 ID del video: ${this.lastID}`);
        
        // Verificar que se insertó correctamente
        db.get("SELECT * FROM allowed_videos WHERE video_id = ?", [videoId], (err, video) => {
            if (err) {
                console.log('❌ Error verificando video:', err.message);
            } else {
                console.log('✅ Verificación exitosa:');
                console.log(`  - ID: ${video.id}`);
                console.log(`  - Título: ${video.title}`);
                console.log(`  - Video ID: ${video.video_id}`);
            }
            
            finishFix();
        });
    });
});

function finishFix() {
    console.log('\n🎯 CORRECCIÓN COMPLETADA');
    console.log('\n💡 PRÓXIMOS PASOS:');
    console.log('1. Inicia el servidor: npm start');
    console.log('2. Prueba la API: curl "http://localhost:3001/api/video/check/e9552cb9493b4413"');
    console.log('3. Si funciona, genera un nuevo token: POST /api/access/generate');
    
    // Cerrar base de datos
    db.close((err) => {
        if (err) {
            console.log('❌ Error cerrando base de datos:', err.message);
        } else {
            console.log('✅ Base de datos cerrada');
        }
    });
}
