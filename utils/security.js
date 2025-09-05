const crypto = require('crypto');

/**
 * Genera un fingerprint único del dispositivo basado en User-Agent y IP
 */
function generateDeviceFingerprint(userAgent, ipAddress) {
    const data = `${userAgent}|${ipAddress}`;
    return crypto.createHash('sha256').update(data).digest('hex');
}

/**
 * Valida si un email tiene formato válido
 */
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Genera un token de acceso único
 */
function generateAccessToken() {
    return crypto.randomBytes(32).toString('hex');
}

/**
 * Valida si un token ha expirado
 */
function isTokenExpired(expiresAt) {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
}

/**
 * Valida si un token puede ser usado (no expirado, activo, dentro de límites)
 */
function isTokenValid(tokenData) {
    if (!tokenData.is_active) return false;
    if (isTokenExpired(tokenData.expires_at)) return false;
    if (tokenData.current_views >= tokenData.max_views) return false;
    return true;
}

/**
 * Extrae información del User-Agent
 */
function parseUserAgent(userAgent) {
    if (!userAgent) return { browser: 'Unknown', os: 'Unknown', device: 'Unknown' };
    
    const ua = userAgent.toLowerCase();
    
    // Detectar navegador
    let browser = 'Unknown';
    if (ua.includes('chrome')) browser = 'Chrome';
    else if (ua.includes('firefox')) browser = 'Firefox';
    else if (ua.includes('safari')) browser = 'Safari';
    else if (ua.includes('edge')) browser = 'Edge';
    
    // Detectar OS
    let os = 'Unknown';
    if (ua.includes('windows')) os = 'Windows';
    else if (ua.includes('mac')) os = 'macOS';
    else if (ua.includes('linux')) os = 'Linux';
    else if (ua.includes('android')) os = 'Android';
    else if (ua.includes('ios')) os = 'iOS';
    
    // Detectar dispositivo
    let device = 'Desktop';
    if (ua.includes('mobile')) device = 'Mobile';
    else if (ua.includes('tablet')) device = 'Tablet';
    
    return { browser, os, device };
}

/**
 * Valida si la IP está en una lista de IPs permitidas (para desarrollo)
 */
function isAllowedIP(ipAddress) {
    // En desarrollo, permitir todas las IPs
    // En producción, puedes agregar restricciones aquí
    return true;
}

module.exports = {
    generateDeviceFingerprint,
    isValidEmail,
    generateAccessToken,
    isTokenExpired,
    isTokenValid,
    parseUserAgent,
    isAllowedIP
};
