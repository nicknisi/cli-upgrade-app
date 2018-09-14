import { RunnerFunction } from './interfaces';
import { Command, Helper, OptionsHelper } from '@dojo/cli/interfaces';
import * as inquirer from 'inquirer';
const runner = require('jscodeshift/src/Runner');
const glob = require('glob');

const LATEST_VERSION = 3;

interface UpgradeCommand extends Command {
	runner: any;
	getVersionScript(version: number): Promise<RunnerFunction>;
}

const command: UpgradeCommand = {
	runner,
	group: 'upgrade',
	name: 'app',
	description: 'upgrade your application to a newer Dojo version',
	async getVersionScript(version: number) {
		return (await import(`./v${version}/main`)).default;
	},
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
	async run(
		this: UpgradeCommand,
		helper: Helper,
		args: { pattern: string; dry: boolean; to: number; from: number; yes: boolean }
	) {
		const { pattern, dry, to: toVersion, from: fromVersion, yes } = args;
		const paths = glob.sync(pattern);
		const hasJSX = paths.some((p: string) => p.match(/\.tsx$/g));
		const opts = { paths, hasJSX, dry, yes };

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

		const actions: Promise<void>[] = [];
		for (let i = fromVersion + 1; i <= toVersion; ++i) {
			actions.push(
				(async () => {
					let run;
					try {
						run = await this.getVersionScript(i);
					} catch {}

					if (run) {
						await run(opts, this.runner);
					}
				})()
			);
		}
		await Promise.all(actions);
	}
};

export default command;
