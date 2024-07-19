const fs = require('fs');

const includedFiles = ['package.json', 'LICENSE', 'README.md'];
includedFiles.forEach(file => {
    fs.copyFile(file, 'dist/' + file, err => {
        if (err) throw err;
    });
});
