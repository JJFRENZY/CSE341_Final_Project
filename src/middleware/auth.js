// W05: Auth is optional. No-op guards so routes work now.
// W06: replace with real JWT/OAuth checks.

export const jwtCheck = (_req, _res, next) => next(); // no-op
export const needWrite = (_req, _res, next) => next(); // no-op for POST/PUT/DELETE
export const needRead  = (_req, _res, next) => next(); // optional guard for GETs
