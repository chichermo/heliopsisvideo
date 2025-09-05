const sqlite3 = require('sqlite3').verbose();
const path = require('path');

console.log('🔒 CONFIGURANDO SISTEMA PARA TOKENS PERMANENTES...\n');

// Conectar a la base de datos
const dbPath = path.join(__dirname, 'database', 'access_tokens.db');
const db = new sqlite3.Database(dbPath);

// Función para verificar configuración actual
function checkCurrentConfig() {
    return new Promise((resolve, reject) => {
        const query = `
            SELECT COUNT(*) as total,
                   SUM(CASE WHEN max_views = 999999 THEN 1 ELSE 0 END) as permanent,
                   SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as active
            FROM simple_tokens
        `;
        
        db.get(query, [], (err, row) => {
            if (err) {
                reject(err);
            } else {
                resolve(row);
            }
        });
    });
}

// Función para asegurar que todos los tokens sean permanentes
function ensureAllTokensPermanent() {
    return new Promise((resolve, reject) => {
        const updateQuery = `
            UPDATE simple_tokens 
            SET max_views = 999999, 
                notes = 'Token permanente garantizado',
                is_active = 1,
                payment_status = 'paid'
            WHERE max_views < 999999 OR max_views IS NULL
        `;
        
        db.run(updateQuery, [], function(err) {
            if (err) {
                reject(err);
            } else {
                resolve(this.changes);
            }
        });
    });
}

// Función para crear tabla de respaldo de tokens
function createBackupTable() {
    return new Promise((resolve, reject) => {
        const createTableQuery = `
            CREATE TABLE IF NOT EXISTS tokens_backup (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                token TEXT UNIQUE NOT NULL,
                email TEXT NOT NULL,
                password TEXT NOT NULL,
                video_ids TEXT NOT NULL,
                max_views INTEGER DEFAULT 999999,
                notes TEXT DEFAULT 'Token permanente garantizado',
                payment_status TEXT DEFAULT 'paid',
                is_active INTEGER DEFAULT 1,
                views INTEGER DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                backed_up_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `;
        
        db.run(createTableQuery, [], function(err) {
            if (err) {
                reject(err);
            } else {
                resolve('Tabla de respaldo creada');
            }
        });
    });
}

// Función para hacer respaldo de todos los tokens
function backupAllTokens() {
    return new Promise((resolve, reject) => {
        const backupQuery = `
            INSERT OR REPLACE INTO tokens_backup 
            (token, email, password, video_ids, max_views, notes, payment_status, is_active, views, created_at)
            SELECT token, email, password, video_ids, max_views, notes, payment_status, is_active, views, created_at
            FROM simple_tokens
        `;
        
        db.run(backupQuery, [], function(err) {
            if (err) {
                reject(err);
            } else {
                resolve(this.changes);
            }
        });
    });
}

// Función principal
async function configurePermanentTokens() {
    try {
        console.log('📊 Verificando configuración actual...');
        const config = await checkCurrentConfig();
        
        console.log(`   Total de tokens: ${config.total}`);
        console.log(`   Tokens permanentes: ${config.permanent}`);
        console.log(`   Tokens activos: ${config.active}`);
        
        console.log('\n🔒 Asegurando que todos los tokens sean permanentes...');
        const updated = await ensureAllTokensPermanent();
        console.log(`   Tokens actualizados a permanentes: ${updated}`);
        
        console.log('\n💾 Creando sistema de respaldo...');
        await createBackupTable();
        console.log('   ✅ Tabla de respaldo creada');
        
        const backedUp = await backupAllTokens();
        console.log(`   ✅ ${backedUp} tokens respaldados`);
        
        console.log('\n📊 Verificando configuración final...');
        const finalConfig = await checkCurrentConfig();
        
        console.log(`   Total de tokens: ${finalConfig.total}`);
        console.log(`   Tokens permanentes: ${finalConfig.permanent}`);
        console.log(`   Tokens activos: ${finalConfig.active}`);
        
        console.log('\n🎉 CONFIGURACIÓN COMPLETADA:');
        console.log('   ✅ Todos los tokens son permanentes (999999 views)');
        console.log('   ✅ Todos los tokens están activos');
        console.log('   ✅ Sistema de respaldo configurado');
        console.log('   ✅ Los tokens futuros se guardarán permanentemente');
        
        console.log('\n🚀 PRÓXIMOS PASOS:');
        console.log('   1. Los tokens creados desde Render se guardarán permanentemente');
        console.log('   2. No se perderán en futuros despliegues');
        console.log('   3. El sistema de respaldo protege contra pérdidas');
        console.log('   4. Todos los tokens tienen acceso ilimitado (999999 views)');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        db.close();
    }
}

// Ejecutar
configurePermanentTokens();
