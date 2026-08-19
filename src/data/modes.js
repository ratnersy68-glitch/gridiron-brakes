export const MODES = {
  classic: {
    id: 'classic', name: 'Classic Shootout',
    desc: 'Best of 3 rounds. Whoever scores more wins.',
    rounds: 3, opponentShoots: true, suddenDeath: false,
  },
  best5: {
    id: 'best5', name: 'Best of 5',
    desc: 'Five rounds each. More goals wins.',
    rounds: 5, opponentShoots: true, suddenDeath: false,
  },
  suddendeath: {
    id: 'suddendeath', name: 'Sudden Death',
    desc: 'Tied after 3? Alternate shots until someone blinks.',
    rounds: 3, opponentShoots: true, suddenDeath: true,
  },
  endless: {
    id: 'endless', name: 'Endless Shootout',
    desc: 'Keep scoring. The goalie gets sharper. 3 misses and it ends.',
    rounds: Infinity, opponentShoots: false, suddenDeath: false, endless: true, maxMisses: 3,
  },
};

export const MODE_LIST = ['classic', 'best5', 'suddendeath', 'endless'];
