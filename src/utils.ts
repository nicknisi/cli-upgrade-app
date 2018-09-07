import { resolve } from 'path';
import { readFile as nodeReadFile, writeFile as nodeWriteFile } from 'fs';
import { promisify } from 'util';

export const readFile = promisify(nodeReadFile);
export const writeFile = promisify(nodeWriteFile);

export async function getPackageJson(path = resolve(process.cwd(), 'package.json')): Promise<any> {
	const pjsonString = await readFile(path, { encoding: 'utf8' });
	return JSON.parse(pjsonString);
}

export async function getCurrentVersion(): Promise<number> {
	const { dependencies: deps } = await getPackageJson();
	const dojoDeps = Object.keys(deps).filter((dep) => dep.includes('@dojo'));
	const version = dojoDeps.reduce((version: number, dep) => {
		const [depVersion] = deps[dep].match(/(\d+)/);
		return depVersion < version ? depVersion : version;
	}, Infinity);
	return Number(version);
}
