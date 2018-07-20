import { join } from 'path';
import chalk from 'chalk';
import { runCommand, runTask, serial, readfile } from './utils';

const version = '3';
const deprecatedPackages = [
	'@dojo/core',
	'@dojo/has',
	'@dojo/i18n',
	'@dojo/routing',
	'@dojo/shim',
	'@dojo/stores',
	'@dojo/test-extras',
	'@dojo/widget-core'
];

async function uninstall(pkg: string): Promise<void>;
async function uninstall(packages: string[]): Promise<void>;
async function uninstall(packages: string | string[]): Promise<void> {
	packages = Array.isArray(packages) ? packages : [packages];
	const text =
		packages.length === 1
			? `Removing deprecated package ${packages[0]}`
			: `Removing ${packages.length} deprecated package(s)`;
	await runCommand({
		text,
		command: 'npm',
		args: ['uninstall', ...packages]
	});
}

async function install(pkg: string, devDependency?: boolean): Promise<void>;
async function install(packages: string[], devDependency?: boolean): Promise<void>;
async function install(packages: string | string[], devDependency: boolean = false): Promise<void> {
	packages = Array.isArray(packages) ? packages : [packages];
	const args = ['install', ...packages];
	const text =
		packages.length === 1 ? `Installing package ${packages[0]}` : `Installing ${packages.length} package(s)`;

	if (devDependency) {
		args.push('-D');
	}

	await runCommand({
		text,
		command: 'npm',
		args
	});
}

type Dependencies = { [pkg: string]: string };
interface PackageInfo {
	dependencies: Dependencies;
	devDependencies: Dependencies;
}

async function getPackageDependencies(): Promise<{ toUpdate: { pkg: string; dev: boolean }[]; toRemove: string[] }> {
	const cwd = process.cwd();
	const path = join(cwd, 'package.json');
	const json = await runTask('Reading package.json', readfile(path, { encoding: 'utf8' }));
	const deps = JSON.parse(json) as PackageInfo;
	const toRemove: string[] = [];
	const toUpdate: { pkg: string; dev: boolean }[] = [];
	const filter = (deps: Dependencies, dev: boolean = false) =>
		Object.keys(deps)
			.filter((pkg) => pkg.includes('@dojo/'))
			.forEach((pkg) => {
				if (deprecatedPackages.includes(pkg)) {
					toRemove.push(pkg);
				} else {
					toUpdate.push({ pkg, dev });
				}
			});
	filter(deps.dependencies);
	filter(deps.devDependencies, true);
	return { toUpdate, toRemove };
}

export default function npmUpdate(): Promise<void> {
	return new Promise<void>(async (resolve, reject) => {
		try {
			const { toUpdate, toRemove } = await getPackageDependencies();
			console.info(chalk.underline('\nThe following packages are deprecated and will be removed:'));
			console.info(toRemove.map((pkg) => `- ${pkg}`).join('\n'), '\n');
			await uninstall(deprecatedPackages);
			await install('@dojo/framework');
			await serial(toUpdate.map(({ pkg, dev }) => () => install(`${pkg}@${version}`, dev)));
			resolve();
		} catch (error) {
			reject(error);
		}
	});
}
