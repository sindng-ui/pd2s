import fs from 'fs';

const content = fs.readFileSync('.github/workflows/release.yml', 'utf-8');
console.log('Read release.yml successfully, length:', content.length, 'lines:', content.split('\n').length);
