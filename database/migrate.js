const { db } = require('./init');

// Script de migración para agregar el campo notes a allowed_videos
function migrateDatabase() {
    console.log('🔄 Iniciando migración de base de datos...');
    
    // Agregar campo notes a allowed_videos si no existe
    db.run(`ALTER TABLE allowed_videos ADD COLUMN notes TEXT`, (err) => {
        if (err) {
            if (err.message.includes('duplicate column name')) {
                console.log('✅ Campo notes ya existe en allowed_videos');
            } else {
                console.log('⚠️ Campo notes no se pudo agregar (puede que ya exista):', err.message);
            }
        } else {
            console.log('✅ Campo notes agregado a allowed_videos');
        }
        
        console.log('✅ Migración completada');
    });
}

// Ejecutar migración si se llama directamente
if (require.main === module) {
    migrateDatabase();
}

module.exports = { migrateDatabase };
