/**
 * Private message handling, particularly for offline messages.
 * By Mia.
 * @author mia-pi-git
 */
import {SQL, Utils} from '../../lib';
import {Config} from '../config-loader';
import {statements} from './database';
/** The time until a PM sent offline expires. Presently, 60 days. */
export const EXPIRY_TIME = 60 * 24 * 60 * 60 * 1000;
/** The time until a PM that has been seen by the user expires. Presently, one week.*/
export const SEEN_EXPIRY_TIME = 7 * 24 * 60 * 60 * 1000;
/** The max PMs that one user can have pending to a specific user at one time */
export const MAX_PENDING = 20;

// this would be in database.ts, but for some weird reason, if the extension and the pm are the same
// it doesn't work. all the keys in the require() result are there, but they're also set to undefined.
// no idea why.
export const PM = SQL(module, {
	file: 'databases/offline-pms.db',
	extension: 'dist/server/private-messages/database.js',
});

export interface ReceivedPM {
	time: number;
	sender: string;
	receiver: string;
	seen: number | null;
	message: string;
}

export const PrivateMessages = new class {
	database = PM;
	clearInterval = this.nextClear();
	offlineIsEnabled = Config.usesqlitepms && Config.usesqlite;
	async sendOffline(to: string, from: User | string, message: string, context?: Chat.CommandContext) {
		const result = await PM.transaction('send', [toID(from), toID(to), message]);
		if (result.error) throw new Chat.ErrorMessage(result.error);
		if (typeof from === 'object') {
			from.send(`|pm|${this.getIdentity(from)}|${this.getIdentity(to)}|${message} __[sent offline]__`);
		}
		const changed = !!result.changes;
		if (changed && context) {
			Chat.runHandlers('onMessageOffline', context, message, toID(to));
		}
		return changed;
	}
	setViewOnly(user: User | string, val: string | null) {
		const id = toID(user);
		return PM.run(statements.setBlock, [id, val]);
	}
	checkCanUse(user: User, forceBool = false) {
		if (!this.offlineIsEnabled) {
			if (forceBool) return false;
			throw new Chat.ErrorMessage(`Offline PMs are currently disabled.`);
		}
		if (!user.autoconfirmed) {
			if (forceBool) return false;
			throw new Chat.ErrorMessage("You must be autoconfirmed to use offine messaging.");
		}
		if (!Users.globalAuth.atLeast(user, Config.usesqlitepms)) {
			if (forceBool) return false;
			throw new Chat.ErrorMessage("You do not have the needed rank to send offline PMs.");
		}
		return true;
	}
	checkCanPM(user: User, pmTarget: ID) {
		this.checkCanUse(user);
		if (Config.usesqlitepms === 'friends' && !user.friends?.has(pmTarget)) {
			throw new Chat.ErrorMessage(
				`At this time, you may only send offline messages to friends. You do not have ${pmTarget} friended.`
			);
		}
	}
	async sendReceived(user: User) {
		const userid = toID(user);
		// we only want to send the unseen pms to them when they login - they can replay the rest at will otherwise
		const messages = await this.fetchUnseen(userid);
		for (const {message, time, sender} of messages) {
			user.send(
				`|pm|${this.getIdentity(sender)}|${this.getIdentity(user)}|` +
				`${message} __[sent offline, ${Chat.toTimestamp(new Date(time))}]__`
			);
		}
	}
	private getIdentity(user: User | string) {
		user = Users.getExact(user) || user;
		if (typeof user === 'object') {
			return user.getIdentity();
		}
		return `${Users.globalAuth.get(toID(user))}${user}`;
	}
	nextClear(): NodeJS.Timer {
		if (!PM.isParentProcess) return null!;
		const time = Date.now();
		// even though we expire once a week atm, we check once a day
		const nextMidnight = new Date(time + 24 * 60 * 60 * 1000);
		nextMidnight.setHours(0, 0, 1);
		if (this.clearInterval) clearTimeout(this.clearInterval);
		this.clearInterval = setTimeout(() => {
			void this.clearOffline();
			void this.clearSeen();
			this.nextClear();
		}, nextMidnight.getTime() - time);
		return this.clearInterval;
	}
	clearSeen() {
		return PM.run(statements.clearSeen);
	}
	send(message: string, user: User, pmTarget: User, onlyRecipient: User | null = null) {
		const buf = `|pm|${user.getIdentity()}|${pmTarget.getIdentity()}|${message}`;
		if (onlyRecipient) return onlyRecipient.send(buf);
		user.send(buf);
		if (pmTarget !== user) pmTarget.send(buf);
		pmTarget.lastPM = user.id;
		user.lastPM = pmTarget.id;
	}
	async fetchUnseen(user: User | string): Promise<ReceivedPM[]> {
		const userid = toID(user);
		return (await PM.transaction('listNew', [userid])) || [];
	}
	async fetchAll(user: User | string): Promise<ReceivedPM[]> {
		return (await PM.all(statements.fetch, [toID(user)])) || [];
	}
	async renderReceived(user: User) {
		const all = await this.fetchAll(user);
		let buf = `<div class="ladder pad">`;
		buf += `<h2>PMs received offline in the last ${Chat.toDurationString(SEEN_EXPIRY_TIME)}</h2>`;
		const sortedPMs: {[userid: string]: ReceivedPM[]} = {};
		for (const curPM of all) {
			if (!sortedPMs[curPM.sender]) sortedPMs[curPM.sender] = [];
			sortedPMs[curPM.sender].push(curPM);
		}
		for (const k in sortedPMs) {
			Utils.sortBy(sortedPMs[k], pm => -pm.time);
		}
		buf += `<div class="mainmenuwrapper" style="margin-left:40px">`;
		for (const pair of Utils.sortBy(Object.entries(sortedPMs), ([id]) => id)) {
			const [sender, messages] = pair;
			const group = Users.globalAuth.get(toID(sender));
			const name = Users.getExact(sender)?.name || sender;
			const id = toID(name);
			buf += Utils.html`<div class="pm-window pm-window-${id}" width="30px" data-userid="${id}" data-name="${group}${name}" style="width:300px">`;
			buf += Utils.html`<h3><small>${group}</small>${name}</h3>`;
			buf += `<div class="pm-log"><div class="pm-buttonbar">`;
			for (const {message, time} of messages) {
				buf += `<div class="chat chatmessage-${toID(sender)}">&nbsp;&nbsp;`;
				buf += `<small>[${Chat.toTimestamp(new Date(time))}] </small>`;
				buf += Utils.html`<small>${group}</small>`;
				buf += Utils.html`<span class="username" data-roomgroup="${group}" data-name="${name}"><username>${name}</username></span>: `;
				buf += `<em>${message}</em></div>`;
			}
			buf += `</div></div></div>`;
			buf += `<br />`;
		}
		buf += `</div>`;
		return buf;
	}
	clearOffline() {
		return PM.run(statements.clearDated);
	}
	destroy() {
		void PM.destroy();
	}
};

if (Config.usesqlite) {
	if (PM.isParentProcess) {
		PM.spawn(Config.pmprocesses || 1);
		// clear super old pms on startup
		void PM.run(statements.clearDated);
	} else {
		global.Monitor = {
			crashlog(error: Error, source = 'A private message child process', details: AnyObject | null = null) {
				const repr = JSON.stringify([error.name, error.message, source, details]);
				process.send!(`THROW\n@!!@${repr}\n${error.stack}`);
			},
		};
		process.on('uncaughtException', err => {
			Monitor.crashlog(err, 'A private message database process');
		});
		process.on('unhandledRejection', err => {
			Monitor.crashlog(err as Error, 'A private message database process');
		});
	}
}


if (Config.usesqlite) {
	if (PM.isParentProcess) {
		PM.spawn(Config.pmprocesses || 1);
		// clear super old pms on startup
		void PM.run(statements.clearDated);
	} else {
		global.Monitor = {
			crashlog(error: Error, source = 'A private message child process', details: AnyObject | null = null) {
				const repr = JSON.stringify([error.name, error.message, source, details]);
				process.send!(`THROW\n@!!@${repr}\n${error.stack}`);
			},
		};
		process.on('uncaughtException', err => {
			Monitor.crashlog(err, 'A private message database process');
		});
		process.on('unhandledRejection', err => {
			Monitor.crashlog(err as Error, 'A private message database process');
		});
	}
}

