import { StatusCodes } from 'http-status-codes';
import { validate as validUuid } from 'uuid';
import { AppError } from '../services/errors.js';
import { UFS } from '../repositories/cities.js';
const invalid = (message) => {
  throw new AppError(StatusCodes.BAD_REQUEST, message);
};
function text(value, name) {
  if (value === undefined) return '';
  if (typeof value !== 'string') invalid(name + ' deve ser um valor único.');
  return value.trim();
}
function integer(value, fallback, max, name) {
  if (value === undefined) return fallback;
  const raw = text(value, name);
  if (
    !/^\d+$/.test(raw) ||
    !Number.isSafeInteger(Number(raw)) ||
    Number(raw) < 1 ||
    Number(raw) > max
  )
    invalid(name + ' inválido.');
  return Number(raw);
}
export function createDashboardControllers({ cities, locate, forecast }) {
  return {
    list: async (req, res) => {
      const nome = text(req.query.nome, 'nome');
      const uf = text(req.query.uf, 'uf').toUpperCase();
      if (
        (!nome && !uf) ||
        (req.query.nome !== undefined &&
          (nome.length < 2 || nome.length > 100)) ||
        (req.query.uf !== undefined && !UFS.includes(uf))
      )
        invalid(
          'Informe nome com 2 a 100 caracteres e/ou uma UF brasileira válida.',
        );
      const page = integer(req.query.page, 1, 1000000, 'page');
      const limit = integer(req.query.limit, 10, 50, 'limit');
      const data = await cities.search({ nome, uf }, req.correlationId);
      res.json({
        dados: data.slice((page - 1) * limit, page * limit),
        paginacao: {
          pagina_atual: page,
          total_paginas: Math.ceil(data.length / limit),
          total_itens: data.length,
        },
      });
    },
    location: async (req, res) => {
      const lat = text(req.query.latitude, 'latitude');
      const lon = text(req.query.longitude, 'longitude');
      const latitude = Number(lat),
        longitude = Number(lon);
      if (
        !lat ||
        !lon ||
        !Number.isFinite(latitude) ||
        !Number.isFinite(longitude) ||
        Math.abs(latitude) > 90 ||
        Math.abs(longitude) > 180
      )
        invalid('Informe latitude e longitude válidas.');
      res.json(await locate(latitude, longitude, req.correlationId));
    },
    weather: async (req, res) => {
      if (!validUuid(req.params.id))
        invalid('O identificador da cidade deve ser um UUID válido.');
      const city = cities.find(req.params.id);
      if (!city)
        throw new AppError(
          StatusCodes.NOT_FOUND,
          'Cidade não encontrada. Busque e selecione a cidade novamente.',
        );
      res.json(await forecast(city, req.correlationId));
    },
  };
}
