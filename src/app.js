require('dotenv').config();
const compression = require("compression");
const express = require("express");
const morgan = require("morgan");
const session = require('express-session');
const { default: helmet } = require('helmet')
const { v4: uuidv4 } = require('uuid')
const myLogger = require('./loggers/mylogger.log')
const cors = require('cors');
const app = express();
const http = require('http');
const initElasticsearch = require('./dbs/init.elasticsearch');
const elasticsearchService = require('./services/elasticsearch.service');
const SocketIOService = require('./services/socketio.service')
const startWorkers = require('./utils/workers');

const corsOptions = {
    origin: process.env.CLIENT_ORIGIN,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true,
    optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

//config session
app.use(session({
    secret: process.env.SESSION_SECRET || 'session-userId',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } 
}));


//init middleware
app.use(morgan("dev"))
app.use(helmet())
app.use(compression())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))


// Tạo session ID cho người dùng khi đăng nhập
app.use((req, res, next) => {
    if (!req.session.userId) {
        req.session.userId = uuidv4(); 
    }
    console.log("req.session.userId:::", req.session.userId)
    next();
});


app.use((req, res, next) => {
    const requestId = req.headers['x-request-id'] //proxy 
    req.requestId = requestId ? requestId : uuidv4();
    console.log(" req.requestId :::", req.requestId);

    myLogger.log('Request received', {
        sessionId: req.session.userId,
        requestId: req.requestId,
        context: req.path,
        metadata: req.method === 'POST' ? req.body : req.query
    });
    next()
})




// *** init db ***
//init mongo
require('./dbs/init.mongodb')


//init redis
const initRedis = require('./dbs/init.redis')
initRedis.initRedis()

//init ioredis
const initIORedis = require('./dbs/init.ioredis');
initIORedis.initIORedis({
    IOREDIS_IS_ENABLED: true
})


//init elastic search  
initElasticsearch.initEs({
    ELASTICSEARCH_IS_ENABLED: true
})

async function initializeElasticsearch() {
    try {
        await elasticsearchService.initialize();
        await elasticsearchService.syncProductsToElasticsearch();
        await elasticsearchService.syncCategoriesToElasticsearch();
        await elasticsearchService.syncShopsToElasticsearch();
        await elasticsearchService.syncShopSalesToElasticsearch();
    } catch (error) {
        console.error('Error initializing Elasticsearch:', error);
    }
}
initializeElasticsearch();

//rabbitMQ
startWorkers();




// *** end ***



//init route
app.use('/', require('./routes'))

// socketIO
const server = http.createServer(app);
SocketIOService.init(server)


//handing error
app.use((req, res, next) => {
    const error = new Error('Not Found');
    error.status = 404
    next(error)
})

app.use((error, req, res, next) => {
    const statusCode = error.status || 500
    const resMessage = `${error.status} - ${Date.now() - error.now}ms - RESPONSE: ${JSON.stringify(error.message)}`
    myLogger.error('An error occurred', {
        sessionId: req.session.userId,
        requestId: req.requestId,
        context: req.path,
        metadata: {
            resMessage
        }
    });
    return res.status(statusCode).json({
        status: 'error',
        code: statusCode,
        stack: error.stack,
        message: error.message || 'Internal Server Error'
    })
})

module.exports = app;