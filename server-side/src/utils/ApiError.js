class ApiError extends Error {
    constructor(statusCode, message) {
        super(message);
        this.statusCode = statusCode; // Fixed property name to match error handler
        this.isOperational = true; // Flag to identify expected errors
        Error.captureStackTrace(this, this.constructor);
    }
}

export default ApiError;
