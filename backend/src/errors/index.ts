import { BaseAppError } from './BaseAppError.js';
export * from './BaseAppError.js';

export class BadRequestError extends BaseAppError {
  constructor(message = 'Bad Request') {
    super(message, 400);
  }
}

export class ValidationError extends BaseAppError {
  public readonly errors: any[];
  constructor(message: string, errors: any[] = []) {
    super(message, 400);
    this.errors = errors;
  }
}

export class NotFoundError extends BaseAppError {
  constructor(message = 'Not Found') {
    super(message, 404);
  }
}

export class ConflictError extends BaseAppError {
  constructor(message = 'Conflict') {
    super(message, 409);
  }
}

export class UnauthorizedError extends BaseAppError {
  constructor(message = 'Unauthorized') {
    super(message, 401);
  }
}

export class ForbiddenError extends BaseAppError {
  constructor(message = 'Forbidden') {
    super(message, 403);
  }
}

export class InternalServerError extends BaseAppError {
  constructor(message = 'Internal Server Error') {
    super(message, 500, false);
  }
}
