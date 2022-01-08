export const Scripts: ModdedBattleScriptsData = {
	init() {
		for (const i in this.data.Moves) {
			if (!(this.data.Moves[i].isNonstandard && this.data.Moves[i].isNonstandard === 'Past')) continue;
			this.modData('Moves', i).isNonstandard = undefined;
		}
	},
};
