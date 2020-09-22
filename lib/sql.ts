/**
 * Async worker thread wrapper around SQLite, written to improve concurrent performance.
 * @author mia-pi-git
 */
import {ProcessWrapper, ProcessManager} from './process-manager';
import * as Sqlite from 'better-sqlite3';
import * as child_process from 'child_process';
import * as path from 'path';

interface SQLOptions {
	file: string;
	/** file to import database functions from - this should be relative to this filename. */
	extension?: string;
}

type DataType = unknown[] | Record<string, unknown>;

export type DatabaseQuery = {
	/** Prepare a statement - data is the statement. */
	type: 'prepare', data: string,
} | {
	/** Get all lines from a statement. Data is the params, num is the statement number. */
	type: 'all', data: DataType, num: number,
} | {
	/** Execute raw SQL in the database. */
	type: "exec", data: string,
} | {
	/** Get one line from a prepared statement. */
	type: 'get', data: DataType, num: number,
} | {
	/** Run a prepared statement. */
	type: 'run', data: DataType, num: number,
};

export class DatabaseWrapper implements ProcessWrapper {
	statements: Map<string, number>;
	process: child_process.ChildProcess;
	pendingRequests: Map<number, (data: string | DataType | null) => any>;
	constructor(options: SQLOptions) {
		this.statements = new Map();
		this.pendingRequests = new Map();
		this.process = child_process.fork(__filename, [], {
			env: options as AnyObject, cwd: path.resolve(__dirname, '..'),
		});
		this.listen();
	}
	getProcess() {
		return this.process;
	}
	listen() {
		this.process.on("message", (message: string) => {
			const [taskNum, input] = message.split('\n');
			const resolver = this.pendingRequests.get(parseInt(taskNum));
			if (resolver) return resolver(JSON.parse(input));
			throw new Error(`Database wrapper received a message, but there was no pending request.`);
		});
	}
	release() {
		this.statements.clear();
		this.process.kill();
		for (const resolver of this.pendingRequests.values()) {
			resolver(null);
		}
		return Promise.resolve();
	}
	get load() {
		return this.pendingRequests.size;
	}
	async prepare(statement: string) {
		const cachedStatement = this.statements.get(statement);
		if (cachedStatement) {
			return cachedStatement;
		}
		const int = await this.query({type: 'prepare', data: statement});
		if (typeof int === 'number') this.statements.set(statement, int);
		return int;
	}
	all(statement: string | number, data: DataType = {}) {
		const num = typeof statement === 'number' ? statement : this.statements.get(statement);
		if (num === undefined || ![...this.statements.values()].includes(num)) {
			throw new Error(`Prepare a statement before using another database function with SQLDatabase.prepare.`);
		}
		return this.query({type: 'all', num: num, data});
	}
	get(statement: string | number, data: DataType = {}) {
		const num = typeof statement === 'number' ? statement : this.statements.get(statement);
		if (num === undefined || ![...this.statements.values()].includes(num)) {
			throw new Error(`Prepare a statement before using another database function with SQLDatabase.prepare.`);
		}
		return this.query({type: 'get', data, num});
	}
	run(statement: string | number, data: DataType) {
		const num = typeof statement === 'number' ? statement : this.statements.get(statement);
		if (num === undefined || ![...this.statements.values()].includes(num)) {
			throw new Error(`Prepare a statement before using another database function with SQLDatabase.prepare.`);
		}
		return this.query({type: 'run', num, data});
	}
	/** We don't want these to be prepared statements, since this should be used SPARINGLY. */
	exec(statement: string) {
		return this.query({type: 'exec', data: statement});
	}
	query(args: DatabaseQuery) {
		const taskid = this.load + 1;
		this.process.send(`${taskid}\n${JSON.stringify(args)}`);
		return new Promise<any>(resolve => {
			this.pendingRequests.set(taskid, resolve);
		});
	}
}

class SQLProcessManager extends ProcessManager {
	constructor(module: NodeJS.Module) {
		super(module);
	}
	createProcess(options: SQLOptions) {
		const process: ProcessWrapper = new DatabaseWrapper(options);
		this.processes.push(process);
		return process;
	}
	listen() {}
	destroyProcess(process: DatabaseWrapper) {
		void process.release();
		this.processes.splice(this.processes.indexOf(process), 1);
	}
}

export const PM = new SQLProcessManager(module);

if (!PM.isParentProcess) {
	let statementNum = 0;
	const statements: Map<number, Sqlite.Statement> = new Map();
	const {file, extension} = process.env;
	const database = new Sqlite(file!);
	if (extension) {
		// eslint-disable-next-line @typescript-eslint/no-var-requires
		const functions: {[k: string]: (...params: any) => any} = require(`../${extension}`);
		for (const key in functions) {
			database.function(key, functions[key]);
		}
	}
	database.pragma(`foreign_keys=on`);
	process.on('message', message => {
		const [taskid, input] = message.split('\n');
		const query: DatabaseQuery = JSON.parse(input);
		let statement;
		let results;
		switch (query.type) {
		case 'prepare': {
			const {data} = query;
			const newStatement = database.prepare(data);
			const nextNum = statementNum++;
			statements.set(nextNum, newStatement);
			return process.send!(`${taskid}\n${nextNum}`);
		}
		case 'all': {
			const {num, data} = query;
			statement = statements.get(num);
			results = statement?.all(data);
		}
			break;
		case 'get': {
			const {num, data} = query;
			statement = statements.get(num);
			results = statement?.get(data);
		}
			break;
		case 'run': {
			const {num, data} = query;
			statement = statements.get(num);
			results = statement?.run(data);
		}
			break;
		case 'exec': {
			const {data} = query;
			database.exec(data);
		}
			break;
		}
		process.send!(`${taskid}\n${JSON.stringify(results || {})}`);
	});
}

/**
 * @param options Either an object of filename, extension, or just the string filename
 */
export function SQL(options: SQLOptions | string) {
	if (typeof options === 'string') options = {file: options};
	return PM.createProcess(options);
}
