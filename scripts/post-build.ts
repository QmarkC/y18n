import {writeESMPackageJSON} from './write-esm-package-json';
import {transformTypes} from './transform-cjs-types';

async function postBuild(): Promise<void> {
  try {
    await writeESMPackageJSON();
    console.log('Done writing esm package.json');
  } catch (err) {
    console.error(err);
  }

  try {
    await transformTypes();
    console.log('Done transforming cjs types.');
  } catch (err) {
    console.error(err);
  }
}

postBuild().catch(error => console.error(error));
