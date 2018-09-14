export interface RunnerOptions {
	pattern?: string;
	paths: string[];
	dry?: boolean;
	yes?: boolean;
	hasJSX?: boolean;
}

export interface RunnerFunction {
	(args: RunnerOptions, runner: any): void;
}
