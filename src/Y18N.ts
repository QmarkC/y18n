import {readFileSync, statSync, writeFile} from 'fs';
import {resolve} from 'path';
// TODO: implement minimal version of util.format.
import * as util from 'util';

export interface Y18NOpts {
  /**
   * The locale directory. Default is `./locales`.
   */
  directory?: string;
  /**
   * Should newly observed strings be updated in file? Default is `true`.
   */
  updateFiles?: boolean;
  /**
   * What locale should be used? Default is `en`.
   */
  locale?: string;
  /**
   * Should fallback to a language-only file (e.g. en.json) be allowed
   * if a file matching the locale does not exist (e.g. en_US.json)?
   * Default is `true`.
   */
  fallbackToLanguage?: boolean;
}

export interface TranslateCallback {
  (error?: Error | null): void;
}

export interface Work {
  directory: string;
  locale: string;
  cb: TranslateCallback;
}

export interface PluralItem {
  one: string;
  other: string;
}

export type LocaleItem = string | PluralItem;

export interface LocaleCatalog {
  [key: string]: LocaleItem;
}

export interface GlobalCatalog {
  [key: string]: LocaleCatalog;
}

export interface Arguments {
  callback: TranslateCallback;
  taggedTemplate?: TemplateStringsArray;
  quantity?: number;
  _: string[];
}

// eslint-disable-next-line @typescript-eslint/no-empty-function
const noop: TranslateCallback = function () {};

export class Y18N {
  directory: string;
  updateFiles: boolean;
  locale: string;
  fallbackToLanguage: boolean;
  private writeQueue: Work[];
  private cache: GlobalCatalog;

  constructor(opts?: Y18NOpts) {
    // configurable options.
    opts = opts || {};
    this.directory = opts.directory || './locales';
    this.updateFiles =
      typeof opts.updateFiles === 'boolean' ? opts.updateFiles : true;
    this.locale = opts.locale || 'en';
    this.fallbackToLanguage =
      typeof opts.fallbackToLanguage === 'boolean'
        ? opts.fallbackToLanguage
        : true;

    // internal stuff.
    this.cache = {};
    this.writeQueue = [];

    // bind all functions to y18n, so that
    // they can be used in isolation.
    this.__ = this.__.bind(this);
    this.__n = this.__n.bind(this);
    this.setLocale = this.setLocale.bind(this);
    this.getLocale = this.getLocale.bind(this);
    this.updateLocale = this.updateLocale.bind(this);
    this._taggedLiteral = this._taggedLiteral.bind(this);
    this._enqueueWrite = this._enqueueWrite.bind(this);
    this._processWriteQueue = this._processWriteQueue.bind(this);
    this._readLocaleFile = this._readLocaleFile.bind(this);
    this._resolveLocaleFile = this._resolveLocaleFile.bind(this);
    this._fileExistsSync = this._fileExistsSync.bind(this);
  }

  __(
    stringOrTemplate: string | TemplateStringsArray,
    ...args: (string | TranslateCallback)[]
  ): string {
    // const argv = parseArgv(...args);
    if (typeof stringOrTemplate !== 'string') {
      return this._taggedLiteral(stringOrTemplate, ...args);
    }
    const str = stringOrTemplate;

    let cb = noop;

    if (typeof args[args.length - 1] === 'function') {
      cb = args.pop() as TranslateCallback;
    }
    cb = cb || noop;

    if (!this.cache[this.locale]) {
      this._readLocaleFile();
    }

    // we've observed a new string, update the language file.
    if (!this.cache[this.locale][str] && this.updateFiles) {
      this.cache[this.locale][str] = str;

      // include the current directory and locale,
      // since these values could change before the
      // write is performed.
      this._enqueueWrite({
        directory: this.directory,
        locale: this.locale,
        cb,
      });
    } else {
      cb();
    }

    return util.format(
      this.cache[this.locale][str] || str,
      ...(args as string[])
    );
  }

  __n(
    singular: string,
    plural: string,
    quantity: number,
    ...args: (string | TranslateCallback)[]
  ): string {
    let cb = noop; // start with noop.
    if (typeof args[args.length - 1] === 'function') {
      cb = args.pop() as TranslateCallback;
    }

    if (!this.cache[this.locale]) {
      this._readLocaleFile();
    }

    let str = quantity === 1 ? singular : plural;
    if (this.cache[this.locale][singular]) {
      const entry = this.cache[this.locale][singular] as PluralItem;
      str = entry[quantity === 1 ? 'one' : 'other'];
    }

    // we've observed a new string, update the language file.
    if (!this.cache[this.locale][singular] && this.updateFiles) {
      this.cache[this.locale][singular] = {
        one: singular,
        other: plural,
      };

      // include the current directory and locale,
      // since these values could change before the
      // write is performed.
      this._enqueueWrite({
        directory: this.directory,
        locale: this.locale,
        cb,
      });
    } else {
      cb();
    }

    // if a %d placeholder is provided, add quantity
    // to the arguments expanded by util.format.
    const values: (string | number)[] = [];
    if (~str.indexOf('%d')) {
      values.push(quantity);
    }

    return util.format(str, ...values.concat(args as string[]));
  }

  setLocale(locale: string): void {
    this.locale = locale;
  }

  getLocale(): string {
    return this.locale;
  }

  updateLocale(obj: LocaleCatalog): void {
    if (!this.cache[this.locale]) {
      this._readLocaleFile();
    }

    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        this.cache[this.locale][key] = obj[key];
      }
    }
  }

  _taggedLiteral(
    parts: TemplateStringsArray,
    ...args: (string | TranslateCallback)[]
  ): string {
    let str = '';
    parts.forEach((part, i) => {
      const arg = args[i];
      str += part;
      if (typeof arg !== 'undefined' && typeof arg === 'string') {
        str += '%s';
      }
    });

    return this.__(str, ...args);
  }

  _enqueueWrite(work: Work): void {
    this.writeQueue.push(work);
    if (this.writeQueue.length === 1) this._processWriteQueue();
  }

  _processWriteQueue(): void {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const _this = this;
    const work = this.writeQueue[0];

    // destructure the enqueued work.
    const directory = work.directory;
    const locale = work.locale;
    const cb = work.cb;

    const languageFile = this._resolveLocaleFile(directory, locale);
    const serializedLocale = JSON.stringify(this.cache[locale], null, 2);

    writeFile(languageFile, serializedLocale, 'utf-8', err => {
      _this.writeQueue.shift();
      if (_this.writeQueue.length > 0) _this._processWriteQueue();
      cb(err);
    });
  }

  _readLocaleFile(): void {
    let localeLookup = {};
    const languageFile = this._resolveLocaleFile(this.directory, this.locale);

    try {
      localeLookup = JSON.parse(readFileSync(languageFile, 'utf-8'));
    } catch (err) {
      if (err instanceof SyntaxError) {
        err.message = 'syntax error in ' + languageFile;
      }

      if (err.code === 'ENOENT') localeLookup = {};
      else throw err;
    }

    this.cache[this.locale] = localeLookup;
  }

  _resolveLocaleFile(directory: string, locale: string): string {
    let file = resolve(directory, './', locale + '.json');
    if (
      this.fallbackToLanguage &&
      !this._fileExistsSync(file) &&
      ~locale.lastIndexOf('_')
    ) {
      // attempt fallback to language only
      const languageFile = resolve(
        directory,
        './',
        locale.split('_')[0] + '.json'
      );
      if (this._fileExistsSync(languageFile)) file = languageFile;
    }
    return file;
  }

  _fileExistsSync(file: string): boolean {
    try {
      return statSync(file).isFile();
    } catch (err) {
      return false;
    }
  }
}
