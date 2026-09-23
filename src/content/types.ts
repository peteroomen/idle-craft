// Core content types. Skill and Activity keep the field names from next-idle's models/skill.ts.

export type SkillId =
  | 'woodcutting' | 'mining' | 'fishing' | 'smithing' | 'fletching'
  | 'attack' | 'strength' | 'defense' | 'ranged' | 'hitpoints';

export type Skill = {
  id: SkillId;
  name: string;
  icon: string;
  routeName: string;
  isCombat: boolean;
  group: 'gathering' | 'artisan' | 'combat';
};

export type ItemId = string;

// Peter's IActivity (action, name, icon, duration in ms, xp), extended with what the engine needs.
export type Activity = {
  id: string;
  skill: SkillId;
  action: string;
  name: string;
  icon: string;
  duration: number;
  xp: number;
  level: number;
  inputs?: { item: ItemId; qty: number }[];
  outputs: { item: ItemId; qty: number }[];
  toolKind?: ToolKind;
  category?: string;
};

export type ToolKind = 'axe' | 'pickaxe' | 'rod';
