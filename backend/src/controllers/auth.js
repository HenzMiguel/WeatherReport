import { StatusCodes } from 'http-status-codes';
import { AppError } from '../services/errors.js';
export function createAuthControllers(auth) {
  return {
    login: (req, res) => {
      const { email, senha } = req.body || {};
      if (
        typeof email !== 'string' ||
        typeof senha !== 'string' ||
        !email.trim() ||
        !senha
      )
        throw new AppError(StatusCodes.BAD_REQUEST, 'Informe e-mail e senha.');
      res.json({
        token_acesso: auth.login(email.trim(), senha),
        tipo_token: 'Bearer',
        papel: 'ADMIN',
      });
    },
    session: (req, res) =>
      res.json({ email: req.admin.sub, papel: req.admin.papel }),
  };
}
