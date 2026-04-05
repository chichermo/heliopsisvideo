const fs = require('fs');
const path = require('path');
const { db } = require('./init');

const DEFAULT_VIDEO_IDS_JSON = JSON.stringify([
    '1-38V037fiJbvUytXNPhAtQQ10bPNeLnD',
    '1gb3uJnvBvpZ1ob51uiOiwtrpo4MvGbdE',
]);

function normalizeToken(t) {
    if (t == null) return '';
    return String(t).trim().toLowerCase();
}

/**
 * Applies database/bundled-tokens.json on startup (UPSERT by token so passwords stay in sync with the repo).
 */
function mergeBundledTokensOnStartup() {
    return new Promise((resolve) => {
        const filepath = path.join(__dirname, 'bundled-tokens.json');
        if (!fs.existsSync(filepath)) {
            console.log('ℹ️ No bundled-tokens.json — skip merge');
            return resolve({ applied: 0, total: 0 });
        }

        let bundle;
        try {
            bundle = JSON.parse(fs.readFileSync(filepath, 'utf8'));
        } catch (e) {
            console.error('❌ Invalid bundled-tokens.json:', e.message);
            return resolve({ applied: 0, total: 0 });
        }

        const list = Array.isArray(bundle.tokens) ? bundle.tokens : [];
        if (list.length === 0) {
            return resolve({ applied: 0, total: 0 });
        }

        const fallbackPwd = process.env.BUNDLED_DEFAULT_PASSWORD;

        let done = 0;
        let applied = 0;
        const total = list.length;
        let settled = false;

        const finishOne = (err, changes) => {
            if (err) {
                console.warn('⚠️ bundled-merge:', err.message);
            } else if (changes > 0) {
                applied++;
            }
            done++;
            if (done >= total && !settled) {
                settled = true;
                console.log(`📦 Bundled tokens: ${applied} rows inserted/updated (${total} in file)`);
                resolve({ applied, total });
            }
        };

        for (const row of list) {
            const token = normalizeToken(row.token);
            const email = row.email != null ? String(row.email).trim() : '';
            let password = row.password != null ? String(row.password) : '';
            if (!password && fallbackPwd) {
                password = String(fallbackPwd);
            }
            if (!token || !email || !password) {
                process.nextTick(() => finishOne(null, 0));
                continue;
            }

            let videoIds = row.video_ids;
            if (Array.isArray(videoIds)) {
                videoIds = JSON.stringify(videoIds);
            }
            if (!videoIds) {
                videoIds = DEFAULT_VIDEO_IDS_JSON;
            }

            db.run(
                `INSERT INTO simple_tokens (token, email, password, video_ids, max_views, is_active)
                 VALUES (?, ?, ?, ?, 999999, 1)
                 ON CONFLICT(token) DO UPDATE SET
                   email = excluded.email,
                   password = excluded.password,
                   video_ids = excluded.video_ids,
                   max_views = CASE WHEN simple_tokens.max_views >= 999999 THEN simple_tokens.max_views ELSE 999999 END,
                   is_active = 1`,
                [token, email, password, videoIds],
                function onRun(err) {
                    finishOne(err, err ? 0 : this.changes);
                }
            );
        }
    });
}

module.exports = { mergeBundledTokensOnStartup, normalizeToken };
