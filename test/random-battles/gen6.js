/**
 * Tests for Gen 6 randomized formats
 */
'use strict';

const assert = require('../assert');
const {testNotBothMoves, testAlwaysHasMove, testHiddenPower, testSet} = require('./tools');

describe('[Gen 6] Random Battle', () => {
	const options = {format: 'gen6randombattle'};

	it('should not give mega evolution abilities to base formes', () => {
		testSet('manectricmega', {rounds: 1, ...options}, set => {
			console.log(set.ability);
			assert(set.ability !== 'Intimidate', 'Mega Manectric should not have Intimidate before it mega evolves');
		});
	});

	it('should not select Air Slash and Hurricane together', () => {
		testNotBothMoves('swanna', options, 'hurricane', 'airslash');
	});

	it('should enforce STAB properly', () => {
		testAlwaysHasMove('hariyama', options, 'closecombat');
		testAlwaysHasMove('rapidash', options, 'flareblitz');
	});

	it('should give Drifblim only one Ghost-type attack', () => {
		testSet('drifblim', options, set => {
			assert.equal(set.moves.filter(m => {
				const move = Dex.moves.get(m);
				return move.type === 'Ghost' && move.category !== 'Status';
			}).length, 1, `got ${JSON.stringify(set.moves)}`);
		});
	});

	it('should prevent double Hidden Power', () => testHiddenPower('thundurustherian', options));

	it('should always give Mega Glalie Return', () => testAlwaysHasMove('glaliemega', options, 'return'));

	it('should not give Ursaring Eviolite', () => {
		testSet('ursaring', options, set => assert.notEqual(set.item, 'Eviolite'));
	});

	it('should always give Quagsire Unaware', () => {
		testSet('quagsire', options, set => assert.equal(set.ability, 'Unaware'));
	});

	it('should always give Quagsire Recover', () => {
		testAlwaysHasMove('quagsire', options, 'recover');
	});

	it('should not give Raikou Volt Absorb', () => {
		testSet('raikou', options, set => assert.notEqual(set.ability, 'Volt Absorb'));
	});

	it('should not give Suicune Water Absorb', () => {
		testSet('suicune', options, set => assert.notEqual(set.ability, 'Water Absorb'));
	});

	it('should not give Entei Flash Fire', () => {
		testSet('entei', options, set => assert.notEqual(set.ability, 'Flash Fire'));
	});
});
