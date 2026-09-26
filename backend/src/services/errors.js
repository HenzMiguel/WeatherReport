import { StatusCodes } from 'http-status-codes';
export class AppError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}
export const unavailable = () =>
  new AppError(
    StatusCodes.SERVICE_UNAVAILABLE,
    'O serviço externo está temporariamente indisponível. Tente novamente.',
  );
