import { Command, OptionsHelper, Helper } from '@dojo/cli/interfaces';

export const command: Command = {
	group: '',
	name: 'upgrade',
	global: false,
	description: 'Test test test',
	register(options: OptionsHelper) {
		options('foo', {
			describe: 'foo',
			alias: 'f',
			choices: ['hi']
		});
	},
	async run(helper: Helper, args: any): Promise<void> {
		console.log('UPGRADE: run');
	}
};

export default command;
