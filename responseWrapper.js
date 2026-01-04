// responseWrapper.js
class ResponseWrapper {

    static success(data, message = 'Success', links = null, metadata = {}) {
        const response = {
            status: "OK",
            message: message,
            response: data
        };
    
        if (Object.keys(metadata).length > 0) {
            response.metadata = metadata;
        }
        
        return response;
    }

    static error(status, message, statusCode = 500, code = null, details = null) {
        const errorResponse = {
            status: status,
            message: message,
            response: null
        };
        
        if (code) {
            errorResponse.code = code;
        }
        
        if (details) {
            errorResponse.details = details;
        }
        
        return {
            ...errorResponse,
            _statusCode: statusCode 
        };
    }
    static notFound(message = 'Resource not found', details = null) {
        return this.error(
            "Not Found",
            message,
            404,
            "RESOURCE_NOT_FOUND",
            details
        );
    }

    static badRequest(message = 'Bad request', details = null) {
        return this.error(
            "Bad Request",
            message,
            400,
            "BAD_REQUEST",
            details
        );
    }

    static conflict(message = 'Resource conflict', details = null) {
        return this.error(
            "Conflict",
            message,
            409,
            "CONFLICT",
            details
        );
    }

    static notImplemented(message = 'Method not implemented', details = null) {
        return this.error(
            "Not Implemented",
            message,
            501,
            "NOT_IMPLEMENTED",
            details
        );
    }

    static serverError(message = 'Internal server error', details = null) {
        return this.error(
            "Internal Server Error",
            message,
            500,
            "SERVER_ERROR",
            details
        );
    }
}

module.exports = ResponseWrapper;