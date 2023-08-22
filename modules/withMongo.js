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


module.exports = (mongodbUri, portNumber, jwtSecret, projectName, rl) => {
    npmInit()
        .then(() => {
            console.log('Initializing npm...')
            createFile('package.json', JSON.stringify({
                name: projectName,
                version: '1.0.0',
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
            createDirectory('models');
            createDirectory('routes');
            createDirectory('public');

            // Create files
            console.log('Creating files...');
            createFile('config/db.js', `const mongoose = require('mongoose');
    module.exports = () => {
        mongoose.connect(process.env.MONGO_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        useCreateIndex: true
        }).then(() => {
            console.log('Database connected');
        }).catch((err) => {
            console.log(err);
        });
};`);

            createFile('routes/index.js', `const express = require('express');
const router = express.Router();
const { home } = require('../controller/index');

router.get('/', home);

module.exports = router;`);

            createFile('controller/index.js', `const home = (req, res) => {
res.send('Hello World');
};

module.exports = {
home
};`);

            createFile('controller/user.js', `const User = require('../models/user');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const register = async (req, res) => {
try {
    const { username, email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
    username,
    email,
    password: hashedPassword
    });
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
    res.status(201).json({
    status: 'success',
    data: {
        user,
        token
    }
    });
} catch (error) {
    res.status(400).json({
    status: 'fail',
    message: error.message
    });
}
};

const login = async (req, res) => {
        try {
        const { username, password } = req.body;

        User.findOne({ username }, (err, user) => {
            if (err) {
            res.status(500).json({
                status: 'fail',
                message: 'Internal server error'
            });
            }
            if (!user) {
            res.status(404).json({
                status: 'fail',
                message: 'User not found'
            });
            }
            const isPasswordCorrect = bcrypt.compareSync(password, user.password);
            if (isPasswordCorrect) {
            const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
            res.status(200).json({
                status: 'success',
                data: {
                user,
                token
                }
            });
            }
        }
        );
    } catch (error) {
        res.status(400).json({
        status: 'fail',
        message: error.message
        });
    }
}

module.exports = {
register,
login
};`);

            createFile('.env', `MONGO_URI="${mongodbUri}"
PORT=${portNumber}
JWT_SECRET="${jwtSecret}"`);

            createFile('models/user.js', `const mongoose = require('mongoose');
const userSchema = new mongoose.Schema({
username: {
type: String,
required: true,
unique: true
},
email: {
type: String,
required: true,
unique: true
},
password: {
type: String,
required: true
}
});

const User = mongoose.model('User', userSchema);

module.exports = User;`);

            createFile('app.js', `const express = require('express');
const app = express();
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit')
const indexRouter = require('./routes/index');
const userRouter = require('./routes/user');

dotenv.config();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use('/public', express.static(path.join(__dirname, 'public')));

app.use(helmet())

const limiter = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 minutes
	max: 100, // Limit each IP to 100 requests per window (here, per 15 minutes)
	standardHeaders: true, // Return rate limit info in the RateLimit headers
	legacyHeaders: false, // Disable the X-RateLimit
	// store: ... , // Use an external store for more precise rate limiting
})

// Apply the rate limiting middleware to all requests
app.use(limiter)

require('./config/db')();

app.use('/', indexRouter);
app.use('/user', userRouter);

app.listen(process.env.PORT || 3000, () => {
console.log('Server is running on port ' + (process.env.PORT || 3000));
});`);

            // Install dependencies
            console.log('Installing dependencies...');
            installDependencies('mongoose')
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
}