'use strict';

const assert = require('./../../assert');
const common = require('./../../common');

let battle;

describe('Gluttony', function () {
	afterEach(function () {
		battle.destroy();
	});

	it(`should activate Aguav Berry at 50% health`, function () {
		battle = common.createBattle([[
			{species: "wobbuffet", ability: 'gluttony', item: 'aguavberry', evs: {hp: 4}, moves: ['sleeptalk']},
		], [
			{species: "wynaut", ability: 'compoundeyes', moves: ['superfang']},
		]]);

		battle.makeChoices();
		const wobbuffet = battle.p1.active[0];
		assert.equal(wobbuffet.hp, Math.floor(wobbuffet.maxhp / 2) + Math.floor(wobbuffet.maxhp * 0.33));
	});
  
	it(`should activate after Belly Drum`, function () {
		battle = common.createBattle([[
			{species: "snorlax", ability: 'gluttony', item: 'aguavberry', evs: {hp: 4}, moves: ['bellydrum']},
		], [
			{species: "wynaut", moves: ['sleeptalk']},
		]]);

		battle.makeChoices();
		const snorlax = battle.p1.active[0];
		assert.equal(snorlax.hp, Math.floor(snorlax.maxhp / 2) + Math.floor(snorlax.maxhp * 0.33));
	});
  
	it(`should activate after poison damage`, function () {
		battle = common.createBattle([[
			{species: "wobbuffet", ability: 'gluttony', item: 'aguavberry', evs: {hp: 28}, moves: ['sleeptalk']},
		], [
			{species: "wynaut", ability: 'compoundeyes', moves: ['poisonpowder']},
		]]);

		battle.makeChoices();
		battle.makeChoices();
		battle.makeChoices();
		battle.makeChoices();
		const wobbuffet = battle.p1.active[0];
		assert.equal(wobbuffet.hp, Math.floor(wobbuffet.maxhp * 1/2) + Math.floor(wobbuffet.maxhp * 0.33));
	});
});
