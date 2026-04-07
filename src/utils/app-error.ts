/**
 * Custom error class that carries an HTTP status code.
 * Thrown by use-cases and caught by the global error handler.
 */
export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
  ) {
    super(message)
    this.name = 'AppError'
  }
}
