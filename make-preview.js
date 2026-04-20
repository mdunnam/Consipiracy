const fs = require('fs');
let c = fs.readFileSync('G:/APPS/Consipiracy/homepage-redesign.html', 'utf8');
// Hide loading screen so browser can render the page
c = c.replace('id="ta-loading-screen"', 'id="ta-loading-screen" style="display:none"');
fs.writeFileSync('G:/APPS/Consipiracy/homepage-redesign-preview.html', c, 'utf8');
console.log('done');
