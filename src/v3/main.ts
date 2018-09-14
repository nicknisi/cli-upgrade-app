import chalk from 'chalk';
import { resolve } from 'path';
import { RunnerOptions } from '../interfaces';

const packages = [
	'@dojo/core',
	'@dojo/has',
	'@dojo/i18n',
	'@dojo/widget-core',
	'@dojo/routing',
	'@dojo/stores',
	'@dojo/shim',
	'@dojo/test-extras'
];

export async function run(args: RunnerOptions, runner: any) {
	console.log('running v3');
	const transform = resolve(__dirname, 'transforms', 'module-transform-to-framework.js');
	const opts = {
		parser: args.hasJSX ? 'typescript-jsx' : 'typescript',
		transform,
		path: args.paths,
		verbose: 0,
		babel: false,
		dry: args.dry,
		extensions: 'js',
		runInBand: false,
		silent: false
	};

	try {
		await runner.run(opts.transform, opts.path, opts);
	} catch {
		throw Error('Failed to upgrade');
	}

	const packageString = packages.join(' ');
	console.log('');
	console.log(
		chalk.bold.green(
			'Upgrade complete, you can now add the new dojo/framework dependency and safely remove deprecated dependencies with the following:'
		)
	);
	console.log('install the dojo framework package:');
	console.log(`    ${chalk.yellow('npm install @dojo/framework')}`);
	console.log('remove legacy packages:');
	console.log(`    ${chalk.yellow('npm uninstall -S -D ' + packageString)}`);
}

export default run;
