const { parse }: any = require('@babel/parser');
const generate: any  = require('@babel/generator').default;
const traverse: any = require('@babel/traverse').default;
const t: any = require('@babel/types');

import { promisify } from 'util';
import nodeGlob = require('glob');
import { readfile, writefile } from './utils';

const glob = promisify(nodeGlob);

function getFiles(pattern: string): Promise<string[]> {
	return glob(pattern);
}

async function transform(file: string): Promise<void> {
	const ast = parse(file, {
		sourceType: 'module',
		plugins: ['typescript'],
		strictMode: true
	});

	traverse(ast, {
		ImportDeclaration(path: any) {
			const { node } = path.get('source');
			const { value: source } = node;

			if (!source.includes('@dojo/')) {
				return;
			}

			const clause = source
				.replace(/^@dojo\/(core|has|i18n|widget-core|routing|stores|shim|test-extras)/, '@dojo/framework/$1')
				.replace(/test-extras/, 'testing');

			path.node.source = t.stringLiteral(clause);
		}
	});

	const output = generate(ast, {
		retainLines: true,
		retainFunctionParens: true,
		comments: true
	}, file);

	return output.code;
}

export default async function updateImports(pattern: string): Promise<void> {
	const files = await getFiles(pattern);
	files.forEach(async path => {
		const file = await readfile(path, { encoding: 'utf8' });
		const updatedFile = await transform(file);
		await writefile(path, updatedFile);
	});
}

updateImports('{src,tests}/**/*.{ts,tsx}');
