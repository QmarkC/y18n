import * as fs from 'fs';
import {promisify} from 'util';

export const readFile = promisify(fs.readFile);
export const writeFile = promisify(fs.writeFile);

export async function readJson<T>(jsonPath: string): Promise<T> {
  const contents = await readFile(jsonPath, {encoding: 'utf8'});
  return JSON.parse(contents);
}
