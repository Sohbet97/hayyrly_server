class ApiError extends Error {
    constructor(status, message, errors = []) {
        super(message);
        this.status = status;
        this.errors = errors;
    }

    static UnauthorizedError(message = 'Unauthorized') {
        return new ApiError(401, message);
    }

    static BadRequest(message = 'Bad request', errors = []) {
        return new ApiError(400, message ?? 'Bad request', errors);
    }

    static NotFound(message = 'Not found') {
        return new ApiError(404, message);
    }

    static NotAllowed(message = 'Not allowed') {
        return new ApiError(403, message);
    }

    static Conflict(message = 'Conflict') {
        return new ApiError(409, message);
    }
}

module.exports = ApiError;
