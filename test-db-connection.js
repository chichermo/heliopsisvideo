console.log('🔍 Script iniciado...');

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

console.log('📦 Módulos cargados');

const dbPath = path.join(__dirname, 'database', 'access_tokens.db');
console.log('🔍 Ruta de la base de datos:', dbPath);

// Verificar si el archivo existe
const fs = require('fs');
if (fs.existsSync(dbPath)) {
    console.log('✅ Archivo de base de datos existe');
} else {
    console.log('❌ Archivo de base de datos NO existe');
    process.exit(1);
}

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('❌ Error conectando a la base de datos:', err.message);
        process.exit(1);
    }
    console.log('✅ Conectado a la base de datos');
    
    // Verificar si la tabla existe
    db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='simple_tokens'", [], (err, table) => {
        if (err) {
            console.error('❌ Error verificando tabla:', err);
            process.exit(1);
        }
        
        if (!table) {
            console.log('❌ La tabla simple_tokens no existe');
            process.exit(1);
        }
        
        console.log('✅ Tabla simple_tokens existe');
        
        // Contar tokens existentes
        db.get("SELECT COUNT(*) as count FROM simple_tokens", [], (err, result) => {
            if (err) {
                console.error('❌ Error contando tokens:', err);
                process.exit(1);
            }
            
            console.log(`📊 Tokens existentes en la base de datos: ${result.count}`);
            
            // Cerrar conexión
            db.close((err) => {
                if (err) {
                    console.error('❌ Error cerrando base de datos:', err.message);
                } else {
                    console.log('✅ Conexión cerrada');
                }
            });
        });
    });
});
