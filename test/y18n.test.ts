import {readFileSync, writeFileSync, existsSync} from 'fs';
import {join} from 'path';
import * as rimraf from 'rimraf';
import {expect} from 'chai';
import y18n from '../src/';

const LOCALES_PATH = join(__dirname, 'locales');

describe('y18n', () => {
  describe('configure', () => {
    it('allows you to override the default y18n configuration', () => {
      const result = y18n({locale: 'fr'});
      expect(result).to.have.deep.property('locale', 'fr');
    });
  });

  describe('_readLocaleFile', () => {
    it('throws a helpful error if language file has invalid syntax', () => {
      expect(() => {
        const __ = y18n({
          locale: 'bad-locale',
          directory: LOCALES_PATH,
        }).__;

        __('Hello');
      }).to.throw(/syntax error/);
    });
  });

  describe('__', () => {
    it('can be used as a tag for template literals', () => {
      const __ = y18n({
        locale: 'pirate',
        directory: LOCALES_PATH,
      }).__;

      const result = __`Hi, ${'Ben'} ${'Coe'}!`;
      expect(result).to.equal("Yarr! Shiver me timbers, why 'tis Ben Coe!");
    });

    it('can be used as a tag for template literals with falsy arguments', () => {
      const __ = y18n({
        locale: 'pirate',
        directory: LOCALES_PATH,
      }).__;

      const result = __`Hi, ${'Ben'} ${''}!`;
      expect(result).to.equal("Yarr! Shiver me timbers, why 'tis Ben !");
    });

    it('uses replacements from the default locale if none is configured', () => {
      const __ = y18n({
        directory: LOCALES_PATH,
      }).__;

      const result = __('Hello');
      expect(result).to.equal('Hello!');
    });

    it('uses replacements from the configured locale', () => {
      const __ = y18n({
        locale: 'pirate',
        directory: LOCALES_PATH,
      }).__;

      const result = __('Hello');
      expect(result).to.equal('Avast ye mateys!');
    });

    it('uses language file if language_territory file does not exist', () => {
      const __ = y18n({
        locale: 'pirate_JM',
        directory: LOCALES_PATH,
      }).__;

      const result = __('Hello');
      expect(result).to.equal('Avast ye mateys!');
    });

    it('does not fallback to language file if fallbackToLanguage is false', () => {
      const __ = y18n({
        locale: 'pirate_JM',
        fallbackToLanguage: false,
        updateFiles: false,
        directory: LOCALES_PATH,
      }).__;

      const result = __('Hello');
      expect(result).to.equal('Hello');
    });

    it('uses strings as given if no matching locale files found', () => {
      const __ = y18n({
        locale: 'zz_ZZ',
        updateFiles: false,
        directory: LOCALES_PATH,
      }).__;

      const result = __('Hello');
      expect(result).to.equal('Hello');
    });

    it('expands arguments into %s placeholders', () => {
      const __ = y18n({
        directory: LOCALES_PATH,
      }).__;

      const result = __('Hello %s %s', 'Ben', 'Coe');
      expect(result).to.equal('Hello Ben Coe');
    });

    describe('the first time observing a word', () => {
      beforeEach(done => {
        rimraf(`${LOCALES_PATH}/fr*.json`, () => {
          return done();
        });
      });

      it('returns the word immediately', () => {
        const __ = y18n({
          locale: 'fr',
          directory: LOCALES_PATH,
        }).__;

        const result = __('banana');
        expect(result).to.equal('banana');
      });

      it('writes new word to locale file if updateFiles is true', done => {
        const __ = y18n({
          locale: 'fr_FR',
          directory: LOCALES_PATH,
        }).__;

        __('banana', err => {
          const locale = JSON.parse(
            readFileSync(join(LOCALES_PATH, 'fr_FR.json'), 'utf-8')
          );
          expect(locale).to.have.deep.property('banana', 'banana');
          return done(err);
        });
      });

      it('writes new word to language file if language_territory file does not exist', done => {
        writeFileSync(
          `${LOCALES_PATH}/fr.json`,
          '{"meow": "le meow"}',
          'utf-8'
        );

        const __ = y18n({
          locale: 'fr_FR',
          directory: LOCALES_PATH,
        }).__;

        const result = __('meow');
        expect(result).to.equal('le meow');
        __('banana', err => {
          const locale = JSON.parse(
            readFileSync(join(LOCALES_PATH, 'fr.json'), 'utf-8')
          );
          expect(locale).to.have.deep.property('banana', 'banana');
          return done(err);
        });
      });

      it('writes word to missing locale file, if no fallback takes place', done => {
        writeFileSync(
          join(LOCALES_PATH, 'fr.json'),
          '{"meow": "le meow"}',
          'utf-8'
        );

        const __ = y18n({
          locale: 'fr_FR',
          fallbackToLanguage: false,
          directory: LOCALES_PATH,
        }).__;

        __('banana', err => {
          // 'banana' should be written to fr_FR.json
          const locale = JSON.parse(
            readFileSync(join(LOCALES_PATH, 'fr_FR.json'), 'utf-8')
          );
          expect(locale).to.have.deep.property('banana', 'banana');
          // fr.json should remain untouched
          const frJson = JSON.parse(
            readFileSync(join(LOCALES_PATH, 'fr.json'), 'utf-8')
          );
          expect(frJson).to.have.deep.property('meow', 'le meow');
          return done(err);
        });
      });

      it('handles enqueuing multiple writes at the same time', done => {
        const __ = y18n({
          locale: 'fr',
          directory: LOCALES_PATH,
        }).__;

        __('apple');
        __('banana', () => {
          __('foo');
          __('bar', err => {
            const locale = JSON.parse(
              readFileSync(join(LOCALES_PATH, 'fr.json'), 'utf-8')
            );
            expect(locale).to.have.deep.property('apple', 'apple');
            expect(locale).to.have.deep.property('banana', 'banana');
            expect(locale).to.have.deep.property('foo', 'foo');
            expect(locale).to.have.deep.property('bar', 'bar');
            return done(err);
          });
        });
      });

      it('does not write the locale file if updateFiles is false', done => {
        const __ = y18n({
          locale: 'fr',
          updateFiles: false,
          directory: LOCALES_PATH,
        }).__;

        __('banana', err => {
          const result = existsSync(join(LOCALES_PATH, 'fr.json'));
          expect(result).to.equal(false);
          return done(err);
        });
      });
    });
  });

  describe('__n', () => {
    it('uses the singular form if quantity is 1', () => {
      const __n = y18n({
        directory: LOCALES_PATH,
      }).__n;

      const result = __n('%d cat', '%d cats', 1);
      expect(result).to.equal('1 cat');
    });

    it('uses the plural form if quantity is greater than 1', () => {
      const __n = y18n({
        directory: LOCALES_PATH,
      }).__n;

      const result = __n('%d cat', '%d cats', 2);
      expect(result).to.equal('2 cats');
    });

    it('allows additional arguments to be printed', () => {
      const __n = y18n({
        directory: LOCALES_PATH,
      }).__n;

      const result = __n('%d %s cat', '%d %s cats', 2, 'black');
      expect(result).to.equal('2 black cats');
    });

    it('allows an alternative locale to be set', () => {
      const __n = y18n({
        locale: 'pirate',
        directory: LOCALES_PATH,
      }).__n;

      const result1 = __n('%d cat', '%d cats', 1);
      expect(result1).to.equal('1 land catfish');
      const result2 = __n('%d cat', '%d cats', 3);
      expect(result2).to.equal('3 land catfishes');
    });

    // See: https://github.com/bcoe/yargs/pull/210
    it('allows a quantity placeholder to be provided in the plural but not singular form', () => {
      const __n = y18n({
        directory: LOCALES_PATH,
      }).__n;

      const singular = __n(
        'There is one monkey in the %s',
        'There are %d monkeys in the %s',
        1,
        'tree'
      );
      const plural = __n(
        'There is one monkey in the %s',
        'There are %d monkeys in the %s',
        3,
        'tree'
      );

      expect(singular).to.equal('There is one monkey in the tree');
      expect(plural).to.equal('There are 3 monkeys in the tree');
    });

    describe('the first time observing a pluralization', () => {
      beforeEach(done => {
        rimraf(join(LOCALES_PATH, 'fr.json'), () => {
          return done();
        });
      });

      it('returns the pluralization immediately', () => {
        const __n = y18n({
          locale: 'fr',
          directory: LOCALES_PATH,
        }).__n;

        const result = __n('%d le cat', '%d le cats', 1);
        expect(result).to.equal('1 le cat');
      });

      it('writes to the locale file if updateFiles is true', done => {
        const __n = y18n({
          locale: 'fr',
          directory: LOCALES_PATH,
        }).__n;

        __n('%d apple %s', '%d apples %s', 2, 'dude', err => {
          const locale = JSON.parse(
            readFileSync(join(LOCALES_PATH, 'fr.json'), 'utf-8')
          );
          expect(locale['%d apple %s']).to.have.deep.property(
            'one',
            '%d apple %s'
          );
          expect(locale['%d apple %s']).to.have.deep.property(
            'other',
            '%d apples %s'
          );
          return done(err);
        });
      });

      it('does not write the locale file if updateFiles is false', done => {
        const __n = y18n({
          locale: 'fr',
          updateFiles: false,
          directory: LOCALES_PATH,
        }).__n;

        __n('%d apple %s', '%d apples %s', 2, 'dude', err => {
          const result = existsSync(join(LOCALES_PATH, 'fr.json'));
          expect(result).to.equal(false);
          return done(err);
        });
      });
    });
  });

  describe('setLocale', () => {
    it('switches the locale', () => {
      const i18n = y18n({
        directory: LOCALES_PATH,
      });

      expect(i18n.__('Hello')).to.equal('Hello!');
      i18n.setLocale('pirate');
      expect(i18n.__('Hello')).to.equal('Avast ye mateys!');
    });
  });

  describe('updateLocale', () => {
    beforeEach(done => {
      rimraf(join(LOCALES_PATH, 'fr.json'), () => {
        return done();
      });
    });

    it('updates the locale with the new lookups provided', () => {
      const i18n = y18n({
        locale: 'fr',
        directory: LOCALES_PATH,
      });

      i18n.updateLocale({
        foo: 'le bar',
      });

      const result = i18n.__('foo');
      expect(result).to.equal('le bar');
    });

    it('loads the locale from disk prior to updating the map', () => {
      writeFileSync(
        join(LOCALES_PATH, 'fr.json'),
        '{"meow": "le meow"}',
        'utf-8'
      );

      const i18n = y18n({
        locale: 'fr',
        directory: LOCALES_PATH,
      });

      i18n.updateLocale({
        foo: 'le bar',
      });

      const result = i18n.__('meow');
      expect(result).to.equal('le meow');
    });
  });

  describe('getLocale', () => {
    it('returns the configured locale', () => {
      const result = y18n().getLocale();
      expect(result).to.equal('en');
    });
  });

  after(() => {
    rimraf.sync(join(LOCALES_PATH, 'fr.json'));
  });
});
