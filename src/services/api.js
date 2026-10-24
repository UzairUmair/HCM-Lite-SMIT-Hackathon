// Replace these adapters with authenticated, authorized backend calls in phase two.
// Never create an admin, finalize payroll, or trust attendance time in the client.
export class ServiceUnavailableError extends Error { constructor() { super('This service is not connected yet. No changes were saved.'); } }
const unavailable = async () => { throw new ServiceUnavailableError(); };
export const authService = { signIn: unavailable, resetPassword: unavailable, changePassword: unavailable, bootstrapCompany: unavailable };
export const peopleService = { list: unavailable, save: unavailable, importCsv: unavailable };
export const attendanceService = { list: unavailable, checkIn: unavailable, checkOut: unavailable, correct: unavailable };
export const leaveService = { list: unavailable, submit: unavailable, review: unavailable };
export const payrollService = { list: unavailable, generate: unavailable, finalize: unavailable, download: unavailable };
export const aiService = { ask: unavailable, summarize: unavailable, parseLeave: unavailable };
