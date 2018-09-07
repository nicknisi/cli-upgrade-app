import { Command, Helper, OptionsHelper } from '@dojo/cli/interfaces';
import { getCurrentVersion } from './utils';
import * as inquirer from 'inquirer';
const runner = require('jscodeshift/src/Runner');
const glob = require('glob');

const LATEST_VERSION = 3;

const command: Command & { runner: any } = {
	runner,
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
		options('to', {
			describe: 'the version to upgrade to',
			type: 'number'
		});
		options('yes', {
			describe: 'Accept defaults for all options',
			type: 'boolean',
			alias: 'y',
			default: false
		});
	},
	async run(
		this: Command & { runner: any },
		helper: Helper,
		args: { pattern: string; dry: boolean; to: string; yes: boolean }
	) {
		const { pattern, dry, to, yes } = args;
		const paths = glob.sync(pattern);
		const hasJSX = paths.some((p: string) => p.match(/\.tsx$/g));
		const opts = { paths, hasJSX, dry, yes, runner: this.runner };
		const fromVersion = await getCurrentVersion();
		const toVersion = to || LATEST_VERSION;

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
						run = (await import(`./v${i}/main`)).default;
					} catch {}

					if (run) {
						await run(opts);
					}
				})()
			);
		}
		await Promise.all(actions);
	}
};

export default command;
