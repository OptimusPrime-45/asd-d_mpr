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

// Fleet & Domain Business Metrics
export const tripsTotal = new client.Counter({
  name: 'fleet_trips_total',
  help: 'Total trips by status and action',
  labelNames: ['action', 'status']
});

export const vehiclesActiveGauge = new client.Gauge({
  name: 'fleet_vehicles_active_gauge',
  help: 'Number of active vehicles in fleet by status',
  labelNames: ['status']
});

export const maintenanceTicketsTotal = new client.Counter({
  name: 'fleet_maintenance_tickets_total',
  help: 'Total maintenance tickets recorded',
  labelNames: ['priority', 'jira_synced']
});

export const jiraSyncTotal = new client.Counter({
  name: 'jira_sync_events_total',
  help: 'Total Jira integration sync operations and webhooks',
  labelNames: ['event_type', 'status']
});

export const appErrorsTotal = new client.Counter({
  name: 'app_errors_total',
  help: 'Total application errors encountered',
  labelNames: ['error_type', 'route']
});

export const normalizeRoute = (req: Request): string => {
  const rawPath = req.baseUrl ? `${req.baseUrl}${req.route?.path || req.path}` : (req.route?.path || req.path);
  if (!rawPath) return 'unknown';

  return rawPath
    .replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, ':id')
    .replace(/\/\d+/g, '/:id');
};

export const metricsMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const end = httpRequestDurationMicroseconds.startTimer();
  
  res.on('finish', () => {
    const route = normalizeRoute(req);
    const labels = {
      method: req.method,
      route,
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

