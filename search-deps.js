const fs = require('fs');
const path = require('path');

function search(dir, pattern) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            if (file !== '.git' && file !== '.next') {
                search(fullPath, pattern);
            }
        } else {
            const content = fs.readFileSync(fullPath, 'utf8');
            if (content.includes(pattern)) {
                console.log('Found in:', fullPath);
            }
        }
    }
}

try {
    console.log('Searching for "Missing SUPABASE" in node_modules...');
    search('./node_modules', 'Missing SUPABASE');
    console.log('Done.');
} catch (e) {
    console.error(e);
}
