import { Tag, theme } from 'antd';
import type { SkillId } from '@/content/types';
import { MAX_LEVEL } from '@/content/formulas';
import { fmt } from '@/lib/format';
import { useSkill } from '@/store/hooks';

export default function SkillInfo({ skill }: { skill: SkillId }) {
  const { token: { colorPrimary } } = theme.useToken();
  const { level, xp, hi } = useSkill(skill);

  return (
    <div className="flex flex-row flex-wrap items-center gap-y-1">
      <div className="mr-1 font-bold">Level</div>
      <Tag color={colorPrimary}>{level} / {MAX_LEVEL}</Tag>
      <div className="ml-2 mr-1 font-bold">XP</div>
      <Tag color="default">{fmt(xp)} / {fmt(hi)}</Tag>
    </div>
  );
}
