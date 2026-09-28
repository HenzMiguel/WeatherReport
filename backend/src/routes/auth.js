import { Router } from 'express';
import { createAuthControllers } from '../controllers/auth.js';
import { requireAdmin } from '../controllers/middlewares.js';
export function authRoutes(auth) {
  const router = Router();
  const controller = createAuthControllers(auth);
  router.post('/auth/login', controller.login);
  router.get('/admin/sessao', requireAdmin(auth), controller.session);
  return router;
}
