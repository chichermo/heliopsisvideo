const { db } = require('./init');

console.log('🔧 Actualizando credenciales del token en Render...');

// Actualizar el token con las credenciales correctas
const updateQuery = `
    UPDATE simple_tokens 
    SET email = ?, password = ?, notes = ?
    WHERE token = ?
`;

const token = '0a95b5699675be71c815e8475005294f';
const email = 'erienpoppe@gmail.com';
const password = 'kxg8AsFg';
const notes = 'Token real recuperado - Acceso permanente garantizado';

db.run(updateQuery, [email, password, notes, token], function(err) {
    if (err) {
        console.error('❌ Error actualizando token:', err);
        return;
    }
    
    console.log(`✅ Token actualizado en Render: ${this.changes} filas afectadas`);
    
    // Verificar que se actualizó correctamente
    const verifyQuery = 'SELECT * FROM simple_tokens WHERE token = ?';
    db.get(verifyQuery, [token], (err, row) => {
        if (err) {
            console.error('❌ Error verificando token:', err);
            return;
        }
        
        if (row) {
            console.log('✅ Token verificado en Render:');
            console.log(`   Email: ${row.email}`);
            console.log(`   Password: ${row.password}`);
            console.log(`   Token: ${row.token}`);
            console.log(`   Notes: ${row.notes}`);
            console.log(`   Active: ${row.is_active}`);
        } else {
            console.log('❌ Token no encontrado en Render');
        }
    });
});

module.exports = { updateTokenCredentials };
