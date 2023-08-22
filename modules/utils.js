const fs = require('fs');
const { exec } = require('child_process');
module.exports = {
    createFile: (filePath, content) => {
        fs.writeFileSync(filePath, content);
    },
    createDirectory: (dirPath) => {
        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath);
        }
    },
    displayMessage: function(message, color) {
        console.log(`${color}${message}${color}`);
    },
    clear: () => {
        console.clear();
    }
    ,
    npmInit: () => {
        return new Promise((resolve, reject) => {
            exec('npm init -y', (error) => {
                if (error) {
                    reject(error);
                } else {
                    resolve();
                }
            });
        });
    },
    installDependencies: (dbType) => {
        return new Promise((resolve, reject) => {
            exec(`npm i express cors ${dbType} helmet express-rate-limit jsonwebtoken bcryptjs --save`, (error) => {
                if (error) {
                    reject(error);
                } else {
                    resolve();
                }
            });
        });
    },
    installDevDependencies: () => {
        return new Promise((resolve, reject) => {
            exec('npm i dotenv --save-dev', (error) => {
                if (error) {
                    reject(error);
                } else {
                    resolve();
                }
            });
        });
    },
    colors: {
        GREEN: '\x1b[32m',
        YELLOW: '\x1b[33m',
        NC: '\x1b[0m'
    },
    exec
}