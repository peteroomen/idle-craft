import type { Skill, SkillId } from './types';

// Peter's skill list, in menu order. Skills without a hand-drawn icon borrow an item sprite for now.
export const SKILLS: Skill[] = [
  { id: 'woodcutting', name: 'Woodcutting', icon: '/icons/skill-woodcutting.png', routeName: 'woodcutting', isCombat: false, group: 'gathering' },
  { id: 'mining', name: 'Mining', icon: '/icons/skill-mining.png', routeName: 'mining', isCombat: false, group: 'gathering' },
  { id: 'fishing', name: 'Fishing', icon: '/icons/fish-5.png', routeName: 'fishing', isCombat: false, group: 'gathering' },
  { id: 'smithing', name: 'Smithing', icon: '/icons/icon-smithing.png', routeName: 'smithing', isCombat: false, group: 'artisan' },
  { id: 'fletching', name: 'Fletching', icon: '/icons/skill-fletching.png', routeName: 'fletching', isCombat: false, group: 'artisan' },
  { id: 'attack', name: 'Attack', icon: '/icons/sword-3.png', routeName: 'attack', isCombat: true, group: 'combat' },
  { id: 'strength', name: 'Strength', icon: '/icons/greatsword-2.png', routeName: 'strength', isCombat: true, group: 'combat' },
  { id: 'defense', name: 'Defense', icon: '/icons/shield-3.png', routeName: 'defense', isCombat: true, group: 'combat' },
  { id: 'ranged', name: 'Ranged', icon: '/icons/longbow-2.png', routeName: 'ranged', isCombat: true, group: 'combat' },
  { id: 'hitpoints', name: 'Hitpoints', icon: '/icons/heart.png', routeName: 'hitpoints', isCombat: true, group: 'combat' },
];

export const SKILL_BY_ID = Object.fromEntries(SKILLS.map((s) => [s.id, s])) as Record<SkillId, Skill>;
export const skillByRoute = (route: string) => SKILLS.find((s) => s.routeName === route);
