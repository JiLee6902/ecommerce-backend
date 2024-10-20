'use strict'

const StatusCode = {
    FORBIDDEN: 403,
    CONFLICT: 409
}

const ReasonStatusCode = {
    FORBIDDEN: 'Bad request error',
    CONFLICT: 'Conflict error'
}

const logger = require('../loggers/winston.log')
const {
    StatusCodes,
    ReasonPhrases
} = require('../utils/httpStatusCode')

const myLogger = require('../loggers/mylogger.log')

class ErrorResponse extends Error {
    constructor(message, status) {
        super(message)
        this.status = status,
        this.now = Date.now();
    }
}

class ConflictRequestError extends ErrorResponse {
    constructor(message = ReasonStatusCode.CONFLICT, status = StatusCode.CONFLICT) {
        super(message, status)
    }
}

class BadRequestError extends ErrorResponse {
    constructor(message = ReasonStatusCode.FORBIDDEN, status = StatusCode.FORBIDDEN) {
        super(message, status)
    }
}


class AuthFailureError extends ErrorResponse {
    constructor(message = ReasonPhrases.UNAUTHORIZED, status = StatusCodes.UNAUTHORIZED) {
        super(message, status)
    }
}

class NotFoundError extends ErrorResponse {
    constructor(message = ReasonPhrases.NOT_FOUND, status = StatusCodes.NOT_FOUND) {
        super(message, status)
    }
}

class ForbiddenError extends ErrorResponse {
    constructor(message = ReasonPhrases.FORBIDDEN, status = StatusCodes.FORBIDDEN) {
        super(message, status)
    }
}

class RedisErrorReponse extends ErrorResponse {
    constructor(message = ReasonPhrases.INTERNAL_SERVER_ERROR, status = StatusCodes.INTERNAL_SERVER_ERROR) {
        super(message, status)
    }
}

module.exports = {
    ConflictRequestError,
    BadRequestError,
    AuthFailureError,
    NotFoundError,
    ForbiddenError,
    RedisErrorReponse
}