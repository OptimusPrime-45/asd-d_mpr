import type { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import {
  BaseAppError,
  ValidationError,
  ConflictError,
  NotFoundError,
  BadRequestError,
} from '../errors/index.js';
import { logger } from '../utils/logger.js';
import { appErrorsTotal, normalizeRoute } from './metrics.middleware.js';

export const errorMiddleware = (err: any, req: Request, res: Response, next: NextFunction) => {
  const route = normalizeRoute(req);
  appErrorsTotal.inc({
    error_type: err?.name || 'Error',
    route
  });

  // 1. Handle Malformed JSON body parsing / SyntaxError from Express body-parser
  if (
    err instanceof SyntaxError &&
    'status' in err &&
    (err as any).status === 400 &&
    'body' in err
  ) {
    const badRequestError = new BadRequestError('Malformed JSON payload');
    return res.status(badRequestError.statusCode).json({
      success: false,
      message: badRequestError.message,
    });
  }

  // 2. Handle Prisma Client Known Request Errors (Database level constraints/errors)
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    let mappedError: BaseAppError;

    switch (err.code) {
      case 'P2002': {
        // Unique constraint violation (e.g. duplicate email)
        const target = (err.meta?.target as string[])?.join(', ') || 'field';
        mappedError = new ConflictError(`A record with this ${target} already exists.`);
        break;
      }
      case 'P2025': {
        // Record not found
        mappedError = new NotFoundError(err.message || 'Record not found.');
        break;
      }
      case 'P2003': {
        // Foreign key constraint violation (e.g. invalid role_id or company_id)
        const field = (err.meta?.field_name as string) || 'field';
        mappedError = new ValidationError(
          `Invalid reference: the provided ${field} does not exist.`,
          [
            {
              message: `Foreign key constraint failed on ${field}`,
              code: 'invalid_association',
            },
          ]
        );
        break;
      }
      default:
        // Fallback for other database request errors
        mappedError = new BadRequestError(`Database error: ${err.message}`);
        break;
    }

    return res.status(mappedError.statusCode).json({
      success: false,
      message: mappedError.message,
      ...(mappedError instanceof ValidationError ? { errors: mappedError.errors } : {}),
    });
  }

  // 3. Handle known application errors
  if (err instanceof BaseAppError) {
    if (!err.isOperational) {
      logger.error('Unexpected Error:', err);
    }

    const response: any = {
      success: false,
      message: err.message,
    };

    if (err instanceof ValidationError && err.errors.length > 0) {
      response.errors = err.errors;
    }

    return res.status(err.statusCode).json(response);
  }

  // 4. Fallback for unhandled internal server errors
  logger.error('Unhandled Error:', err);
  return res.status(500).json({
    success: false,
    message: 'Internal Server Error',
    stack: err.stack,
    name: err.name,
    msg: err.message,
  });
};
