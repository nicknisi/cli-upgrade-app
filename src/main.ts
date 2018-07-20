import { Command, OptionsHelper, Helper } from '@dojo/cli/interfaces';
import npmUpdate from './npmUpdate';
import updateImports from './updateImports';

export const command: Command = {
	group: 'upgrade',
	name: 'app',
	global: false,
	description: 'upgrade a Dojo application to the latest major version',
	register(options: OptionsHelper) {
		options('path', {
			describe: 'glob pattern to application source files',
			alias: 'p',
			type: 'string',
			default: '{src,tests}/**/*.{ts,tsx}'
		});
		options('skip-npm', {
			describe: 'skip updating package files to the latest',
			alias: 's',
			type: 'boolean',
			default: false
		});
	},
	async run(helper: Helper, args: any): Promise<void> {
		const { skipNpm, path } = args;
		if (!skipNpm) {
			await npmUpdate();
		}

		updateImports(path);
	}
};

export default command;
