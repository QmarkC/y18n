const assert = require('assert');
const {join} = require('path');
const y18n = require('../dist');

const __ = y18n({
  directory: join(__dirname, '..', 'test', 'locales'),
}).__;

const result = __('Hello');
assert.deepStrictEqual(result, 'Hello!');

console.log('cjs build OK.');
