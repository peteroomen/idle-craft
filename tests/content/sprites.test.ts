import { existsSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import manifest from '@/content/sprite-manifest.json';
import { SKILLS } from '@/content/skills';

const sprites = manifest as Record<string, { by: string; src: string }>;
const onDisk = (src: string) => existsSync(new URL(`../../public${src}`, import.meta.url));

describe('sprites', () => {
  it('every manifest entry has a PNG in public/icons', () => {
    for (const [id, s] of Object.entries(sprites)) expect(onDisk(s.src), id).toBe(true);
  });

  it('keeps all 18 hand-drawn originals', () => {
    expect(Object.values(sprites).filter((s) => s.by === 'peter').length).toBeGreaterThanOrEqual(18);
  });

  it('every skill icon exists', () => {
    const srcs = new Set(Object.values(sprites).map((s) => s.src));
    for (const skill of SKILLS) expect(srcs.has(skill.icon), skill.id).toBe(true);
  });
});
