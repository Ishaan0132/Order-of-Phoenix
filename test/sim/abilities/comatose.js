'use strict';

const assert = require('./../../assert');
const common = require('./../../common');

let battle;

describe('Comatose', function () {
	afterEach(function () {
		battle.destroy();
	});

	it('should make the user immune to status conditions', function () {
		battle = common.createBattle();
		battle.setPlayer('p1', {team: [{species: "Komala", ability: 'comatose', moves: ['shadowclaw']}]});
		battle.setPlayer('p2', {team: [{species: "Smeargle", ability: 'noguard', moves: ['spore', 'glare', 'willowisp', 'toxic']}]});
		const comatoseMon = battle.p1.active[0];
		for (let i = 1; i <= 4; i++) {
			assert.constant(() => comatoseMon.status, () => battle.makeChoices('move shadowclaw', 'move ' + i));
		}
	});

	it('should not have its status immunity bypassed by Mold Breaker', function () {
		battle = common.createBattle();
		battle.setPlayer('p1', {team: [{species: "Komala", ability: 'comatose', moves: ['shadowclaw']}]});
		battle.setPlayer('p2', {team: [{species: "Smeargle", ability: 'moldbreaker', moves: ['spore', 'glare', 'willowisp', 'toxic']}]});
		const comatoseMon = battle.p1.active[0];
		for (let i = 1; i <= 4; i++) {
			assert.constant(() => comatoseMon.status, () => battle.makeChoices('move shadowclaw', 'move ' + i));
		}
	});

	it('should cause Rest to fail', function () {
		battle = common.createBattle();
		battle.setPlayer('p1', {team: [{species: "Komala", ability: 'comatose', moves: ['rest']}]});
		battle.setPlayer('p2', {team: [{species: "Smeargle", ability: 'technician', moves: ['aquajet']}]});
		const comatoseMon = battle.p1.active[0];
		assert.hurts(comatoseMon, () => battle.makeChoices('move rest', 'move aquajet'));
		assert.constant(() => comatoseMon.status, () => battle.makeChoices('move rest', 'move aquajet'));
	});

	it.only('should allow the use of Snore and Sleep Talk as if the user were asleep', function () {
		battle = common.createBattle([[
			{species: "Komala", item: 'normaliumz', ability: 'comatose', moves: ['snore', 'sleeptalk', 'brickbreak']},
		], [
			{species: "Smeargle", moves: ['endure']},
		]]);
		const defender = battle.p2.active[0];
		assert.hurts(defender, () => battle.makeChoices('move snore', 'move endure'), "Expected damage from Snore.");
		assert.hurts(defender, () => battle.makeChoices('move sleeptalk', 'move endure'), "Expected damage from Sleep Talk calling Brick Break.");
	});

	it('should cause the user to be damaged by Dream Eater as if it were asleep', function () {
		battle = common.createBattle();
		battle.setPlayer('p1', {team: [{species: "Komala", ability: 'comatose', moves: ['shadowclaw']}]});
		battle.setPlayer('p2', {team: [{species: "Smeargle", ability: 'technician', moves: ['dreameater']}]});
		assert.hurts(battle.p1.active[0], () => battle.makeChoices('move shadowclaw', 'move dreameater'));
	});

	it('should cause Wake-Up Slap and Hex to have doubled base power when used against the user', function () {
		battle = common.createBattle();
		battle.setPlayer('p1', {team: [{species: "Komala", ability: 'comatose', item: 'ringtarget', moves: ['endure']}]});
		battle.setPlayer('p2', {team: [{species: "Smeargle", ability: 'technician', moves: ['hex', 'wakeupslap']}]});

		let bp = 0;
		battle.onEvent('BasePower', battle.format, function (basePower, pokemon, target, move) {
			bp = basePower;
		});

		battle.makeChoices('move endure', 'move hex');
		assert.equal(bp, battle.dex.getMove('hex').basePower * 2);

		battle.makeChoices('move endure', 'move wakeupslap');
		assert.equal(bp, battle.dex.getMove('wakeupslap').basePower * 2);
	});
});
