import SkillView from '@/components/skill-view';
import { SKILLS } from '@/content/skills';

export function generateStaticParams() {
  return SKILLS.map((s) => ({ skill: s.routeName }));
}

export default async function SkillPage({ params }: { params: Promise<{ skill: string }> }) {
  const { skill } = await params;
  return <SkillView route={skill} />;
}
