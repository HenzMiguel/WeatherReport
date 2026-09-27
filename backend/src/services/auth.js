import { createHmac, timingSafeEqual } from 'node:crypto';
import { StatusCodes } from 'http-status-codes';
import { AppError } from './errors.js';

const encoder = new TextEncoder();
const base64url = (value) => Buffer.from(value).toString('base64url');
const parseJson = (value) => JSON.parse(Buffer.from(value, 'base64url'));

function unauthorized() {
  return new AppError(
    StatusCodes.UNAUTHORIZED,
    'Sua sessão é inválida ou expirou. Entre novamente.',
  );
}

function same(left, right) {
  const a = encoder.encode(left);
  const b = encoder.encode(right);
  return a.length === b.length && timingSafeEqual(a, b);
}

export function parseAdministrators(content) {
  const administrators = new Map();
  for (const [index, raw] of content.split(/\r?\n/).entries()) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const separator = line.indexOf(':');
    const email = line.slice(0, separator).trim().toLowerCase();
    const password = line.slice(separator + 1);
    if (separator < 1 || !email || !password || administrators.has(email))
      throw new Error(
        `admins.txt inválido na linha ${index + 1}. Use e-mail:senha.`,
      );
    administrators.set(email, password);
  }
  if (!administrators.size)
    throw new Error('admins.txt precisa conter pelo menos um administrador.');
  return administrators;
}

export function createAuthService({
  administrators,
  secret,
  now = () => Date.now(),
}) {
  if (!(administrators instanceof Map) || !secret)
    throw new Error(
      'Administradores e AUTH_SECRET são obrigatórios para habilitar o acesso administrativo.',
    );
  const sign = (value) =>
    createHmac('sha256', secret).update(value).digest('base64url');
  return {
    login(email, password) {
      const normalizedEmail = email.toLowerCase();
      const registeredPassword = administrators.get(normalizedEmail);
      if (!registeredPassword || !same(password, registeredPassword))
        throw new AppError(
          StatusCodes.UNAUTHORIZED,
          'E-mail ou senha inválidos.',
        );
      const issuedAt = Math.floor(now() / 1000);
      const payload = base64url(
        JSON.stringify({
          sub: normalizedEmail,
          papel: 'ADMIN',
          iat: issuedAt,
          exp: issuedAt + 3600,
        }),
      );
      const header = base64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
      return header + '.' + payload + '.' + sign(header + '.' + payload);
    },
    verify(token) {
      if (typeof token !== 'string') throw unauthorized();
      const [header, payload, signature, extra] = token.split('.');
      if (
        !header ||
        !payload ||
        !signature ||
        extra ||
        !same(signature, sign(header + '.' + payload))
      )
        throw unauthorized();
      try {
        const claims = parseJson(payload);
        if (
          claims.papel !== 'ADMIN' ||
          !administrators.has(claims.sub) ||
          !Number.isInteger(claims.exp) ||
          claims.exp <= Math.floor(now() / 1000)
        )
          throw unauthorized();
        return claims;
      } catch (error) {
        if (error instanceof AppError) throw error;
        throw unauthorized();
      }
    },
  };
}

export function createUnavailableAuthService() {
  const unavailable = () => {
    throw new AppError(
      StatusCodes.SERVICE_UNAVAILABLE,
      'O acesso administrativo ainda não foi configurado neste ambiente.',
    );
  };
  return {
    login: unavailable,
    verify: () => {
      throw unauthorized();
    },
  };
}
