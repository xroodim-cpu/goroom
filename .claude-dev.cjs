process.chdir(__dirname);
require('child_process').execSync('"C:\\Program Files\\nodejs\\node.exe" node_modules/vite/bin/vite.js --port 3000', { stdio: 'inherit' });
