const express = require('express');
const router = express.Router();

// ENDPOINT DE EMERGENCIA - SIEMPRE FUNCIONA
router.get('/emergency-token/:token', (req, res) => {
    const { token } = req.params;
    
    console.log(`🚨 EMERGENCY: Verificando token ${token}`);
    
    // TOKEN DE EMERGENCIA - SIEMPRE VÁLIDO
    const emergencyTokens = {
        '0a95b5699675be71c815e8475005294f': {
            email: 'erienpoppe@gmail.com',
            password: 'kxg8AsFg',
            video_ids: ['1-38V037fiJbvUytXNPhAtQQ10bPNeLnD', '1gb3uJnvBvpZ1ob51uiOiwtrpo4MvGbdE'],
            views: 0,
            max_views: 999999,
            is_permanent: true,
            requires_password: true,
            status: 'permanente'
        }
    };
    
    const tokenData = emergencyTokens[token];
    
    if (tokenData) {
        console.log(`✅ EMERGENCY: Token ${token} válido`);
        res.json({
            success: true,
            data: tokenData
        });
    } else {
        console.log(`❌ EMERGENCY: Token ${token} no encontrado`);
        res.json({
            success: false,
            error: 'Token no encontrado'
        });
    }
});

// ENDPOINT DE EMERGENCIA PARA CREDENCIALES
router.post('/emergency-token/:token', (req, res) => {
    const { token } = req.params;
    const { email, password } = req.body;
    
    console.log(`🚨 EMERGENCY POST: Token ${token}, Email: ${email}`);
    
    // TOKEN DE EMERGENCIA - SIEMPRE VÁLIDO
    const emergencyTokens = {
        '0a95b5699675be71c815e8475005294f': {
            email: 'erienpoppe@gmail.com',
            password: 'kxg8AsFg',
            video_ids: ['1-38V037fiJbvUytXNPhAtQQ10bPNeLnD', '1gb3uJnvBvpZ1ob51uiOiwtrpo4MvGbdE'],
            views: 0,
            max_views: 999999,
            is_permanent: true,
            requires_password: true,
            status: 'permanente'
        }
    };
    
    const tokenData = emergencyTokens[token];
    
    if (tokenData && tokenData.email === email && tokenData.password === password) {
        console.log(`✅ EMERGENCY POST: Credenciales válidas para ${token}`);
        res.json({
            success: true,
            message: 'Credenciales válidas',
            data: {
                token: token,
                email: email,
                video_ids: tokenData.video_ids,
                views: tokenData.views,
                max_views: tokenData.max_views,
                is_permanent: tokenData.is_permanent,
                status: tokenData.status
            }
        });
    } else {
        console.log(`❌ EMERGENCY POST: Credenciales inválidas para ${token}`);
        res.json({
            success: false,
            error: 'Credenciales incorrectas'
        });
    }
});

module.exports = router;
