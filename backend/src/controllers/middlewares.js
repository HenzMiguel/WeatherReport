import { randomUUID } from 'node:crypto';
import { validate as validUuid } from 'uuid';
import { StatusCodes } from 'http-status-codes';
import { AppError } from '../services/errors.js';
export function correlation(logger = console) {
  return (req, res, next) => {
    const supplied = req.get('X-Correlation-Id');
    req.correlationId =
      supplied && validUuid(supplied) ? supplied : randomUUID();
    res.set('X-Correlation-Id', req.correlationId);
    const start = Date.now();
    res.on('finish', () =>
      logger.info(
        JSON.stringify({
          event: 'request',
          correlationId: req.correlationId,
          method: req.method,
          path: req.path,
          status: res.statusCode,
          durationMs: Date.now() - start,
        }),
      ),
    );
    next();
  };
}
export function collectMetrics(metrics) {
  return (req, res, next) => {
    res.on('finish', () => metrics.record(res.statusCode));
    next();
  };
}
export function errorHandler(logger = console) {
  return (error, req, res, next) => {
    if (res.headersSent) return next(error);
    const status =
      error instanceof AppError
        ? error.status
        : StatusCodes.INTERNAL_SERVER_ERROR;
    if (status === StatusCodes.INTERNAL_SERVER_ERROR)
      logger.error(
        JSON.stringify({
          event: 'internal_error',
          correlationId: req.correlationId,
          reason: error.message,
        }),
      );
    res.status(status).json({
      mensagem_erro:
        error instanceof AppError
          ? error.message
          : 'Ocorreu um erro interno. Tente novamente.',
      codigo_status: status,
      timestamp: new Date().toISOString(),
      caminho: req.path,
    });
  };
}
export function requireAdmin(auth) {
  return (req, res, next) => {
    const authorization = req.get('Authorization');
    if (!authorization?.startsWith('Bearer '))
      return next(
        new AppError(
          StatusCodes.UNAUTHORIZED,
          'É necessário entrar como administrador para acessar este conteúdo.',
        ),
      );
    try {
      req.admin = auth.verify(authorization.slice('Bearer '.length));
      next();
    } catch (error) {
      next(error);
    }
  };
}
