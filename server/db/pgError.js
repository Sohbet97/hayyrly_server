// Sequelize wraps pg driver errors (SequelizeForeignKeyConstraintError, SequelizeDatabaseError, ...)
// and moves the original pg error code to `error.original.code` / `error.parent.code`.
// Several controllers check `error.code` directly (e.g. '23503', '23514') to return friendly
// messages, exactly as they did against the raw `pg` driver. Re-attach `.code` before rethrowing
// so that existing controller error handling keeps working unchanged.
function normalizePgError(error) {
    const code = error?.original?.code || error?.parent?.code;
    if (code && !error.code) {
        error.code = code;
    }
    return error;
}

module.exports = { normalizePgError };
