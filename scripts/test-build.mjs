import {strict as assert} from 'assert';
// eslint-disable-next-line import/extensions
import y18n from '../dist/esm/wrapper.js';

const __ = y18n({
  directory: './test/locales',
}).__;

const result = __('Hello');
assert.deepStrictEqual(result, 'Hello!');

console.log('esm build OK.');
