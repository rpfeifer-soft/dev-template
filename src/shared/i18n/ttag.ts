import ttag from 'ttag';
import { Language } from '../types.js';
import { locale as localeEN } from './en.js';

export const t = ttag.t;
export const ngettext = ttag.ngettext;
export const msgid = ttag.msgid;
export const addLocale = (language: Language, data: ttag.LocaleData): void =>
   ttag.addLocale(`${language}`, data);
export const useLocale = (language: Language): void =>
   ttag.useLocale(`${language}`);

addLocale(Language.English, localeEN);

// Example for multiple forms
// const n = 2;
// console.log(ngettext(msgid`${n} banana`, `${n} bananas`, n));
