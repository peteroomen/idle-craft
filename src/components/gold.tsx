'use client';

import { fmt } from '@/lib/format';
import { useGold } from '@/store/hooks';
import Icon from './icon';

export default function Gold({ className }: { className?: string }) {
  const gold = useGold();
  return (
    <span className={`flex flex-row items-center gap-1 font-bold ${className ?? ''}`} style={{ color: '#f2c94c' }}>
      <Icon imgPath="/icons/coin.png" alt="Gold" />
      {fmt(gold)}
    </span>
  );
}
