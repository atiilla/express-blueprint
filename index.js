#!/usr/bin/env node
const path = require("path");
const {
    clear,
    colors,
    createDirectory,
    createFile,
    displayMessage,
} = require(path.join(__dirname, "modules", "utils"));

const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const withMongo = require(path.join(__dirname, "modules", "withMongo"));
const withMysql = require(path.join(__dirname, "modules", "withMysql"));


clear();
displayMessage('Express Project Generator Tool', colors.GREEN);
displayMessage('This tool will generate an Express project structure for you', colors.YELLOW);
console.log('-------------------------------------');
console.log('Author: https://github.com/atiilla');
console.log('Version: 0.0.1');
console.log('-------------------------------------');

rl.question(`${colors.YELLOW}Enter project name:${colors.NC}`, (projectName) => {
    createDirectory(projectName);
    process.chdir(projectName);

    createFile('.gitignore', 'node_modules\n.env\n');

    // Let user choice between mongodb or mysql
    rl.question(`${colors.YELLOW}1. MongoDB\n2. MySQL\n${colors.NC}`, (dbChoice) => {
        console.log(`You have selected ${dbChoice == 1 ? 'MongoDB' : 'MySQL'}`);
        if (dbChoice == 1) {

            // Project with mongodb
            rl.question(`${colors.YELLOW}Enter mongodb uri:${colors.NC}`, (mongodbUri) => {
                rl.question(`${colors.YELLOW}Enter port number:${colors.NC}`, (portNumber) => {
                    rl.question(`${colors.YELLOW}Enter jwt secret:${colors.NC}`, (jwtSecret) => {
                        withMongo(mongodbUri,portNumber,jwtSecret,projectName,rl);
                    });
                });
            });

        } else {
            rl.question(`${colors.YELLOW}Enter mysql host:${colors.NC}`, (mysqlHost) => {
                rl.question(`${colors.YELLOW}Enter port number:${colors.NC}`, (portNumber) => {
                    rl.question(`${colors.YELLOW}Enter mysql user:${colors.NC}`, (mysqlUser) => {
                        rl.question(`${colors.YELLOW}Enter mysql password:${colors.NC}`, (mysqlPassword) => {
                            rl.question(`${colors.YELLOW}Enter mysql database:${colors.NC}`, (mysqlDatabase) => {
                                // jwtsecret
                                rl.question(`${colors.YELLOW}Enter jwt secret:${colors.NC}`, (jwtSecret) => {

                                    withMysql(mysqlUser,mysqlHost,mysqlPassword,mysqlDatabase,portNumber,jwtSecret,projectName,rl)
                                })
                            });
                        });
                    });
                })
            });
        }
    });

});