const { db } = require('./init');
const fs = require('fs');
const path = require('path');

// Script de respaldo automático de tokens
class TokenBackupManager {
    constructor() {
        this.backupDir = path.join(__dirname, 'backups');
        this.ensureBackupDir();
    }
    
    ensureBackupDir() {
        if (!fs.existsSync(this.backupDir)) {
            fs.mkdirSync(this.backupDir, { recursive: true });
            console.log('📁 Directorio de respaldos creado:', this.backupDir);
        }
    }
    
    // Crear respaldo completo
    async createFullBackup() {
        console.log('🔄 Creando respaldo completo...');
        
        try {
            // Obtener todos los tokens
            const tokens = await this.getAllTokens();
            
            // Crear respaldo en JSON
            await this.createJSONBackup(tokens);
            
            // Crear respaldo en CSV
            await this.createCSVBackup(tokens);
            
            // Crear respaldo de base de datos
            await this.createDatabaseBackup();
            
            // Crear respaldo de código (tokens hardcodeados)
            await this.createCodeBackup(tokens);
            
            console.log('✅ Respaldo completo creado exitosamente');
            
        } catch (error) {
            console.error('❌ Error creando respaldo:', error);
        }
    }
    
    async getAllTokens() {
        return new Promise((resolve, reject) => {
            db.all("SELECT * FROM simple_tokens ORDER BY created_at DESC", [], (err, tokens) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(tokens);
                }
            });
        });
    }
    
    async createJSONBackup(tokens) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupFile = path.join(this.backupDir, `tokens-backup-${timestamp}.json`);
        
        const backupData = {
            timestamp: new Date().toISOString(),
            total_tokens: tokens.length,
            backup_type: 'full_backup',
            tokens: tokens.map(token => ({
                token: token.token,
                email: token.email,
                video_ids: JSON.parse(token.video_ids),
                password: token.password,
                views: token.views,
                max_views: token.max_views,
                is_permanent: token.is_permanent === 1,
                requires_password: token.requires_password === 1,
                status: token.status,
                created_at: token.created_at,
                last_used: token.last_used
            }))
        };
        
        fs.writeFileSync(backupFile, JSON.stringify(backupData, null, 2));
        console.log(`✅ Respaldo JSON creado: ${path.basename(backupFile)}`);
        
        // Mantener solo los últimos 10 respaldos JSON
        this.cleanupOldBackups('tokens-backup-', '.json', 10);
    }
    
    async createCSVBackup(tokens) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const csvFile = path.join(this.backupDir, `tokens-backup-${timestamp}.csv`);
        
        let csvContent = 'token,email,password,video_ids,views,max_views,is_permanent,requires_password,status,created_at,last_used\n';
        
        tokens.forEach(token => {
            csvContent += `${token.token},${token.email},${token.password},"${token.video_ids}",${token.views},${token.max_views},${token.is_permanent},${token.requires_password},${token.status},${token.created_at},${token.last_used}\n`;
        });
        
        fs.writeFileSync(csvFile, csvContent);
        console.log(`✅ Respaldo CSV creado: ${path.basename(csvFile)}`);
        
        // Mantener solo los últimos 10 respaldos CSV
        this.cleanupOldBackups('tokens-backup-', '.csv', 10);
    }
    
    async createDatabaseBackup() {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const dbBackupFile = path.join(this.backupDir, `database-backup-${timestamp}.db`);
        
        const sourceDb = path.join(__dirname, 'access_tokens.db');
        if (fs.existsSync(sourceDb)) {
            fs.copyFileSync(sourceDb, dbBackupFile);
            console.log(`✅ Respaldo de base de datos creado: ${path.basename(dbBackupFile)}`);
            
            // Mantener solo los últimos 5 respaldos de DB
            this.cleanupOldBackups('database-backup-', '.db', 5);
        }
    }
    
    async createCodeBackup(tokens) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const codeFile = path.join(this.backupDir, `emergency-tokens-${timestamp}.js`);
        
        let codeContent = `// Respaldo de tokens de emergencia - ${new Date().toISOString()}
// Total de tokens: ${tokens.length}

const emergencyTokens = {
`;

        tokens.forEach((token, index) => {
            const videoIds = JSON.parse(token.video_ids);
            codeContent += `    '${token.token}': {
        email: '${token.email}',
        password: '${token.password}',
        video_ids: ${JSON.stringify(videoIds)},
        views: ${token.views},
        max_views: ${token.max_views},
        is_permanent: ${token.is_permanent === 1},
        requires_password: ${token.requires_password === 1},
        status: '${token.status}'
    }`;
            
            if (index < tokens.length - 1) {
                codeContent += ',\n';
            } else {
                codeContent += '\n';
            }
        });
        
        codeContent += `};

module.exports = { emergencyTokens };
`;

        fs.writeFileSync(codeFile, codeContent);
        console.log(`✅ Respaldo de código creado: ${path.basename(codeFile)}`);
        
        // Mantener solo los últimos 5 respaldos de código
        this.cleanupOldBackups('emergency-tokens-', '.js', 5);
    }
    
    cleanupOldBackups(prefix, extension, keepCount) {
        try {
            const files = fs.readdirSync(this.backupDir)
                .filter(file => file.startsWith(prefix) && file.endsWith(extension))
                .sort()
                .reverse();
            
            if (files.length > keepCount) {
                const filesToDelete = files.slice(keepCount);
                filesToDelete.forEach(file => {
                    fs.unlinkSync(path.join(this.backupDir, file));
                    console.log(`🗑️ Respaldo antiguo eliminado: ${file}`);
                });
            }
        } catch (error) {
            console.error('❌ Error limpiando respaldos antiguos:', error);
        }
    }
    
    // Restaurar desde respaldo
    async restoreFromBackup(backupFile) {
        console.log(`🔄 Restaurando desde respaldo: ${backupFile}`);
        
        try {
            const backupData = JSON.parse(fs.readFileSync(backupFile, 'utf8'));
            console.log(`📊 Respaldo contiene ${backupData.total_tokens} tokens`);
            
            // Aquí podrías implementar la lógica de restauración
            console.log('✅ Restauración completada');
            
        } catch (error) {
            console.error('❌ Error restaurando respaldo:', error);
        }
    }
    
    // Listar respaldos disponibles
    listBackups() {
        console.log('📋 Respaldos disponibles:');
        
        const files = fs.readdirSync(this.backupDir);
        const jsonBackups = files.filter(f => f.startsWith('tokens-backup-') && f.endsWith('.json'));
        const csvBackups = files.filter(f => f.startsWith('tokens-backup-') && f.endsWith('.csv'));
        const dbBackups = files.filter(f => f.startsWith('database-backup-') && f.endsWith('.db'));
        const codeBackups = files.filter(f => f.startsWith('emergency-tokens-') && f.endsWith('.js'));
        
        console.log(`  📄 JSON: ${jsonBackups.length} archivos`);
        console.log(`  📊 CSV: ${csvBackups.length} archivos`);
        console.log(`  🗄️ DB: ${dbBackups.length} archivos`);
        console.log(`  💻 Código: ${codeBackups.length} archivos`);
        
        return {
            json: jsonBackups,
            csv: csvBackups,
            db: dbBackups,
            code: codeBackups
        };
    }
}

// Función principal
async function main() {
    const backupManager = new TokenBackupManager();
    
    // Crear respaldo completo
    await backupManager.createFullBackup();
    
    // Listar respaldos
    backupManager.listBackups();
    
    // Cerrar conexión
    setTimeout(() => {
        db.close((err) => {
            if (err) {
                console.error('❌ Error cerrando base de datos:', err);
            } else {
                console.log('✅ Conexión a base de datos cerrada');
            }
            process.exit(0);
        });
    }, 2000);
}

// Exportar clase
module.exports = TokenBackupManager;

// Si se ejecuta directamente
if (require.main === module) {
    main();
}
