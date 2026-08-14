export class AppError extends Error {
  constructor(public status: number, public code: string, message: string) { super(message); }
}
export const notFound = (resource: string) => new AppError(404, "NOT_FOUND", `${resource} not found`);
