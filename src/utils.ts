import chalk from 'chalk';
import { readFile as nodeReadFile, writeFile as nodeWriteFile } from 'fs';
import { promisify } from 'util';
const { spawn }: any = require('cross-spawn');
const ora: any = require('ora');

export const readfile = promisify(nodeReadFile);
export const writefile = promisify(nodeWriteFile);

export function run(command: string, args?: string[], resolveOnErrors?: boolean): Promise<string> {
	return new Promise((resolve, reject) => {
		let stdout = '';
		let stderr = '';
		const proc = spawn(command, args);
		proc.stdout.on('data', (data: Buffer) => {
			stdout += data.toString('utf8');
		});
		proc.stderr.on('data', (data: Buffer) => {
			stderr += data.toString('utf8');
		});
		proc.on('close', (code: number) => {
			if (!resolveOnErrors && code) {
				reject(stderr);
			} else {
				resolve(stdout);
			}
		});
	});
}

export function runTask<T>(text: string, task: (() => Promise<T>) | Promise<T>): Promise<T> {
	const spinner = ora({
		spinner: 'dots',
		color: 'white',
		text
	}).start();
	const promise = typeof task === 'function' ? task() : task;
	return promise.then(
		(value) => {
			spinner.succeed(`${text} ${chalk.green('done')}.`);
			return value;
		},
		(error) => {
			spinner.fail(`${text} ${chalk.red('failed')}.`);
			throw error;
		}
	);
}

export interface TaskOptions {
	text: string;
	command: string;
	args?: string[];
	ignoreErrors?: boolean;
}

export async function runCommand(config: TaskOptions): Promise<string> {
	const { ignoreErrors, text, command, args } = config;
	const spinner = ora({
		spinner: 'dots',
		color: 'white',
		text
	}).start();

	let result = '';
	try {
		result = await run(command, args, ignoreErrors);
	} catch (error) {
		spinner.fail(`${text} ${chalk.red('failed')}`);
		throw error;
	}
	spinner.succeed(`${text} ${chalk.green('done')}`);
	return result;
}

export function serial<T>(funcs: (() => Promise<T>)[]) {
	return funcs.reduce((promise, func) => {
		return promise.then((arr) => func().then((result) => arr.concat(result)));
	}, Promise.resolve([] as T[]));
}
