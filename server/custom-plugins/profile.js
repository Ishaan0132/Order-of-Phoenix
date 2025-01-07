/****************************************************************************
 * Profiles for Pokemon Showdown											*
 * Displays to users a profile of a given user.								*
 * For order's sake:														*
 * - vip, dev, custom title, friend code, and profile were placed in here.	*
 * Updated and restyled by Mystifi and Insist								*
 * Main Profile credit goes out to panpawn/jd/other contributors.			*
 ****************************************************************************/

"use strict";

// fill your server's IP in your config.js for exports.serverIp
const serverIp = Config.serverIp;

function isDev(user) {
	if (!user) return;
	if (typeof user === "object") user = user.id;
	let dev = Db.devs.get(toID(user));
	if (dev === 1) return true;
	return false;
}
Server.isDev = isDev;

function isVIP(user) {
	if (!user) return;
	if (typeof user === "object") user = user.id;
	let vip = Db.vips.get(toID(user));
	if (vip === 1) return true;
	return false;
}

Server.isVIP = isVIP;

function getLastSeen(userid) {
	if (Users.get(userid) && Users.get(userid).connected) return `<font color = "limegreen"><strong>Currently Online</strong></font>`;
	let seen = Db.seen.get(userid);
	if (!seen) return `<font color = "red"><strong>Never</strong></font>`;
	return Chat.toDurationString(Date.now() - seen, {precision: true}) + " ago.";
}

function pColor(user) {
	let color = Db.profile.get(user, {data: {title: {}, music: {}}}).color;
	if (!color) return `<font>`;
	return `<font color="${color}">`;
}

function pBorder(user) {
	let border = Db.profile.get(user, {data: {title: {}, music: {}}}).border;
	if (!border) return `1px solid`;
	return `1px solid ${border}`;
}

function showBadges(user) {
	if (Db.userBadges.has(toID(user))) {
		let badges = Db.userBadges.get(toID(user));
		let css = 'border:none;background:none;padding:0;';
		if (typeof badges !== 'undefined' && badges !== null) {
			let output = '<td><div style="float: right; background: rgba(69, 76, 80, 0.4); text-align: center; border-radius: 12px; box-shadow: 0px 0px 5px rgba(0, 0, 0, 0.2) inset; margin: 0px 3px;">';
			output += ' <table style="' + css + '"> <tr>';
			for (let i = 0; i < badges.length; i++) {
				if (i !== 0 && i % 4 === 0) output += '</tr> <tr>';
				output += '<td><button style="' + css + '" name="send" value="/badges info, ' + badges[i] + '">' +
					'<img src="' + Db.badgeData.get(badges[i])[1] + '" height="16" width="16" alt="' + badges[i] + '" title="' + badges[i] + '" >' + '</button></td>';
			}
			output += '</tr> </table></div></td>';
			return output;
		}
	}
	return '';
}

exports.commands = {
	dev: {
		give: function (target, room, user) {
			room = this.requireRoom();
			this.checkCan('hotpatch', null, room);
			if (!target) return this.parse("/help", true);
			let devUsername = toID(target);
			if (devUsername.length > 18) return this.errorReply("Usernames cannot exceed 18 characters.");
			if (isDev(devUsername)) return this.errorReply(`${target} is already a DEV user.`);
			Db.devs.set(devUsername, 1);
			this.sendReply(`|html|${Server.nameColor(target, true)} has been given DEV status.`);
			if (Users.get(devUsername)) Users(devUsername).popup(`|html|You have been given DEV status by ${Server.nameColor(user.name, true)}.`);
		},

		take: function (target, room, user) {
			room = this.requireRoom();
			this.checkCan('hotpatch', null, room);
			if (!target) return this.parse("/help", true);
			let devUsername = toID(target);
			if (devUsername.length > 18) return this.errorReply("Usernames cannot exceed 18 characters.");
			if (!isDev(devUsername)) return this.errorReply(`${target} isn't a DEV user.`);
			Db.devs.remove(devUsername);
			this.sendReply(`|html|${Server.nameColor(target, true)} has been demoted from DEV status.`);
			if (Users.get(devUsername)) Users(devUsername).popup(`|html|You have been demoted from DEV status by ${Server.nameColor(user.name, true)}.`);
		},

		users: "list",
		list: function () {
			if (!Db.devs.keys().length) return this.errorReply("There seems to be no user(s) with DEV status.");
			let display = [];
			Db.devs.keys().forEach(devUser => {
				display.push(Server.nameColor(devUser, (Users(devUser) && Users(devUser).connected)));
			});
			this.popupReply(`|html|<strong><u><font size="3"><center>DEV Users:</center></font></u></strong>${Chat.toListString(display)}`);
		},

		"": "help",
		help: function () {
			this.parse(`/help dev`);
		},
	},
	devhelp: [
		`/dev give [user] - Gives [user] DEV status. Requires &, ~
		/dev take [user] - Takes away [user]'s DEV status. Requires &, ~
		/dev list - Displays the list of user's with DEV status.
		/dev help - Displays the list of Dev commands.`,
	],

	vip: {
		give: function (target, room, user) {
			room = this.requireRoom();
			this.checkCan('profile', null, room);
			if (!target) return this.parse("/help", true);
			let vipUsername = toID(target);
			if (vipUsername.length > 18) return this.errorReply("Usernames cannot exceed 18 characters.");
			if (isVIP(vipUsername)) return this.errorReply(`${target} is already a VIP user.`);
			Db.vips.set(vipUsername, 1);
			this.sendReply(`|html|${Server.nameColor(vipUsername, true)} has been given VIP status.`);
			if (Users.get(vipUsername)) Users(vipUsername).popup(`|html|You have been given VIP status by ${Server.nameColor(user.name, true)}.`);
		},

		take: function (target, room, user) {
			room = this.requireRoom();
			this.checkCan('profile', null, room);
			if (!target) return this.parse("/help", true);
			let vipUsername = toID(target);
			if (vipUsername.length > 18) return this.errorReply("Usernames cannot exceed 18 characters.");
			if (!isVIP(vipUsername)) return this.errorReply(`${target} isn't a VIP user.`);
			Db.vips.remove(vipUsername);
			this.sendReply(`|html|${Server.nameColor(vipUsername, true)} has been demoted from VIP status.`);
			if (Users.get(vipUsername)) Users(vipUsername).popup(`|html|You have been demoted from VIP status by ${Server.nameColor(user.name, true)}.`);
		},

		users: "list",
		list: function () {
			if (!Db.vips.keys().length) return this.errorReply("There seems to be no user(s) with VIP status.");
			let display = [];
			Db.vips.keys().forEach(vipUser => {
				display.push(Server.nameColor(vipUser, (Users(vipUser) && Users(vipUser).connected)));
			});
			this.popupReply(`|html|<strong><u><font size="3"><center>VIP Users:</center></font></u></strong>${Chat.toListString(display)}`);
		},

		"": "help",
		help: function () {
			this.parse(`/help vip`);
		},
	},
	viphelp: [
		`/vip give [user] - Gives [user] VIP status. Requires %, @, &, ~
		/vip take [user] - Takes away [user]'s VIP status. Requires %, @, &, ~
		/vip list - Displays the list of user's with VIP status.
		/vip help - Displays the list of VIP commands.`,
	],

	title: "customtitle",
	customtitle: {
		set: "give",
		give: function (target, room, user) {
			room = this.requireRoom();
			this.checkCan('profile', null, room);
			let [userid, titleName, color] = target.split(",").map(p => {return p.trim();});
			if (!color) return this.parse("/help", true);
			userid = toID(userid);
			let profile = Db.profile.get(userid, {data: {title: {}, music: {}}});
			if (color.charAt(0) !== "#") return this.errorReply(`The color needs to be a hex starting with "#".`);
			profile.data.title.title = titleName;
			profile.data.title.color = color;
			Db.profile.set(userid, profile);
			if (Users(userid)) Users(userid).popup(`|html|You have received a custom title from ${Server.nameColor(user.name, true)}.<br />Title: <font color="${color}">(<strong>${titleName}</strong>)</font><br />Title Hex Color: ${color}`);
			this.privateModAction(`${user.name} set a custom title to ${userid}'s profile.`);
			Monitor.log(`${user.name} set a custom title to ${userid}'s profile.`);
			return this.sendReply(`Title "${titleName}" and color "${color}" for ${userid}'s custom title have been set.`);
		},

		delete: "remove",
		take: "remove",
		remove: function (target, room, user) {
			room = this.requireRoom();
			this.checkCan('profile', null, room);
			if (!target) return this.parse("/help", true);
			let userid = toID(target);
			let profile = Db.profile.get(userid, {data: {title: {}, music: {}}});
			if (!(profile.data.title.title || profile.data.title.color)) return this.errorReply(`${target} doesn't have a custom title yet.`);
			delete profile.data.title.title;
			delete profile.data.title.color;
			Db.profile.set(userid, profile);
			if (Users(userid)) Users(userid).popup(`|html|${Server.nameColor(user.name, true)} has removed your custom title.`);
			this.privateModAction(`${user.name} removed ${target}'s custom title.`);
			Monitor.log(`${user.name} removed ${target}'s custom title.`);
			return this.sendReply(`${target}'s custom title and title color was removed from the server memory.`);
		},

		"": "help",
		help: function () {
			this.parse(`/help customtitle`);
		},
	},
	customtitlehelp: [
		`/customtitle set [user], [title], [hex code] - Sets the [user]'s title as [title] with the hex code [hex code]. Requires %, @, &, ~
		/customtitle take [user] - Deletes the [user]'s custom title. Requires %, @, &, ~
		/customtitle help - Displays a list of help commands about custom titles.`,
	],

	favoritetype: "type",
	type: {
		add: "set",
		set: function (target, room, user) {
			if (!target) return this.parse("/help type");
			let profile = Db.profile.get(user.id, {data: {title: {}, music: {}}});
			let type = Dex.getType(target);
			if (!type.exists) return this.errorReply("Not a type. Check your spelling?");
			profile.type = toID(type);
			Db.profile.set(user.id, profile);
			return this.sendReply(`Your favorite type has been set to "${target}".`);
		},

		del: "delete",
		remove: "delete",
		delete: function (target, room, user) {
			let profile = Db.profile.get(user.id, {data: {title: {}, music: {}}});
			if (!profile.type) return this.errorReply(`Your profile type hasn't been set yet.`);
			delete profile.type;
			Db.profile.set(user.id, profile);
			return this.sendReply("Your favorite type has been deleted from your profile.");
		},

		"": "help",
		help: function () {
			this.parse("/help type");
		},
	},
	typehelp: [
		`/type set [type] - Sets your Favorite Type.
		/type delete - Removes your Favorite Type.
		/type help - Displays a list of type commands.`,
	],

	profileborder: "pborder",
	pborder: {
		set: "add",
		add: function (target, room, user) {
			if (!target) return this.parse("/pborder help");
			let profile = Db.profile.get(user.id, {data: {title: {}, music: {}}});
			let border = target.trim();
			profile.border = border;
			Db.profile.set(user.id, profile);
			this.sendReply(`You have set your profile border to ${border}`);
		},

		delete: "remove",
		remove: function (target, room, user) {
			this.checkCan('profile', null, room);
			let userid = toID(target);
			let profile = Db.profile.get(userid, {data: {title: {}, music: {}}});
			if (!target) return this.parse("/pborder help");
			if (!profile.border) return this.errorReply(`${target} doesn't have his profile broder set.`);
			delete profile.border;
			Db.profile.set(userid, profile);
			if (Users.get(userid)) Users.get(userid).popup(`|html|${Server.nameColor(user.name, true)} has removed your profile border.`);
			this.sendReply(`You have removed ${target}'s profile border.`);
		},

		"": "help",
		help: function () {
			this.parse(`/help pborder`);
		},
	},
	pborderhelp: [
		`Profile Border commands by: Prince Sky.
		/pborder set [value] - Sets your profile border.
		/pborder delete [user] - Remove user's profile border.
		/pborderhelp - Shows this command.`,
	],
	profilecolor: "pcolor",
	pcolor: {
		set: "add",
		add: function (target, room, user) {
			if (!target) return this.parse("/pcolor help");
			let profile = Db.profile.get(user.id, {data: {title: {}, music: {}}});
			let color = target.trim();
			if (color.charAt(0) !== "#") return this.errorReply(`The color needs to be a hex starting with "#".`);
			profile.color = color;
			Db.profile.set(user.id, profile);
			this.sendReply(`You have set your profile color to "${color}".`);
		},

		delete: "remove",
		remove: function (target, room, user) {
			room = this.requireRoom();
			this.checkCan('profile', null, room);
			let userid = toID(target);
			let profile = Db.profile.get(userid, {data: {title: {}, music: {}}});
			if (!target) return this.parse("/pcolor help");
			if (!profile.color) return this.errorReply(`${target} does not have a profile color set.`);
			delete profile.color;
			Db.profile.set(userid, profile);
			if (Users(userid)) Users(userid).popup(`|html|${Server.nameColor(user.name, true)} has removed your profile color.`);
			this.sendReply(`You have removed ${target}'s profile color.`);
		},

		"": "help",
		help: function () {
			this.parse(`/help pcolor`);
		},
	},
	pcolorhelp: [
		`/pcolor set [hex code] - Sets your profile color as [hex code].
		/pcolor take [user] - Removes [user]'s profile color. Requires %, @, &, ~
		/pcolor help - Displays the profile color commands.`,
	],

	bg: "background",
	background: {
		set: "setbg",
		setbackground: "setbg",
		setbg: function (target) {
			room = this.requireRoom();
			this.checkCan('profile', null, room);
			let [userid, link] = target.split(",").map(p => {return p.trim();});
			userid = toID(userid);
			let profile = Db.profile.get(userid, {data: {title: {}, music: {}}});
			if (!link) return this.parse(`/help background`);
			if (![".png", ".gif", ".jpg"].includes(link.slice(-4))) return this.errorReply(`Backgrounds must end in an extension like .png, .gif, or .jpg.`);
			profile.background = link;
			Db.profile.set(userid, profile);
			this.sendReplyBox(`This user's background has been set as:<br /><img src="${link}">`);
		},

		removebg: "deletebg",
		remove: "deletebg",
		deletebackground: "deletebg",
		takebg: "deletebg",
		take: "deletebg",
		delete: "deletebg",
		deletebg: function (target) {
			room = this.requireRoom();
			this.checkCan('profile', null, room);
			let targ = toID(target);
			if (!targ) return this.parse("/backgroundhelp");
			let profile = Db.profile.get(targ, {data: {title: {}, music: {}}});
			if (!profile.background) return this.errorReply(`${target} doesn't have a custom background.`);
			delete profile.background;
			Db.profile.set(targ, profile);
			return this.sendReply(`${target}'${target.endsWith("s") ? `` : `s`} custom background was removed.`);
		},

		"": "help",
		help: function () {
			this.parse("/help background");
		},
	},
	backgroundhelp: [
		`/bg set [user], [link] - Sets [user]'s profile background as [link]. Requires %, @, &, ~
		/bg delete [user] - Removes [user]'s profile background. Requires %, @, &, ~
		/bg help - Displays the help command for Profile Backgrounds.`,
	],

	song: "music",
	music: {
		add: "set",
		give: "set",
		set: function (target) {
			room = this.requireRoom();
			this.checkCan('profile', null, room);
			let [userid, link, title] = target.split(",").map(p => {return p.trim();});
			userid = toID(userid);
			let profile = Db.profile.get(userid, {data: {title: {}, music: {}}});
			if (!title) return this.parse("/musichelp");
			if (![".mp3", ".mp4", ".m4a"].includes(link.slice(-4))) return this.errorReply(`Music links must end in an extension like .mp3, .mp4, or .m4a.`);
			profile.data.music.link = link;
			profile.data.music.title = title;
			Db.profile.set(userid, profile);
			this.sendReplyBox(`${userid}'${userid.endsWith("s") ? `` : `s`} song has been set.<br /><acronym title="${profile.data.music.title}"><br /><audio src="${profile.data.music.link}" controls="" style="width:100%;"></audio></acronym>`);
		},

		take: "delete",
		remove: "delete",
		delete: function (target) {
			room = this.requireRoom();
			this.checkCan('profile', null, room);
			target = toID(target);
			let profile = Db.profile.get(target, {data: {title: {}, music: {}}});
			if (!target) return this.parse("/musichelp");
			if (!(profile.data.music.link || profile.data.music.title)) return this.errorReply(`${target} does not have any profile music.`);
			delete profile.data.music.link;
			delete profile.data.music.title;
			Db.profile.set(target, profile);
			return this.sendReply(`You have removed ${target}'${target.endsWith("s") ? `` : `s`} profile music.`);
		},

		"": "help",
		help: function () {
			this.parse("/musichelp");
		},
	},
	musichelp: [
		`/music set [user], [link], [title of song] - Sets a [user]'s profile music as [link] titled [title]. Requires %, @, &, ~
		/music take [user] - Removes a [user]'s profile music. Requires %, @, &, ~
		/music help - Displays help on the profile music commands.`,
	],

	profileabout: 'pabout',
	pabout: {
		set: function (target, room, user) {
			if (room.battle) return this.errorReply(`Please use this command outside of battle rooms.`);
			if (!user.autoconfirmed) return this.errorReply(`You must be autoconfirmed to use this command.`);
			if (!target) return this.parse(`/pabouthelp`);
			let ab = target;
			if (ab.length > 300) return this.errorReply(`About can't be longer than 300 characters.`);
			Db.about.set(user.id, ab);
			this.sendReply(`You've set your profile about.`);
		},
		remove: "delete",
		delete: function (target, room, user) {
			if (room.battle) return this.errorReply("Please use this command outside of battle rooms.");
			if (!user.autoconfirmed) return this.errorReply("You must be autoconfirmed to use this command.");
			if (!target) {
				if (!Db.about.has(user.id)) return this.errorReply("Your about isn't set.");
				Db.about.remove(user.id);
				return this.sendReply("Your about has been deleted from the server.");
			} else {
				this.checkCan('profile', null, room);
				let userid = toID(target);
				if (!Db.about.has(userid)) return this.errorReply(`${target} hasn't set a about.`);
				Db.about.remove(userid);
				return this.sendReply(`${target}'s About has been deleted from the server.`);
			}
		},
		show: function (target, room, user) {
		    if (room.battle) return this.errorReply(`Please use this command outside of battle rooms.`);
		    let tar = target.toLowerCase();
		    let show = Db.about.get(tar);
		    this.sendReplyBox(`${show}`);
		},
		"": "help",
		help: function () {
		    this.parse(`/pabouthelp`);
		},
	},
	pabouthelp: [`
		/pabout set [about] - Set your profile about.
		/pabout delete - delete your profile about.
	`],

	pokemon: {
		add: "set",
		set: function (target, room, user) {
			if (!target) return this.parse("/pokemonhelp");
			let profile = Db.profile.get(user.id, {data: {title: {}, music: {}}});
			let pkmn = Dex.getTemplate(target);
			if (!pkmn.exists) return this.errorReply("Not a Pokemon. Check your spelling?");
			profile.pokemon = pkmn.species;
			Db.profile.set(user.id, profile);
			return this.sendReply(`You have successfully set your favorite Pokemon as "${pkmn.species}".`);
		},

		del: "delete",
		remove: "delete",
		delete: function (target, room, user) {
			let profile = Db.profile.get(user.id, {data: {title: {}, music: {}}});
			if (!profile.pokemon) return this.errorReply("Your favorite Pokemon hasn't been set.");
			delete profile.pokemon;
			Db.profile.set(user.id, profile);
			return this.sendReply("Your favorite Pokemon has been deleted from your profile.");
		},

		"": "help",
		help: function () {
			this.parse("/pokemonhelp");
		},
	},
	pokemonhelp: [
		`/pokemon set [Pokemon] - Sets your Favorite Pokemon.
		/pokemon delete - Removes your Favorite Pokemon.
		/pokemon help - Displays information on Pokemon commands.`,
	],

	natures: "nature",
	nature: {
		add: "set",
		set: function (target, room, user) {
			let profile = Db.profile.get(user.id, {data: {title: {}, music: {}}});
			if (!target) return this.parse("/naturehelp");
			let nature = Dex.getNature(target);
			if (!nature.exists) return this.errorReply("This is not a nature. Check your spelling?");
			profile.nature = nature.name;
			Db.profile.set(user.id, profile);
			return this.sendReply("You have successfully set your nature onto your profile.");
		},

		del: "delete",
		take: "delete",
		remove: "delete",
		delete: function (target, room, user) {
			let profile = Db.profile.get(user.id, {data: {title: {}, music: {}}});
			if (!profile.nature) return this.errorReply("Your nature has not been set.");
			delete profile.nature;
			Db.profile.set(user.id, profile);
			return this.sendReply("Your nature has been deleted from your profile.");
		},

		"": "help",
		help: function () {
			this.parse("/naturehelp");
		},
	},
	naturehelp: [
		`/nature set [nature] - Sets your Profile Nature.
		/nature delete - Removes your Profile Nature.
		/nature help - Displays information about Profile Nature commands.`,
	],

	"!profile": true,
	profile: function (target, room, user) {
		target = toID(target);
		if (!target) target = user.name;
		if (target.length > 18) return this.errorReply("Usernames cannot exceed 18 characters.");
		if (!this.runBroadcast()) return;
		let targetUser = Users.get(target);
		let username = (targetUser ? targetUser.name : target);
		let userid = (targetUser ? targetUser.id : toID(target));
		let profile = Db.profile.get(userid, {data: {title: {}, music: {}}});
		let avatar = (targetUser ? (isNaN(targetUser.avatar) ? `http://${serverIp}/avatars/${targetUser.avatar}` : `http://play.pokemonshowdown.com/sprites/trainers/${targetUser.avatar}.png`) : (Config.customavatars[userid] ? `http://${serverIp}/avatars/${Config.customavatars[userid]}` : `http://play.pokemonshowdown.com/sprites/trainers/1.png`));
		if (targetUser && targetUser.avatar[0] === "#") avatar = `http://play.pokemonshowdown.com/sprites/trainers/${targetUser.avatar.substr(1)}.png`;
		let userSymbol = (Users.globalAuth.get(userid) ? Users.globalAuth.get(userid).substr(0, 1) : "Regular User");
		let userGroup = (Config.groups[userSymbol] ? `Global ${Config.groups[userSymbol].name}` : `Regular User`);
		let regdate = "(Unregistered)";
		Server.regdate(userid, date => {
			if (date) {
				let d = new Date(date);
				let MonthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
				regdate = `${MonthNames[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}`;
			}
		});

		let profileData = ``;
		if (profile.background) {
			profileData += `<div style="background:url(${profile.background}); background-size: 100% 100%; height: 160px; padding: 5px; border: ${pBorder(userid)}; overflow-y: auto">`;
		} else {
			profileData += `<div style="max-height: 160px; border: ${pBorder(userid)}; overflow-y: auto"><br>`;
		}
		profileData += `${showBadges(toID(username))}`;
		profileData += `<div style="display: inline-block; width: 6.5em; height: 100%; vertical-align: top"><img src="${avatar}" height="80" width="80" align="left"></div>`;
		profileData += `<div style="display: inline-block">&nbsp;${pColor(userid)}<strong>Name:</strong></font> ${Server.nameColor(username, true)}&nbsp;`;
		if (profile.data.title.title) profileData += ` <font color="${profile.data.title.color}">(<strong>${profile.data.title.title}</strong>)</font>`;
		profileData += `<br />`;
		profileData += `&nbsp;${pColor(userid)}<strong>Group:</strong> ${userGroup}</font>`;
		if (isDev(userid)) profileData += ` || <font color="#009320"><strong>Developer</strong></font>`;
		if (isVIP(userid)) profileData += ` || <font color="#6390F0"><strong>VIP</strong></font>`;
		profileData += `<br />`;
		profileData += `&nbsp;${pColor(userid)}<strong>Registered:</strong> ${regdate}</font><br />`;
		profileData += `&nbsp;${pColor(userid)}<strong>${moneyPlural}:</strong> ${Economy.readMoney(userid).toLocaleString()}</font><br />`;
		if (Db.about.has(userid)) profileData += `&nbsp;${pColor(userid)}<strong>About Me:</strong> <button style="background: red; color: white; border: 1px black solid; font-size: 10px; height: 12px" name="send" value="/pabout show ${userid}">Show</button></font><br />`;
		if (profile.pokemon) profileData += `&nbsp;${pColor(userid)}<strong>Favorite Pokemon:</strong> ${profile.pokemon}</font><br />`;
		if (profile.type) profileData += `&nbsp;${pColor(userid)}<strong>Favorite Type:</strong></font> <img src="https://www.serebii.net/pokedex-bw/type/${profile.type}.gif"><br />`;
		if (profile.nature) profileData += `&nbsp;${pColor(userid)}<strong>Nature:</strong> ${profile.nature}</font><br />`;
		profileData += `&nbsp;${pColor(userid)}<strong>EXP Level:</strong> ${Server.ExpControl.level(userid)}</font><br />`;
		profileData += `&nbsp;${pColor(userid)}<strong>Last Seen:</strong> ${getLastSeen(userid)}</font><br />`;
		if (profile.data.music.link) profileData += `&nbsp;<acronym title="${profile.data.music.title}"><br /><audio src="${profile.data.music.link}" controls="" style="width: 100%;"></audio></acronym><br />`;
		profileData += `<br></div>`;
		this.sendReplyBox(`${profileData}`);
	},

	profilehelp: [`/profile [user] - Shows a user's profile. Defaults to yourself.
/pcolor help - Shows profile color commands.
/pokemon set [Pokemon] - Set your Favorite Pokemon onto your profile.
/pokemon delete - Delete your Favorite Pokemon from your profile.
/type set [type] - Set your favorite type.
/type delete - Delete your favorite type.
/nature set [nature] - Set your nature.
/nature delete - Delete your nature.
/music set [user], [song], [title] - Sets a user's profile song. Requires % or higher.
/music take [user] - Removes a user's profile song. Requires % or higher.
/bg set [user], [link] - Sets the user's profile background. Requires % or higher.
/bg delete [user] - Removes the user's profile background. Requires % or higher.
/fc [switch|ds] set [friend code] - Sets your Friend Code.
/fc [switch|ds] delete [friend code] - Removes your Friend Code.
/dev give [user] - Gives a user Dev Status. Requires & or higher.
/dev take [user] - Removes a user's Dev Status. Requires & or higher.
/vip give [user] - Gives a user VIP Status. Requires & or higher.
/vip take [user] - Removes a user's VIP Status. Requires & or higher.`,
	],
};
