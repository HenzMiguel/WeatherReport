import SwaggerParser from '@apidevtools/swagger-parser';
import { fileURLToPath } from 'node:url';
await SwaggerParser.validate(
  fileURLToPath(new URL('../SDD/swagger.yaml', import.meta.url)),
);
console.log('OpenAPI válido.');
