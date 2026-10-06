import type { Request, Response, NextFunction } from 'express';
import client from 'prom-client';

// Collect default metrics (CPU, Memory, Event Loop Lag, etc.)
client.collectDefaultMetrics({ prefix: 'odoo_backend_' });

// HTTP Request Duration Histogram
export const httpRequestDurationMicroseconds = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.05, 0.1, 0.3, 0.5, 0.75, 1, 2, 5]
});

// HTTP Request Counter
export const httpRequestTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code']
});

export const metricsMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const end = httpRequestDurationMicroseconds.startTimer();
  
  res.on('finish', () => {
    const route = req.route ? req.route.path : req.path;
    const labels = {
      method: req.method,
      route: route || 'unknown',
      status_code: res.statusCode.toString()
    };
    
    end(labels);
    httpRequestTotal.inc(labels);
  });

  next();
};

export const getMetrics = async (): Promise<string> => {
  return await client.register.metrics();
};

export const getContentType = (): string => {
  return client.register.contentType;
};
