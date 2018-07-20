import { promisify } from 'util';
import nodeGlob = require('glob');
import { readfile, writefile } from './utils';
const jscodeshift: any = require('jscodeshift');

const babylon = require('babylon');
const recast = require('recast');

const glob = promisify(nodeGlob);

export interface File {
	path: string;
	source: string;
}

export function getQuotes(source: string): 'single' | 'double' {
	const numSingle = (source.match(/\'/g) || []).length;
	const numDouble = (source.match(/\"/g) || []).length;
	return numSingle >= numDouble ? 'single' : 'double';
}

const updateImport = (value: string) =>
	value
		.replace(/^@dojo\/(core|has|i18n|widget-core|routing|stores|shim|test-extras)/, '@dojo/framework/$1')
		.replace(/test-extras/, 'testing');

export function transform({ path, source }: File, api: any = {}, options?: any): string {
	const { jscodeshift: j = jscodeshift } = api;
	const plugins = ['typescript', 'objectRestSpread'];

	if (path.endsWith('.tsx')) {
		plugins.unshift('jsx');
	}

	const parse = (source: string) => babylon.parse(source, { sourceType: 'module', plugins });
	return j(recast.parse(source, { parser: { parse } }))
		.find(j.ImportDeclaration)
		.replaceWith((p: any) => {
			const { source } = p.node;

			if (source.value.includes('@dojo/')) {
				source.value = updateImport(source.value);
				return { ...p.node, source: { ...source } };
			}

			return p.node;
		})
		.toSource({
			quote: getQuotes(source)
		});
}

function getFiles(pattern: string): Promise<string[]> {
	return glob(pattern);
}

export default async function updateImports(pattern: string): Promise<void> {
	const files = await getFiles(pattern);
	files.forEach(async (path) => {
		const source = await readfile(path, { encoding: 'utf8' });
		const updatedSource = transform({ path, source }, { jscodeshift });
		console.log(updatedSource);
		await writefile(path, updatedSource);
	});
}

updateImports('test-app/src/widgets/HelloWorld.ts');
