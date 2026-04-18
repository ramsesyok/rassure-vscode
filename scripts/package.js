const fs = require('fs');
const { execSync } = require('child_process');

fs.copyFileSync('README.vsce.md', 'README.md');

try {
  execSync('npx vsce package', { stdio: 'inherit' });
} finally {
  execSync('git checkout README.md', { stdio: 'inherit' });
}
