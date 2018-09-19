import { Migration } from '../interfaces';
import { resolve } from 'path';

export const migration: Migration = {
	transforms: [resolve(__dirname, 'transforms', 'module-transform-to-framework.js')]
};

export default migration;
