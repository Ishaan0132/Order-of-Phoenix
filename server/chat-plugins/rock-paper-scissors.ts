/**
 * Rock, Paper, Scissors plugin by Mia
 * @author mia-pi-git
 */
import {Utils} from '../../lib/utils';

/** Map<to, [from, rounds]> */
const challengeRequests: Map<string, string> = new Map();

const MAX_ROUNDS = 500;
const TIMEOUT = 10 * 1000;
const ICONS: {[k: string]: string} = {
	Rock: `<i class="fa fa-hand-rock-o"></i>`,
	Paper: '<i class="fa fa-hand-paper-o"></i>',
	Scissors: '<i class="fa fa-hand-scissors-o"></i>',
};

export class RPSPlayer extends Rooms.RoomGamePlayer {
	user: User;
	currentChoice: string;
	name: string;
	constructor(user: User, game: RPSGame) {
		super(user, game);
		this.user = user;
		this.name = user.name;
		this.currentChoice = "";
	}
}

export class RPSGame extends Rooms.RoomGame {
	room: Room;
	points: {[k: string]: number};
	currentRound: number;
	playerTable: {[k: string]: RPSPlayer};
	readonly checkChat = true;
	roundTimer?: NodeJS.Timeout;
	players: RPSPlayer[];
	wins: ({name: string, choice: string} | null)[];
	constructor(room: Room) {
		super(room);
		this.room = room;
		this.points = {};
		this.currentRound = 0;
		this.playerTable = {};
		this.title = 'Rock Paper Scissors';
		this.gameid = 'rockpaperscissors' as ID;
		this.players = [];
		this.wins = [];

		this.room.update();
		this.room.add(`|controlshtml|<center>Waiting for another player to join....</center>`);
		this.room.add(`|fieldhtml|<center><h2>Waiting to start the game...</h2></center>`);
	}
	onJoin(user: User) {
		if (user.id in this.playerTable) return;
		const players = Object.keys(this.playerTable);
		if (players.length < 2) {
			this.addPlayer(user);
		}
	}
	/**
	 * True - Attacker wins. False - Attacker loses. Null - tie.
	 */
	checkMatchup(attacker: string, defender: string): boolean | null {
		if (attacker === defender) return null;
		switch (attacker) {
		case 'rock': {
			if (defender === 'scissors') return true;
			if (defender === 'paper') return false;
			break;
		}
		case 'scissors': {
			if (defender === 'paper') return true;
			if (defender === 'rock') return false;
			break;
		}
		case 'paper': {
			if (defender === 'rock') return true;
			if (defender === 'scissors') return false;
			break;
		}
		}
		if (!attacker && !defender) return null;
		return !!(attacker && !defender);
	}
	sendOptions() {
		const button = (cmd: string, title: string) => {
			return `<button class="button" name="send" value="/${cmd}">${title}</button>`;
		};
		let buf = `<center><strong>Make your choice, quick!</strong><br />`;
		for (const item of ['Rock', 'Paper', 'Scissors']) {
			buf += `${button(`choose ${item}`, `${item} ${ICONS[item]}`)}`;
		}
		buf += `<br />${button('rps end', "End game")}</center>`;
		this.addControls(buf);
	}
	sendFullLog() {
		let buf = `|html|`;
		for (const [i, entry] of this.wins.entries()) {
			if (!entry) {
				buf += `<div class="broadcast-red">Nobody won round ${i + 1}...</div>`;
				continue;
			}
			const {name, choice} = entry;
			buf += Utils.html`<div class="broadcast-green">${name} won round ${i + 1} with ${choice}!</div>`;
		}
		this.room.add(buf).update();
	}
	resetOptions(user: User) {
		const player = this.getPlayer(user);
		player.sendRoom(
			`|controlshtml|<div class="pad"><h2>You have selected your choice. Wait for the next round.</h2></div>`
		);
	}
	getScrollback() {
		// some html borrowed from trivia plugin, credits Morfent? I think?
		let buf = `|fieldhtml|<div class="broadcast-blue"><table style="width: 100%; background-color: #9CBEDF; margin: 2px 0">`;
		buf += `<tr style="background-color: #6688AA"><th>Username</th><th>Points</th></tr>`;
		for (const id in this.playerTable) {
			buf += Utils.html`<tr style="background-color: #6688AA"><td>${this.playerTable[id].name}</td>`;
			buf += Utils.html`<td style="text-align: center">${this.points[id] || 0}</td></tr>`;
		}
		buf += `</table></div>`;
		if (this.wins.length) {
			buf += `<br />`;
			for (const [i, entry] of this.wins.entries()) {
				if (this.wins.length > 6) {
					// we only wanna show the last 6 rounds
					const diff = this.wins.length - 6;
					if (i < diff) continue;
				}
				if (!entry) {
					buf += `<div class="broadcast-red">Nobody won round ${i + 1}...</div>`;
					continue;
				}
				const {name, choice} = entry;
				buf += Utils.html`<div class="broadcast-green">${name} won round ${i + 1} with ${choice}!</div>`;
			}
		}
		return buf;
	}
	sendScrollback() {
		this.room.add(this.getScrollback()).update();
	}
	end() {
		const [p1, p2] = Object.keys(this.playerTable).map(item => this.playerTable[item]);
		this.addControls(`<h2>The game is over!</h2>`);
		if (this.points[p1?.id] === this.points[p2?.id]) {
			this.addField(Utils.html`Tie between ${p1} and ${p2}!`);
			return this.startNextRound();
		}
		const winner = (this.points[p1.id] || 0) > (this.points[p2.id] || 0) ? p1 : p2;
		const points = this.points[winner.id];
		const message = Utils.html`<strong>${winner.name} won the game with ${Chat.count(points, 'points')}!</strong>`;
		this.addField(message);
		this.add(message);
		this.sendFullLog();
		this.destroy();
	}
	clearChoices() {
		const [p1, p2] = this.players;
		p1.currentChoice = "";
		p2.currentChoice = "";
	}
	addControls(message: string) {
		for (const id in this.playerTable) {
			this.playerTable[id].sendRoom(`|controlshtml|<div class="pad">${message}</div>`);
		}
	}
	getPlayers() {
		return Object.keys(this.playerTable).map(item => this.playerTable[item]);
	}
	addField(message: string) {
		return this.room.add(`${this.getScrollback()}<br /><div class="broadcast-green">${message}</div>`).update();
	}
	runMatch() {
		const [p1, p2] = this.players;
		const result = this.checkMatchup(p1.currentChoice, p2.currentChoice);
		if (result === null) { // tie
			this.add(`The players have tied! Nobody wins this round....`);
			this.wins.push(null);
		} else {
			const winner = result === true ? p1 : p2;
			this.add(Utils.html`${winner.name} wins the round! They gain a point.`);
			this.addPoint(winner);
			this.wins.push({
				name: winner.name,
				choice: winner.currentChoice,
			});
		}
		if (this.currentRound === MAX_ROUNDS) {
			this.add(`The game has hit the max number of rounds, and so will be ending.`);
			return this.end();
		}
		this.clearChoices();
		this.sendScrollback();
		return this.startNextRound();
	}
	addPoint(player: RPSPlayer) {
		const id = player.user.id;
		if (!this.points[id]) this.points[id] = 0;
		this.points[id]++;
		return this.points[id];
	}
	add(message: string) {
		return this.room.add(`|html|${message}`).update();
	}
	start() {
		const players = this.getPlayers();
		if (players.length < 2) {
			throw new Chat.ErrorMessage(`Not enough players to start the game.`);
		}
		this.players = players;
		this.addField(`The Rock, Paper, Scissors match has begun!`);
		this.add(Utils.html`(Use /rps end to end the game)`);
		this.startNextRound();
	}
	getPlayer(user: User) {
		const player = this.playerTable[user.id];
		if (!player) throw new Chat.ErrorMessage(`You are not a player in this game.`);
		return player;
	}
	pause(user: User) {
		const player = this.getPlayer(user);
		if (!this.roundTimer) throw new Chat.ErrorMessage(`The game is not running, and cannot be paused.`);
		this.room.add(Utils.html`|html|<h2>The game has been paused by ${player.name}.</h2>`).update();
		clearTimeout(this.roundTimer);
		this.addControls(`The game is paused.`);
		this.add(`The game is paused.`);
	}
	unpause(user: User) {
		const player = this.getPlayer(user);
		if (this.roundTimer) throw new Chat.ErrorMessage(`The game is not paused.`);
		this.room.add(Utils.html`|html|${player.name} unpaused the game.`).update();
		this.startNextRound();
	}
	startNextRound() {
		this.currentRound++;
		if (this.currentRound > 0) {
			this.addField(
				`Round ${this.currentRound} has begun! ` +
				`Players, you have ${Chat.toDurationString(TIMEOUT)} to make your moves!`
			);
		}
		this.room.add(`|html|<h2>Round ${this.currentRound}</h2>`).update();
		this.sendOptions();
		this.roundTimer = setTimeout(() => {
			this.runMatch();
		}, TIMEOUT);
	}
	destroy() {
		if (this.roundTimer) clearTimeout(this.roundTimer);
		this.room.pokeExpireTimer();
		this.addControls(`The game has ended.`);
		this.ended = true;
		this.room.add(`The game has been ended.`); // for the benefit of those in the room
		this.room.log.log = [];
		for (const id in this.playerTable) {
			this.playerTable[id].unlinkUser();
		}
		this.playerTable = {};
	}
	choose(user: User, option: string) {
		const player = this.getPlayer(user);
		if (player.currentChoice) throw new Chat.ErrorMessage("You have already made your choice!");
		player.currentChoice = option;
		this.add(Utils.html`${user.name} has made their choice.`);
		this.resetOptions(user);
		if (this.players.filter(item => item.currentChoice).length > 1) {
			clearTimeout(this.roundTimer!);
			return this.runMatch();
		}
		return true;
	}
	leaveGame(user: User) {
		const player = this.getPlayer(user);
		player.sendRoom(`You left the game.`);
		delete this.playerTable[user.id];
		this.end();
	}
	addPlayer(user: User) {
		if (this.playerTable[user.id]) throw new Chat.ErrorMessage(`You are already a player in this game.`);
		this.playerTable[user.id] = new RPSPlayer(user, this);
		this.room.auth.set(user.id, Users.PLAYER_SYMBOL);
		user.sendTo(this.room, `You have successfully joined the Rock Paper Scissors game.`);
		return this.playerTable[user.id];
	}
}

function getGame(context: CommandContext) {
	const room = context.requireRoom();
	const game = room.getGame(RPSGame);
	if (!game) throw new Chat.ErrorMessage(`There is no Rock Paper Scissors game going on in this room.`);
	if (game.gameid !== 'rockpaperscissors') {
		throw new Chat.ErrorMessage(`A game of ${game.title} is already going on.`);
	}
	return game;
}

function findExisting(user1: string, user2: string) {
	return Rooms.get(`rps-${user1}-${user2}`) || Rooms.get(`rps-${user2}-${user1}`);
}

export const commands: ChatCommands = {
	rps: 'rockpaperscissors',
	rockpaperscissors: {
		challenge: 'create',
		create(target, room, user) {
			target = target.trim();
			const userid = toID(target);
			const targetUser = userid ? Users.get(userid) : this.pmTarget;
			if (targetUser === user) return this.errorReply(`You cannot challenge yourself.`);
			if (!targetUser) {
				return this.errorReply(
					`User ${this.targetUsername} not found. Either specify a username or use this command in PMs.`
				);
			}
			const existingRoom = findExisting(user.id, targetUser.id);
			if (existingRoom?.game && !existingRoom.game.ended) {
				return this.errorReply(`You already have a Rock Paper Scissors game against ${targetUser.name}.`);
			}
			if (!this.pmTarget) this.pmTarget = targetUser;
			challengeRequests.set(targetUser.id, user.id);
			this.sendChatMessage(
				`/raw ${user.name} challenged you to Rock, Paper, Scissors!` +
				`<button class="button" name="send" value="/rps accept"><strong>Accept</strong></button></div>`,
			);
		},

		accept(target, room, user) {
			const id = challengeRequests.get(user.id);
			if (!id) return this.errorReply(`You have no Rock, Paper, Scissors request pending from ${target}.`);
			const targetUser = Users.get(id)!;
			const existingRoom = findExisting(user.id, targetUser.id);
			const options = {
				modchat: '+',
				isPrivate: true,
			};
			const roomid = `rps-${targetUser.id}-${user.id}`;
			const gameRoom = existingRoom ? existingRoom : Rooms.createGameRoom(
				roomid as RoomID, `[RPS] ${user.name} vs ${targetUser.name}`, options
			);
			gameRoom.game = new RPSGame(gameRoom);
			gameRoom.add(
				`|raw|<h2>Rock Paper Scissors: ${user.name} vs ${targetUser.name}!</h2>` +
				`Use /rps start to start the game, once both players have joined!`
			).update();
			user.joinRoom(gameRoom.roomid);
			targetUser.joinRoom(gameRoom.roomid);
			(gameRoom.game as RPSGame).start();
		},

		deny(target, room, user) {
			const request = challengeRequests.get(user.id);
			if (!request) return this.errorReply(`You have no Rock, Paper, Scissors challenge pending.`);
			const [sender] = request;
			Users.get(sender)?.popup(`${user.name} denied your Rock, Paper, Scissors challenge.`);
			challengeRequests.delete(user.id);
		},

		end(target, room, user) {
			const game = getGame(this);
			if (!game.playerTable[user.id]) {
				return this.errorReply(`You are not a player, and so cannot end the game.`);
			}
			game.end();
		},

		choose(target, room, user) {
			this.parse(`/choose ${target}`);
		},

		leave(target, room, user) {
			this.parse(`/leavegame`);
		},

		start(target, room, user) {
			const game = getGame(this);
			if (game.roundTimer) return this.errorReply(`The game has already started.`);
			game.start();
		},

		pause(target, room, user) {
			const game = getGame(this);
			game.pause(user);
		},

		resume(target, room, user) {
			const game = getGame(this);
			game.unpause(user);
		},

		help() {
			this.runBroadcast();
			const strings = [
				`/rockpaperscissors OR /rps<br />`,
				`/rps create OR /rps challenge [user], [rounds] - Challenges a user to a game of Rock Paper Scissors with [rounds] (or 3) rounds`,				`/rps leave - Leave the game.`,
				`/rps start - Start the Rock Paper Scissors game.`,
				`/rps end - End the Rock Paper Scissors game`,
				`/rps pause - Pauses the game, if it's in progress.`,
				`/rps resume - Resumes the game, if it's paused.`,
			];
			return this.sendReplyBox(strings.join('<br />'));
		},
	},
};
