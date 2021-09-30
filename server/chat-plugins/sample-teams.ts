import {FS, Utils} from "../../lib";

const SAMPLE_TEAMS = 'config/chat-plugins/sample-teams.json';

interface SampleTeamsFile {
	whitelist: {[formatid: string]: RoomID[]};
	/** Teams are stored in the packed format */
	teams: {
		[formatid: string]: {
			uncategorized: {[k: string]: string},
			[category: string]: {[teamName: string]: string},
		},
	};
}

const file: SampleTeamsFile = JSON.parse(FS(SAMPLE_TEAMS).readIfExistsSync() || `{"whitelist": {}, "teams": {}}`);

function save() {
	FS(SAMPLE_TEAMS).writeUpdate(() => JSON.stringify(file));
}

if (!file.whitelist) file.whitelist = {};
if (!file.teams) file.teams = {};
for (const formatid in file.teams) {
	if (!file.teams[formatid].uncategorized) file.teams[formatid].uncategorized = {};
}
save();

const SampleTeams = new class SampleTeams {
	isRoomStaff(user: User, roomids: RoomID[]) {
		let matched = false;
		if (!roomids?.length) return false;
		for (const roomid of roomids) {
			const room = Rooms.search(roomid);
			// Malformed entry from botched room rename
			if (!room) throw new Error(`Room ${roomid} not found`);
			matched = room.auth.isStaff(user.id);
			if (matched) break;
		}
		return matched;
	}

	checkPermissions(user: User, roomids: RoomID[]) {
		// Give Development room mods access to help fix crashes
		return this.isRoomStaff(user, roomids) || user.can('bypassall') || !!Rooms.get('development')?.auth.atLeast(user, '@');
	}

	whitelistedRooms(formatid: string, names = false) {
		formatid = this.sanitizeFormat(formatid);
		if (!file.whitelist[formatid]?.length) return undefined;
		if (names) {
			return Utils.sortBy(file.whitelist[formatid], (x) => {
				const room = Rooms.search(x);
				if (!room) throw new Error(`Room ${x} not found`);
				return room.title;
			});
		} else {
			return Utils.sortBy(file.whitelist[formatid]);
		}
	}

	whitelistRooms(formatids: string[], roomids: string[]) {
		for (const unsanitizedFormatid of formatids) {
			const formatid = this.sanitizeFormat(unsanitizedFormatid);
			if (!file.whitelist[formatid]) file.whitelist[formatid] = [];
			for (const roomid of roomids) {
				const targetRoom = Rooms.search(roomid);
				if (!targetRoom?.persist) {
					throw new Chat.ErrorMessage(`Room ${roomid} not found. Check spelling?`);
				}
				if (file.whitelist[formatid].includes(targetRoom.roomid)) {
					throw new Chat.ErrorMessage(`Room ${targetRoom.title} is already added.`);
				}
				file.whitelist[formatid].push(targetRoom.roomid);
				save();
			}
		}
	}

	unwhitelistRoom(formatid: string, roomid: string) {
		// Don't sanitize with Dex.formats.get in case format was removed
		formatid = toID(formatid);
		const targetRoom = Rooms.search(roomid);
		if (!targetRoom?.persist) throw new Chat.ErrorMessage(`Room ${roomid} not found. Check spelling?`);
		if (!file.whitelist[formatid]?.length) throw new Chat.ErrorMessage(`No rooms are whitelisted for ${formatid}.`);
		if (!file.whitelist[formatid].includes(targetRoom.roomid)) {
			throw new Chat.ErrorMessage(`Room ${targetRoom.title} isn't whitelisted.`);
		}
		const index = file.whitelist[formatid].indexOf(targetRoom.roomid);
		file.whitelist[formatid].splice(index, 1);
		if (!file.whitelist[formatid].length) delete file.whitelist[formatid];
		save();
	}

	sanitizeFormat(formatid: string) {
		const format = Dex.formats.get(formatid);
		if (!format.exists) {
			throw new Chat.ErrorMessage(`Format "${formatid.trim()}" not found. Check spelling?`);
		}
		if (format.team) {
			throw new Chat.ErrorMessage(`Formats with team generations can't have team storage.`);
		}
		return format.id;
	}

	initializeFormat(formatid: string) {
		if (!file.teams[formatid]) {
			file.teams[formatid] = {uncategorized: {}};
			save();
		}
	}

	addCategory(user: User, formatid: string, category: string) {
		if (!this.checkPermissions(user, file.whitelist[formatid])) {
			throw new Chat.ErrorMessage(`Access denied. You need to be staff in ${Chat.toListString(file.whitelist[formatid], "or")} to add teams for ${formatid}`);
		}
		formatid = this.sanitizeFormat(formatid);
		category = category.trim();
		this.initializeFormat(formatid);
		if (file.teams[formatid][category]) {
			throw new Chat.ErrorMessage(`The category named ${category} already exists.`);
		}
		file.teams[formatid][category] = {};
		save();
	}

	/**
	 * @param user
	 * @param formatid
	 * @param teamName
	 * @param team - Can be a team in the packed, JSON, or exported format
	 * @param category - Category the team will go in, defaults to uncategorized
	 */
	addTeam(user: User, formatid: string, teamName: string, team: string, category = "uncategorized") {
		if (!this.checkPermissions(user, file.whitelist[formatid])) {
			throw new Chat.ErrorMessage(`Access denied. You need to be staff in ${Chat.toListString(file.whitelist[formatid], "or")} to add teams for ${formatid}`);
		}
		teamName = teamName.trim();
		category = category.trim();
		formatid = this.sanitizeFormat(formatid);
		this.initializeFormat(formatid);
		if (file.teams[formatid][category]?.[teamName]) {
			throw new Chat.ErrorMessage(`There is already a team for ${formatid} with the name ${teamName} in the ${category} category.`);
		}
		if (!file.teams[formatid][category]) this.addCategory(user, formatid, category);
		file.teams[formatid][category][teamName] = Teams.pack(Teams.import(team.trim()));
		save();
		return file.teams[formatid][category][teamName];
	}

	removeTeam(user: User, formatid: string, teamName: string, category: string) {
		formatid = formatid.trim();
		teamName = teamName.trim();
		category = category.trim();
		// Don't sanitize formatid here in case a team was added for a temporary format that got removed
		if (!this.checkPermissions(user, file.whitelist[formatid])) {
			throw new Chat.ErrorMessage(`Access denied. You need to be staff in ${Chat.toListString(file.whitelist[formatid], "or")} to add teams for ${formatid}`);
		}
		const categoryName = this.findCategory(formatid, category);
		if (!categoryName) {
			throw new Chat.ErrorMessage(`There are no teams for ${formatid} under the category ${category.trim()}. Check spelling?`);
		}
		if (!file.teams[formatid][category][teamName]) {
			throw new Chat.ErrorMessage(`There is no team for ${formatid} with the name of "${teamName}". Check spelling?`);
		}
		const oldTeam = file.teams[formatid][category][teamName];
		delete file.teams[formatid][category][teamName];
		if (!Object.keys(file.teams[formatid][category]).length) delete file.teams[formatid][category];
		if (!Object.keys(file.teams[formatid]).filter(x => x !== 'uncategorized').length) delete file.teams[formatid];
		save();
		return oldTeam;
	}

	formatTeam(teamName: string, teamStr: string, broadcasting = false) {
		const team = Teams.unpack(teamStr);
		if (!team) return `Team was imported wrong. PM room staff to fix the formatting.`;
		let buf = ``;
		if (!broadcasting) {
			buf += `<center><strong style="letter-spacing:1.2pt">${team.map(x => `<psicon pokemon="${x.species}" />`).join('')}`;
			buf += `<br />${Utils.escapeHTML(teamName.toUpperCase())}</strong></center>`;
			buf += Chat.getReadmoreCodeBlock(Teams.export(team).trim());
		} else {
			buf += `<details><summary>${team.map(x => `<psicon pokemon="${x.species}" />`).join('')} &ndash; ${Utils.escapeHTML(teamName)}</summary>`;
			buf += `<code style="white-space: pre-wrap; display: table; tab-size: 3">${Teams.export(team).trim().replace(/\n/g, '<br />')}</code></details>`;
		}
		return buf;
	}

	modlog(context: Chat.CommandContext, formatid: string, action: string, note: string, log: string) {
		formatid = this.sanitizeFormat(formatid);
		const whitelistedRooms = this.whitelistedRooms(formatid);
		if (whitelistedRooms?.length) {
			for (const roomid of whitelistedRooms) {
				const room = Rooms.get(roomid);
				if (!room) throw new Error(`Room ${roomid} not found`);
				context.room = room;
				context.modlog(action, null, `${formatid}: ${note}`);
				context.privateModAction(log);
			}
		} else {
			context.room = Rooms.get('staff') || null;
			context.globalModlog(action, null, `${formatid}: ${note}`);
			context.privateGlobalModAction(log);
		}
	}

	/**
	 * Returns the category name of the provided category ID if there is one.
	 */
	findCategory(formatid: string, categoryid: string) {
		formatid = toID(formatid);
		categoryid = toID(categoryid);
		let match: string | null = null;
		for (const categoryName in file.teams[formatid] || []) {
			if (toID(categoryName) === categoryid) {
				match = categoryName;
				break;
			}
		}
		return match;
	}

	getFormatName(formatid: string) {
		return Dex.formats.get(formatid).exists ? Dex.formats.get(formatid).name : formatid;
	}

	save() {
		FS(SAMPLE_TEAMS).writeUpdate(() => JSON.stringify(file));
	}

	destroy() {
		for (const formatid in file.whitelist) {
			for (const [i, roomid] of file.whitelist[formatid].entries()) {
				const room = Rooms.search(roomid);
				if (room) continue;
				file.whitelist[formatid].splice(i, 1);
				save();
			}
		}
	}
};

export const destroy = SampleTeams.destroy;

export const handlers: Chat.Handlers = {
	onRenameRoom(oldID, newID) {
		for (const formatid in file.whitelist) {
			if (!SampleTeams.whitelistedRooms(formatid)?.includes(oldID)) continue;
			SampleTeams.unwhitelistRoom(formatid, oldID);
			SampleTeams.whitelistRooms([formatid], [newID]);
		}
	},
};

export const commands: Chat.ChatCommands = {
	sampleteams: {
		''(target, room, user) {
			this.runBroadcast();
			if (!this.broadcasting) return this.parse(`/j view-sampleteams-view`);
			let [formatid, category] = target.split(',');
			if (!formatid) return this.parse(`/help sampleteams`);
			formatid = SampleTeams.sanitizeFormat(formatid);
			if (!file.teams[formatid]) {
				throw new Chat.ErrorMessage(`No teams for ${SampleTeams.getFormatName(formatid)} found. Check spelling?`);
			}
			let buf = ``;
			if (!category) {
				for (const categoryName in file.teams[formatid]) {
					if (!Object.keys(file.teams[formatid][categoryName]).length) continue;
					if (buf) buf += `<hr />`;
					buf += `<details${Object.keys(file.teams[formatid]).length < 2 ? ` open` : ``}><summary><strong style="letter-spacing:1.2pt">${categoryName.toUpperCase()}</strong></summary>`;
					for (const [i, teamName] of Object.keys(file.teams[formatid][categoryName]).entries()) {
						if (i) buf += `<hr />`;
						buf += SampleTeams.formatTeam(teamName, file.teams[formatid][categoryName][teamName], true);
					}
					buf += `</details>`;
				}
				if (!buf) {
					throw new Chat.ErrorMessage(`No teams for ${SampleTeams.getFormatName(formatid)} found. Check spelling?`);
				} else {
					buf = `<center><h3>Sample Teams for ${SampleTeams.getFormatName(formatid)}</h3></center><hr />${buf}`;
				}
			} else {
				const categoryName = SampleTeams.findCategory(formatid, category);
				if (!categoryName) {
					throw new Chat.ErrorMessage(`No teams for ${SampleTeams.getFormatName(formatid)} in the ${category} category found. Check spelling?`);
				}
				for (const teamName in file.teams[formatid][categoryName]) {
					buf += SampleTeams.formatTeam(teamName, file.teams[formatid][categoryName][teamName], true);
				}
			}
			this.sendReplyBox(buf);
		},
		stopview(target, room, user, connection) {
			connection.send(`>view-sampleteams-view\n|deinit`);
		},
		addcategory(target, room, user) {
			const [formatid, categoryName] = target.split(',');
			if (!(formatid && categoryName)) return this.parse(`/help sampleteams`);
			SampleTeams.addCategory(user, formatid, categoryName.trim());
			SampleTeams.modlog(
				this, formatid, 'ADDTEAMCATEGORY', categoryName.trim(),
				`${user.name} added ${categoryName.trim()} as a category for ${formatid}.`
			);
			this.sendReply(`Added ${categoryName.trim()} as a category for ${formatid}.`);
		},
		add(target, room, user) {
			const [formatid, category, teamName, team] = target.split(',');
			if (!(formatid && category && teamName && team)) return this.parse('/j view-sampleteams-add');
			const packedTeam = SampleTeams.addTeam(user, formatid, teamName, team, category || "uncategorized");
			SampleTeams.modlog(
				this, formatid, 'ADDTEAM', `${category || "uncategorized"}: ${teamName}: ${packedTeam}`,
				`${user.name} added a team for ${formatid}${category ? ` in the ${category} category` : ''}.`
			);
			this.sendReply(`Added a team for ${formatid} ${category ? ` in the ${category} category` : ''}.`);
		},
		remove(target, room, user) {
			const [formatid, category, teamName] = target.split(',').map(x => x.trim());
			if (!(formatid && category && teamName)) return this.parse(`/help sampleteams`);
			const team = SampleTeams.removeTeam(user, formatid, teamName, category || 'uncategorized');
			SampleTeams.modlog(
				this, formatid, 'REMOVETEAM', `${category || "uncategorized"}: ${teamName}: ${team}`,
				`${user.name} removed a team from ${formatid}${category ? ` in the ${category} category` : ''}.`
			);
			this.sendReply(`Removed a team from ${formatid} ${category ? ` in the ${category} category` : ''}.`);
		},
		whitelist: {
			add(target, room, user) {
				// Allow development roommods to whitelist to help debug
				if (!Rooms.get('development')?.auth.atLeast(user, '@')) {
					this.checkCan('bypassall');
				}
				const [formatids, roomids] = target.split('|').map(x => x.split(','));
				if (!(formatids.length && roomids.length)) return this.parse(`/help sampleteams`);
				SampleTeams.whitelistRooms(formatids, roomids);
				this.privateGlobalModAction(`${user.id} whitelisted ${Chat.toListString(roomids.map(x => Rooms.get(x)!.title))} to handle sample teams for ${Chat.toListString(formatids)}.`);
				this.globalModlog(`SAMPLETEAMS WHITELIST`, null, roomids.join(', '));
				this.sendReply(`Whitelisted ${Chat.toListString(roomids)} to handle sample teams for ${Chat.toListString(formatids)}.`);
			},
			remove(target, room, user) {
				// Allow development roommods to whitelist to help debug
				if (!Rooms.get('development')?.auth.atLeast(user, '@')) {
					this.checkCan('bypassall');
				}
				const [formatid, roomid] = target.split(',');
				if (!(formatid && roomid)) return this.parse(`/help sampleteams`);
				SampleTeams.unwhitelistRoom(formatid, roomid);
				this.refreshPage('sampleteams-whitelist');
			},
			'': 'view',
			view(target, room, user) {
				// Allow development roommods to whitelist to help debug
				if (!Rooms.get('development')?.auth.atLeast(user, '@')) {
					this.checkCan('bypassall');
				}
				this.parse(`/j view-sampleteams-whitelist`);
			},
		},
	},
	sampleteamshelp: [
		`/sampleteams [format] - Lists the sample teams for [format], if there are any.`,
		`/sampleteams add [format], [category], [team name], [team] - Adds a sample team for [format]. If there's no dedicated [category] for the team, just leave the category blank. Team can be in the multi-line form. Requires: Room staff in dedicated tier room, &`,
		`/sampleteams remove [format], [category], [team name] - Removes a sample team for [format] in [category].`,
		`/sampleteams whitelist add [formatid], [roomid], [roomid], ... - Whitelists room staff for the provided roomids to add sample teams. Requires: &`,
		`/sampleteams whitelist remove [formatid], [roomid] - Unwhitelists room staff for the provided room to add sample teams. Requires: &`,
	],
};

function formatFakeButton(url: string, text: string) {
	return `<a class="button" style="text-decoration:inherit" target="replace" href="${url}">${text}</a>`;
}

export const pages: Chat.PageTable = {
	sampleteams: {
		whitelist(query, user, connection) {
			this.title = `Sample Teams Whitelist`;
			const isDevMod = Rooms.get('development')?.auth.atLeast(user, '@');
			if (!isDevMod || !user.can('bypassall')) {
				return `<div class="pad"><h2>Access denied.</h2></div>`;
			}
			const staffRoomAccess = Rooms.get('staff')?.checkModjoin(user);
			let buf = `<div class="pad"><button style="float:right" class="button" name="send" value="/j view-sampleteams-whitelist${query.length ? `-${query.join('-')}` : ''}"><i class="fa fa-refresh"></i> Refresh</button><h2>Sample Teams Rooms Whitelist</h2>`;
			if ((!file.whitelist || !Object.keys(file.whitelist).length) && !query.length) {
				buf += `<p>No rooms are whitelisted for any formats.</p>`;
			}
			if (query[0] === 'add') {
				buf += `<form data-submitsend="${staffRoomAccess ? `/msgroom staff,` : isDevMod ? `/msgroom development,` : ``}/sampleteams whitelist add {formats}|{roomids}">`;
				buf += `<label>Enter a list formats, separated by comma: <input name="formats" /></label><br /><br />`;
				buf += `<label>Enter a list of rooms, separated by comma: <input name="roomids" /></label><br />`;
				buf += `<br /><button class="button" type="submit">Whitelist rooms</button></form>`;
				buf += `<br />${formatFakeButton("view-sampleteams-whitelist", "Return to list")}`;
			} else {
				buf += `<dl>`;
				for (const formatid of Object.keys(file.whitelist).sort().reverse()) {
					if (!file.whitelist[formatid]?.length) continue;
					buf += `<dt>${SampleTeams.getFormatName(formatid)}</dt>`;
					for (const roomid of file.whitelist[formatid]) {
						buf += `<dd>${Rooms.get(roomid)?.title || roomid}`;
						buf += ` <button class="button" name="send" value="/sampleteams whitelist remove ${formatid},${roomid}">Remove</button></dd>`;
					}
				}
				buf += `</dl>`;
			}
			buf += `${query.length ? '' : formatFakeButton("view-sampleteams-whitelist-add", "Whitelist room")}</div>`;
			return buf;
		},
		view(query, user, connection) {
			this.title = `Sample Teams`;
			let buf = `<div class="pad">`;
			if (query.slice(0, query.length - 1).join('-')) {
				buf += `${formatFakeButton(`view-sampleteams-view-${query.slice(0, query.length - 1).join('-')}`, "&laquo; Back")}`;
			} else {
				buf += `<button class="button disabled" name="send" value="/sampleteams stopview" disabled>&laquo; Back</button>`;
			}
			buf += `<button style="float:right" class="button" name="send" value="/j view-sampleteams-view${query.join('-') ? `-${query.join('-')}` : ``}"><i class="fa fa-refresh"></i> Refresh</button>`;
			buf += `<center><h2>Sample Teams</h2></center><hr />`;
			if (!query[0]) {
				const formats = Object.keys(file.teams);
				if (!formats.length) return `${buf}<p>No teams found.</p></div>`;
				buf += `<h3>Pick a format</h3><ul>`;
				for (const formatid of formats) {
					if (!formatid) continue;
					buf += `<li>${formatFakeButton(`view-sampleteams-view-${formatid}`, `${SampleTeams.getFormatName(formatid)}`)}</button></li>`;
				}
				buf += `</ul>`;
			} else if (!file.teams[toID(query[0])] || !Object.keys(file.teams[toID(query[0])]).length ||
				(Object.keys(file.teams[toID(query[0])].uncategorized).length &&
					!Object.keys(file.teams[toID(query[0])]).filter(x => x !== 'uncategorized').length)) {
				const name = Dex.formats.get(query[0]).exists ? Dex.formats.get(query[0]).name : toID(query[0]);
				return `${buf}<p>No teams for ${name} were found.</p></div>`;
			} else if (!query[1] || (!SampleTeams.findCategory(query[0], query[1]) && query[1] !== 'allteams')) {
				buf += `<h3>Pick a category</h3><ul>`;
				for (const category of Object.keys(file.teams[toID(query[0])])) {
					buf += `<li><a class="button" style="text-decoration:inherit;color:inherit" target="replace" href="view-sampleteams-view-${query[0]}-${toID(category)}">${category}</button></li>`;
				}
				buf += `<li><a class="button" style="text-decoration:inherit;color:inherit" target="replace" href="view-sampleteams-view-${query[0]}-allteams">ALL</button></li></ul>`;
			} else if (query[1] === 'allteams') {
				buf += `<h3>All teams for ${SampleTeams.getFormatName(query[0])}</h3>`;
				for (const categoryName in file.teams[toID(query[0])]) {
					const category = file.teams[toID(query[0])][categoryName];
					if (!Object.keys(category).length) continue;
					buf += `<details><summary><h4 style="display:inline">${categoryName}</h4></summary>`;
					for (const teamName in category) {
						const team = category[teamName];
						if (SampleTeams.checkPermissions(user, file.whitelist[query[0]] || [])) {
							buf += `<button class="button" style="float:right" name="send" value="/sampleteams remove ${query[0]},${categoryName},${teamName}">Delete team</button>`;
						}
						buf += SampleTeams.formatTeam(teamName, team);
					}
					buf += `</details>`;
					const index = Object.keys(file.teams[toID(query[0])]).indexOf(categoryName);
					if (index !== Object.keys(file.teams[toID(query[0])]).length - 1) buf += `<hr />`;
				}
			} else if (SampleTeams.findCategory(query[0], query[1])) {
				const categoryName = SampleTeams.findCategory(query[0], query[1])!;
				buf += `<h3>Sample teams for ${SampleTeams.getFormatName(query[0])} in the ${categoryName} category</h3>`;
				for (const teamName in file.teams[query[0]][categoryName]) {
					const team = file.teams[query[0]][categoryName][teamName];
					buf += SampleTeams.formatTeam(teamName, team);
				}
			}
			buf += `</div>`;
			return buf;
		},
		add(query, user, connection) {
			this.title = `Sample Teams`;
			const formats = Array.from(new Set(Dex.formats.all().map(format => (format.name.includes('(') ?
				format.name.slice(0, format.name.indexOf('(')) : format.name).trim()))).map(formatName =>
				Dex.formats.get(formatName)).filter(format =>
				!format.name.includes('Custom') && format.effectType === 'Format' && !format.team &&
				SampleTeams.checkPermissions(user, SampleTeams.whitelistedRooms(format.id) || []));
			if (!formats.length) return `<div class="pad"><h2>Access denied.</h2></div>`;
			let buf = `<div class="pad"><h2>Add a sample team</h2>`;
			if (!query[0] || !Dex.formats.get(query[0]).exists) {
				buf += `<h3>Pick a format</h3><ul>`;
				for (const format of formats) {
					buf += `<li>${formatFakeButton(`view-sampleteams-add-${format.id}`, format.name)}</button></li>`;
				}
				buf += `</ul>`;
			}
			if (!query[1] || !SampleTeams.findCategory(query[0], query[1]) || query[1] === 'addnewcategory') {
				const name = SampleTeams.getFormatName(query[0]);
				if (query[1] === 'addnewcategory') {
					buf += `<h3>Add a category for ${name}</h3>`;
					buf += `<form data-submitsend="/sampleteams addcategory ${query[0]},{categoryname}">`;
					buf += `<input name="categoryname" />`;
					buf += `<button class="button" type="submit">Add category</button></form>`;
				} else {
					buf += `<h3>Pick a category for ${name}</h3><ul>`;
					for (const category of Object.keys(file.teams[query[0]] || {}) || []) {
						buf += `<li style="padding-top:5px">${formatFakeButton(`view-sampleteams-add-${query[0]}-${toID(category)}-submit`, category)}</li>`;
					}
					buf += `<li style="padding-top:5px">${formatFakeButton(`view-sampleteams-add-${query[0]}-addnewcategory`, `<strong>Add new category</strong>`)}</li></ul>`;
				}
			}
			if (query[2] === 'submit' && SampleTeams.findCategory(query[0], query[1])) {
				const categoryName = SampleTeams.findCategory(query[0], query[1]);
				buf += `<form data-submitsend="/sampleteams add ${query[0]}, ${categoryName}, {teamName}, {team}">`;
				buf += `<h3>Enter a team name</h3><input name="teamName" />`;
				buf += `<h3>Enter team importable</h3><textarea style="width:100%;height:400px" name="team"></textarea><br />`;
				buf += `<button class="button" type="submit">Add sample team</button></form>`;
			}
			buf += `</div>`;
			return buf;
		},
	},
};

Chat.multiLinePattern.register(`/sampleteams add `);
