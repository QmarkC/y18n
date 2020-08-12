import {existsSync} from 'fs';
import {resolve} from 'path';
import pkg from '../package.json';
import {readFile, writeFile} from './util';

export async function transformTypes(): Promise<void> {
  try {
    const typesFile = resolve(__dirname, '..', `${pkg.types}`);
    if (existsSync(typesFile)) {
      let contents = await readFile(typesFile, 'utf8');
      contents = contents.replace(
        'export { y18n as default };',
        'export = y18n;'
      );

      await writeFile(typesFile, contents, 'utf8');
    }
  } catch (err) {
    console.error(err);
  }
}
