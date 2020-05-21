/** @format */

import config, { copySettings } from './rollup.config.js';
import secrets from './install/secrets.json';

copySettings.BASE_URL = `<base href="${secrets.baseUrl}">`;

export default config;
