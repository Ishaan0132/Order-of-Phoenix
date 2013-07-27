/**
 * Types were different on Gen 1.
 * We had no steel nor dark types and there were a couple of important differences:
 * Bug and Poison were weak to eachother
 * Ice was neutral to fire
 * Psychic was immune to ghost
 */
exports.BattleTypeChart = {
  "Bug": {
    "damageTaken": {
      "Bug": 2,
      "Dark": 2,
      "Dragon": 1,
      "Electric": 0,
      "Fighting": 2,
      "Fire": 1,
      "Flying": 1,
      "Ghost": 0,
      "Grass": 2,
      "Ground": 2,
      "Ice": 1,
      "Normal": 0,
      "Poison": 0,
      "Psychic": 0,
      "Rock": 1,
      "Steel": 0,
      "Water": 1
    },
    "HPivs": {"atk":30,"def":30,"spd":30}
  },
  "Dark": {
    "damageTaken": {
      "Bug": 1,
      "Dark": 1,
      "Dragon": 2,
      "Electric": 1,
      "Fighting": 2,
      "Fire": 1,
      "Flying": 2,
      "Ghost": 2,
      "Grass": 2,
      "Ground": 1,
      "Ice": 0,
      "Normal": 2,
      "Poison": 0,
      "Psychic": 3,
      "Rock": 0,
      "Steel": 0,
      "Water": 0
    },
    "HPivs": {}
  },
  "Dragon": {
    "damageTaken": {
      "Bug": 0,
      "Dark": 2,
      "Dragon": 3,
      "Electric": 2,
      "Fighting": 1,
      "Fire": 2,
      "Flying": 2,
      "Ghost": 1,
      "Grass": 2,
      "Ground": 3,
      "Ice": 1,
      "Normal": 1,
      "Poison": 1,
      "Psychic": 2,
      "Rock": 1,
      "Steel": 2,
      "Water": 2
    },
    "HPivs": {"atk":30}
  },
  "Electric": {
    "damageTaken": {
      "Bug": 0,
      "Dark": 2,
      "Dragon": 0,
      "Electric": 3,
      "Fighting": 2,
      "Fire": 1,
      "Flying": 2,
      "Ghost": 0,
      "Grass": 0,
      "Ground": 1,
      "Ice": 0,
      "Normal": 1,
      "Poison": 0,
      "Psychic": 0,
      "Rock": 0,
      "Steel": 2,
      "Water": 3
    },
    "HPivs": {"spa":30}
  },
  "Fighting": {
    "damageTaken": {
      "Bug": 2,
      "Dark": 1,
      "Dragon": 0,
      "Electric": 0,
      "Fighting": 1,
      "Fire": 0,
      "Flying": 0,
      "Ghost": 1,
      "Grass": 0,
      "Ground": 0,
      "Ice": 0,
      "Normal": 3,
      "Poison": 0,
      "Psychic": 1,
      "Rock": 2,
      "Steel": 0,
      "Water": 0
    },
    "HPivs": {"def":30,"spa":30,"spd":30,"spe":30}
  },
  "Fire": {
    "damageTaken": {
      brn: 3,
      "Bug": 2,
      "Dark": 2,
      "Dragon": 0,
      "Electric": 0,
      "Fighting": 2,
      "Fire": 2,
      "Flying": 0,
      "Ghost": 0,
      "Grass": 2,
      "Ground": 1,
      "Ice": 2,
      "Normal": 0,
      "Poison": 0,
      "Psychic": 0,
      "Rock": 1,
      "Steel": 2,
      "Water": 1
    },
    "HPivs": {"atk":30,"spa":30,"spe":30}
  },
  "Flying": {
    "damageTaken": {
      "Bug": 2,
      "Dark": 1,
      "Dragon": 1,
      "Electric": 1,
      "Fighting": 0,
      "Fire": 0,
      "Flying": 1,
      "Ghost": 0,
      "Grass": 3,
      "Ground": 3,
      "Ice": 1,
      "Normal": 0,
      "Poison": 0,
      "Psychic": 0,
      "Rock": 1,
      "Steel": 0,
      "Water": 1
    },
    "HPivs": {"hp":30,"atk":30,"def":30,"spa":30,"spd":30}
  },
  "Ghost": {
    "damageTaken": {
      "Bug": 2,
      "Dark": 3,
      "Dragon": 2,
      "Electric": 0,
      "Fighting": 3,
      "Fire": 0,
      "Flying": 0,
      "Ghost": 0,
      "Grass": 0,
      "Ground": 1,
      "Ice": 0,
      "Normal": 3,
      "Poison": 0,
      "Psychic": 1,
      "Rock": 0,
      "Steel": 0,
      "Water": 0
    },
    "HPivs": {"def":30,"spd":30}
  },
  "Grass": {
    "damageTaken": {
      "Bug": 1,
      "Dark": 1,
      "Dragon": 0,
      "Electric": 2,
      "Fighting": 0,
      "Fire": 1,
      "Flying": 0,
      "Ghost": 0,
      "Grass": 0,
      "Ground": 1,
      "Ice": 1,
      "Normal": 0,
      "Poison": 2,
      "Psychic": 0,
      "Rock": 0,
      "Steel": 0,
      "Water": 3
    },
    "HPivs": {"atk":30,"spa":30}
  },
  "Ground": {
    "damageTaken": {
      sandstorm: 3,
      "Bug": 0,
      "Dark": 2,
      "Dragon": 0,
      "Electric": 3,
      "Fighting": 2,
      "Fire": 3,
      "Flying": 2,
      "Ghost": 0,
      "Grass": 2,
      "Ground": 3,
      "Ice": 1,
      "Normal": 1,
      "Poison": 2,
      "Psychic": 0,
      "Rock": 1,
      "Steel": 1,
      "Water": 1
    },
    "HPivs": {"spa":30,"spd":30}
  },
  "Ice": {
    "damageTaken": {
      hail: 3,
      frz: 3,
      "Bug": 2,
      "Dark": 0,
      "Dragon": 2,
      "Electric": 1,
      "Fighting": 1,
      "Fire": 1,
      "Flying": 2,
      "Ghost": 0,
      "Grass": 2,
      "Ground": 2,
      "Ice": 0,
      "Normal": 2,
      "Poison": 0,
      "Psychic": 0,
      "Rock": 1,
      "Steel": 1,
      "Water": 3
    },
    "HPivs": {"atk":30,"def":30}
  },
  "Normal": {
    "damageTaken": {
      "Bug": 0,
      "Dark": 1,
      "Dragon": 0,
      "Electric": 1,
      "Fighting": 1,
      "Fire": 1,
      "Flying": 2,
      "Ghost": 3,
      "Grass": 2,
      "Ground": 1,
      "Ice": 1,
      "Normal": 0,
      "Poison": 1,
      "Psychic": 3,
      "Rock": 0,
      "Steel": 0,
      "Water": 2
    }
  },
  "Poison": {
    "damageTaken": {
      psn: 3,
      tox: 3,
      "Bug": 2,
      "Dark": 0,
      "Dragon": 0,
      "Electric": 1,
      "Fighting": 2,
      "Fire": 0,
      "Flying": 2,
      "Ghost": 2,
      "Grass": 1,
      "Ground": 0,
      "Ice": 0,
      "Normal": 2,
      "Poison": 2,
      "Psychic": 2,
      "Rock": 0,
      "Steel": 2,
      "Water": 1
    },
    "HPivs": {"def":30,"spa":30,"spd":30}
  },
  "Psychic": {
    "damageTaken": {
      "Bug": 1,
      "Dark": 1,
      "Dragon": 0,
      "Electric": 0,
      "Fighting": 2,
      "Fire": 2,
      "Flying": 0,
      "Ghost": 1,
      "Grass": 0,
      "Ground": 0,
      "Ice": 2,
      "Normal": 3,
      "Poison": 1,
      "Psychic": 2,
      "Rock": 0,
      "Steel": 0,
      "Water": 0
    },
    "HPivs": {"atk":30,"spe":30}
  },
  "Rock": {
    "damageTaken": {
      sandstorm: 3,
      "Bug": 2,
      "Dark": 0,
      "Dragon": 2,
      "Electric": 2,
      "Fighting": 1,
      "Fire": 2,
      "Flying": 2,
      "Ghost": 0,
      "Grass": 1,
      "Ground": 1,
      "Ice": 1,
      "Normal": 2,
      "Poison": 3,
      "Psychic": 0,
      "Rock": 3,
      "Steel": 1,
      "Water": 1
    },
    "HPivs": {"def":30,"spd":30,"spe":30}
  },
  "Steel": {
    "damageTaken": {
      psn: 3,
      tox: 3,
      sandstorm: 3,
      "Bug": 2,
      "Dark": 2,
      "Dragon": 1,
      "Electric": 1,
      "Fighting": 1,
      "Fire": 1,
      "Flying": 2,
      "Ghost": 2,
      "Grass": 2,
      "Ground": 1,
      "Ice": 2,
      "Normal": 0,
      "Poison": 1,
      "Psychic": 3,
      "Rock": 2,
      "Steel": 2,
      "Water": 1
    },
    "HPivs": {"spd":30}
  },
  "Water": {
    "damageTaken": {
      "Bug": 2,
      "Dark": 0,
      "Dragon": 0,
      "Electric": 1,
      "Fighting": 0,
      "Fire": 2,
      "Flying": 2,
      "Ghost": 0,
      "Grass": 1,
      "Ground": 0,
      "Ice": 2,
      "Normal": 3,
      "Poison": 3,
      "Psychic": 0,
      "Rock": 2,
      "Steel": 2,
      "Water": 2
    },
    "HPivs": {"atk":30,"def":30,"spa":30}
  }
};
