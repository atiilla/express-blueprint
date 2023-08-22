const {
    colors,
    createDirectory,
    createFile,
    displayMessage,
    installDependencies,
    installDevDependencies,
    npmInit,
    exec
} = require('./utils');

module.exports = (
    mysqlUser,
    mysqlHost,
    mysqlPassword,
    mysqlDatabase,
    portNumber,
    jwtSecret,
    projectName,
    rl
) => {
    npmInit()
        .then(() => {
            console.log('Initializing npm...');
            createFile('package.json', JSON.stringify({
                name: projectName,
                version: '0.0.1',
                description: '',
                main: 'app.js',
                scripts: {
                    start: 'node app.js',
                    dev: 'nodemon app.js'
                },
                keywords: [],
                author: '',
                license: 'ISC'
            }, null, 2));

            // Create project structure
            console.log('Creating project structure...');
            createDirectory('config');
            createDirectory('controller');
            createDirectory('routes');
            createDirectory('public');

            // Create files
            console.log('Creating files...');
            createFile('config/db.js', `const mysql = require('mysql');
module.exports = mysql.createConnection({
    user: '${mysqlUser}',
    password: '${mysqlPassword}',
    host: '${mysqlHost}',
    database: '${mysqlDatabase}'
                });
            `);

            createFile('routes/index.js', `
                const express = require('express');
                const router = express.Router();
                const { home } = require('../controller/index');
                
                router.get('/', home);
                
                module.exports = router;
            `);

            createFile('routes/user.js', `
                const express = require('express');
                const router = express.Router();
                const { register, login } = require('../controller/user');

                router.post('/register', register);
                router.post('/login', login);

                module.exports = router;

            `);

            createFile('controller/index.js', `
                const home = (req, res) => {
                    res.send('Hello World');
                };
                
                module.exports = {
                    home
                };
            `);

            createFile('controller/user.js', `
                const db = require('../config/db');
                const bcrypt = require('bcryptjs');
                const jwt = require('jsonwebtoken');

                const register = (req, res) => {
                    // We need to get variables sent from the form
                    const { username, password, email } = req.body;
                
                    const hashedPassword = bcrypt.hashSync(password, 10);
                    // Execute the SQL query
                
                    // Check if username or email already exists
                    db.query('SELECT * FROM users WHERE username = ? OR email = ?', [username, email], (error, results) => {
                        if (error) {
                            console.error('Error executing the register query: ' + error);
                            res.status(500).send('Internal Server Error');
                        } else {
                            if (results.length > 0) {
                                // User already exists
                                res.status(409).send('User already exists');
                            } else {
                                // User doesn't exist, insert new user
                                db.query('INSERT INTO users (username, email, password ) VALUES (?, ?, ?)', [username, email, hashedPassword], (error, results) => {
                                    if (error) {
                                        console.error('Error executing the register query: ' + error);
                                        res.status(500).send('Internal Server Error');
                                    } else {
                                        res.status(200).send('Registration successful');
                                    }
                                });
                            }
                        }
                    });
                
                }

                const login = (req, res) => {
                    // We need to get variables sent from the form
                    const { username, password } = req.body
                
                    // Execute the SQL query
                    db.query('SELECT * FROM users WHERE username = ?', [username], (error, results) => {
                        if (error) {
                            console.error('Error executing the login query: ' + error);
                            res.status(500).send('Internal Server Error');
                        } else {
                            if (results.length > 0) {
                                // User found, authentication successful

                                // // Compare the password
                                const comparisonResult = bcrypt.compareSync(password, results[0].password);
                                if (comparisonResult) {
                                    // Passwords match
                                    // Create a token
                                    const token = jwt.sign({
                                        username: results[0].username,
                                        password: results[0].password,
                                    }, process.env.JWT_SECRET, { expiresIn: '1h' });
                                    res.status(200).json({
                                        message: 'Authentication successful',
                                        payload: results[0],
                                        token: token
                                    })
                                } else {
                                    // Passwords don't match
                                    res.status(401).send('Invalid credentials');
                                }
                              
                               
                            } else {
                                // User not found or invalid credentials
                                res.status(401).send('Invalid credentials');
                            }
                        }
                    });
                }

                module.exports = {
                    register,
                    login
                };
            `);

            createFile('.env', `
MYSQL_USER="${mysqlUser}"
MYSQL_HOST="${mysqlHost}"
MYSQL_PASSWORD="${mysqlPassword}"
MYSQL_DATABASE="${mysqlDatabase}"
PORT=${portNumber}
JWT_SECRET="${jwtSecret}"
            `);

            createFile('app.js', `
                const express = require('express');
                const app = express();
                const cors = require('cors');
                const dotenv = require('dotenv');
                const path = require('path');
                const helmet = require('helmet');
                const rateLimit = require('express-rate-limit')
                const db = require('./config/db');
                const indexRouter = require('./routes/index');
                const userRouter = require('./routes/user');
                
                dotenv.config();
                
                app.use(cors());
                app.use(express.json());
                app.use(express.urlencoded({ extended: false }));
                app.use(helmet())
                app.use('/public', express.static(path.join(__dirname, 'public')));

                const limiter = rateLimit({
                    windowMs: 15 * 60 * 1000, // 15 minutes
                    max: 100, // Limit each IP to 100 requests per window (here, per 15 minutes)
                    standardHeaders: true, // Return rate limit info in the RateLimit headers
                    legacyHeaders: false, // Disable the X-RateLimit
                    // store: ... , // Use an external store for more precise rate limiting
                })
                
                // Apply the rate limiting middleware to all requests
                app.use(limiter)

                db.connect((err) => {
                    if (err) {
                        console.error('Error connecting to MySQL database:', err);
                    } else {
                        console.log('Connected to MySQL database');
                    }
                });
                
                app.use('/', indexRouter);
                app.use('/user', userRouter);
                
                app.listen(process.env.PORT || 3000, () => {
                    console.log('Server is running on port ' + (process.env.PORT || 3000));
                });
            `);

            // Install dependencies
            console.log('Installing dependencies...');
            installDependencies('mysql')
                .then(() => installDevDependencies())
                .then(() => {
                    displayMessage(`
                    Project generated successfully
                    What i did for you:
                    - Created project structure
                    - Created files
                    - Initialized npm
                    - Installed dependencies
                    - Installed dev dependencies
                    - Created .env file
                    - Database connection
                    - Authentication
                    - Rate limiting
                    - Error handling
                    - CORS
                    - Helmet
                    - Created a home route
                    - Created a user route

                    You can start the server by running ${colors.YELLOW}npm run dev${colors.NC}
                    `, colors.GREEN);
                    exec('code .'); // Opens project in Visual Studio Code
                    rl.close();
                })
                .catch((error) => {
                    console.error('Error installing dependencies:', error);
                    rl.close();
                });
        })
        .catch((error) => {
            console.error('Error initializing npm:', error);
            rl.close();
        });
};
