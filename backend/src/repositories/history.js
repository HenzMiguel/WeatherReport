import { mkdir, readFile, writeFile, rename } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validate as validUuid } from 'uuid';
export function createHistoryRepository(
  directory = process.env.DATA_DIR ||
    fileURLToPath(new URL('../../data', import.meta.url)),
) {
  const filename = (id) => {
    if (!validUuid(id)) throw new Error('Invalid city identifier');
    return join(directory, id + '.json');
  };
  return {
    async read(id) {
      try {
        return JSON.parse(await readFile(filename(id), 'utf8'));
      } catch (error) {
        if (error.code === 'ENOENT' || error instanceof SyntaxError)
          return null;
        throw error;
      }
    },
    async save(id, value) {
      await mkdir(directory, { recursive: true });
      const path = filename(id);
      const temp = path + '.tmp';
      await writeFile(temp, JSON.stringify(value, null, 2));
      await rename(temp, path);
    },
  };
}
