import { Migration } from './interfaces';
import { Command, Helper, OptionsHelper } from '@dojo/cli/interfaces';
import chalk from 'chalk';
import * as inquirer from 'inquirer';
const Runner = require('jscodeshift/src/Runner');
const glob = require('glob');

const LATEST_VERSION = 3;

interface UpgradeCommand extends Command {
	__runner: any;
	runTransforms(transforms: string[], paths: string[], options: any): Promise<void>;
	getVersionScript(version: number): Promise<Migration>;
}

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

export async function run(opts: any) {
	try {
		await command.__runner.run(opts.transform, opts.path, opts);
	} catch (e) {
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
async function runTransforms(transforms: string[], paths: string[], options: any = {}) {
	const opts = {
		verbose: 0,
		babel: false,
		extensions: 'js',
		runInBand: false,
		silent: false,
		...options
	};

	await Promise.all(
		transforms.map(async (transform) => {
			try {
				await Runner.run(transform, paths, opts);
			} catch (e) {
				throw Error('Failed to upgrade');
			}
		})
	);
}

const command: any = {
	__runner: Runner,
	group: 'upgrade',
	name: 'app',
	description: 'upgrade your application to a newer Dojo version',
	register(options: OptionsHelper) {
		options('pattern', {
			describe: 'glob pattern of source files to transform',
			alias: 'p',
			type: 'string',
			default: '{src,tests}/**/*.{ts,tsx}'
		});
		options('dry', {
			describe: 'perform a dry run, no changes are made to files',
			alias: 'd',
			type: 'boolean',
			default: false
		});
		options('from', {
			describe: 'the version to upgrade from',
			type: 'number',
			default: 2
		});
		options('to', {
			describe: 'the version to upgrade to',
			type: 'number',
			default: LATEST_VERSION
		});
		options('yes', {
			describe: 'Accept defaults for all options',
			type: 'boolean',
			alias: 'y',
			default: false
		});
	},
	async getVersionScript(version: number) {
		return (await import(`./v${version}/main`)).default;
	},
	async run(
		this: UpgradeCommand,
		helper: Helper,
		args: { pattern: string; dry: boolean; from: number; to: number; yes: boolean }
	) {
		const { pattern, dry, to: toVersion, from: fromVersion } = args;
		const paths = glob.sync(pattern);
		const hasJSX = paths.some((p: string) => p.match(/\.tsx$/g));
		const parser = hasJSX ? 'typescript-jsx' : 'typescript';

		if (toVersion <= fromVersion) {
			throw Error(`Attempt to upgrade from v${fromVersion} to v${toVersion} not allowed. Exiting.`);
		}

		if (!dry) {
			const answer = await inquirer.prompt({
				type: 'confirm',
				name: 'run',
				message:
					'This command will irreversibly modify files. Are you sure you want to run the upgrade? Use the --dry option first if in doubt',
				default: false
			});
			if (!(answer as any).run) {
				throw Error('Aborting upgrade');
			}
		}

		let transforms: string[] = [];

		for (let i = fromVersion + 1; i <= toVersion; ++i) {
			try {
				const { transforms: versionTransforms } = await this.getVersionScript(i);
				transforms = transforms.concat(versionTransforms);
			} catch {}
		}

		console.log('this', this);
		runTransforms(transforms, paths, { parser, dry });
	}
};

export default command;
