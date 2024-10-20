
'use strict'


const { transports, format, createLogger } = require('winston')
require('winston-daily-rotate-file'); 
const { v4: uuidv4 } = require('uuid');



class MyLogger {
    constructor() {
        const formatPrint = format.printf(({ level, message, sessionId, context, requestId, timestamp, metadata }) => {
            const formattedMetadata = metadata ? JSON.stringify(metadata, null, 2) : 'No metadata';
            return `${timestamp}::${level}::${JSON.stringify(sessionId) || 'No sessionId'}::${context || 'No context'}::${requestId || 'No requestId'}::${message}::${formattedMetadata}`;
        });

        this.logger = createLogger({
            format: format.combine(
                format.timestamp({
                    format: 'YYYY-MM-DD HH:mm:ss.SSS A'
                }),
                formatPrint
            ),
            transports: [
                new transports.Console(),
                new transports.DailyRotateFile({
                    dirname: 'src/logs',
                    filename: 'application-%DATE%.info.log',
                    datePattern: 'YYYY-MM',
                    zippedArchive: true, 
                    maxSize: '20m',             
                    maxFiles: '14d',
                    format: format.combine(
                        format.timestamp({
                            format: 'YYYY-MM-DD HH:mm:ss.SSS A'
                        }),
                        formatPrint
                    ),
                    level: 'info'
                }),
                new transports.DailyRotateFile({
                    dirname: 'src/logs',
                    filename: 'application-%DATE%.error.log',
                    datePattern: 'YYYY-MM',
                    zippedArchive: true,
                    maxSize: '20m',
                    maxFiles: '14d',
                    format: format.combine(
                        format.timestamp({
                            format: 'YYYY-MM-DD HH:mm:ss.SSS A'
                        }),
                        formatPrint
                    ),
                    level: 'error'
                })
            ]
        })
    }



    commonParams(params) {
        let context, reqSessionId, reqRequestId, metadata;
        if (params && typeof params === 'object' && !Array.isArray(params)) {
            context = params.context;
            metadata = params.metadata;
            reqSessionId = params.sessionId || uuidv4();
            reqRequestId = params.requestId || uuidv4();
        } else if (Array.isArray(params)) {
            [reqSessionId, reqRequestId, context, metadata] = params;
        }

        return {
            sessionId: String(reqSessionId || 'No sessionId'),
            requestId: String(reqRequestId || 'No requestId'),
            context: context || 'No context',
            metadata: metadata ? JSON.stringify(metadata, null, 2) : 'No metadata'
        };
    }





    log(message, params) {
        const paramLog = this.commonParams(params);
        const logObject = Object.assign({
            message 
        }, paramLog)
        this.logger.info(logObject);
    }

    error(message, params) {
        const paramLog = this.commonParams(params);
        const logObject = Object.assign({
            message 
        }, paramLog)
        this.logger.error(logObject);
    }
}


module.exports = new MyLogger()