import {resolve, dirname, join} from 'path';
import type {PackageJson} from '@npm/types';
import pkg from '../package.json';
import {readJson, writeFile} from './util';

declare module '@npm/types' {
  interface PackageJson {
    type?: string;
  }
}

const jsonPath = join(
  dirname(resolve(__dirname, '..', `${pkg.module}`)),
  'package.json'
);

const DEFAULT_PACKAGE_JSON: PackageJson = {
  name: `${pkg.name}`,
  version: `${pkg.version}`,
  type: 'module',
  private: true,
};

function formatJson(object: {}): string {
  const json = JSON.stringify(object, null, '  ');
  return `${json}\n`;
}

async function writePackageJson(packageJson: PackageJson): Promise<void> {
  console.log('Writing esm package.json.');
  await writeFile(jsonPath, formatJson(packageJson), 'utf8');
}

export async function writeESMPackageJSON(): Promise<void> {
  let generatePackageJson = false;
  let packageJson: PackageJson;

  try {
    packageJson = await readJson(jsonPath);
  } catch (err) {
    if (err.code !== 'ENOENT') {
      console.error(`Unable to open package.json file: ${err.message}`);
    }

    packageJson = DEFAULT_PACKAGE_JSON;
    generatePackageJson = true;
  }

  if (generatePackageJson) {
    await writePackageJson(packageJson);
  } else {
    console.log('No edits needed in esm package.json.');
  }
}
