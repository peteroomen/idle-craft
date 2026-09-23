import { AUTO_EAT, AUTO_EAT_COST, OFFLINE_CAP_HOURS, OFFLINE_UPGRADE_COST, SHOP_MAX_TIER, SHOP_PRICE_PER_MATERIAL, SHOP_TOOL_PRICE, TIERS, inventoryUpgradeCost } from './formulas';
import { ITEMS } from './items';
import { FLETCH_ITEMS, FORGE_ITEMS, METALS, WOODS } from './tiers';
import type { ItemId } from './types';

export type ShopSection = 'Tools' | 'Weapons & armour' | 'Bows' | 'Supplies' | 'Upgrades';
export const SHOP_SECTIONS: ShopSection[] = ['Tools', 'Weapons & armour', 'Bows', 'Supplies', 'Upgrades'];

export type Upgrade = 'inventory' | 'autoEat' | 'offline';
export type Listing =
  | { id: string; kind: 'item'; section: ShopSection; item: ItemId; price: number; bulk?: boolean }
  | { id: string; kind: 'upgrade'; section: 'Upgrades'; upgrade: Upgrade };

const listings: Listing[] = [];
const sell = (section: ShopSection, item: ItemId, price: number, bulk = false) => listings.push({ id: `buy_${item}`, kind: 'item', section, item, price, bulk });

// Tools, weapons, armour and bows for tiers 1-5. Tiers 6-8 are craft-only.
for (const t of TIERS.filter((x) => x <= SHOP_MAX_TIER)) {
  const m = METALS[t - 1], w = WOODS[t - 1];
  sell('Tools', `${m.id}_axe`, SHOP_TOOL_PRICE[t - 1]);
  sell('Tools', `${m.id}_pickaxe`, SHOP_TOOL_PRICE[t - 1]);
  sell('Tools', `${w.id}_rod`, SHOP_TOOL_PRICE[t - 1]);
  for (const f of FORGE_ITEMS) if (!['axe', 'pickaxe', 'arrowtips'].includes(f.type)) sell('Weapons & armour', `${m.id}_${f.type}`, f.bars * SHOP_PRICE_PER_MATERIAL[t - 1]);
  for (const f of FLETCH_ITEMS) if (f.type !== 'rod') sell('Bows', `${w.id}_${f.type}`, f.logs * SHOP_PRICE_PER_MATERIAL[t - 1]);
}
sell('Supplies', 'bronze_arrows', 1, true);
sell('Supplies', 'iron_arrows', 3, true);
sell('Supplies', 'steel_arrows', 8, true);
sell('Supplies', 'shrimp', 10, true);
sell('Supplies', 'perch', 20, true);
sell('Supplies', 'trout', 40, true);
sell('Supplies', 'coal', 25, true);
listings.push({ id: 'upgrade_inventory', kind: 'upgrade', section: 'Upgrades', upgrade: 'inventory' });
listings.push({ id: 'upgrade_autoEat', kind: 'upgrade', section: 'Upgrades', upgrade: 'autoEat' });
listings.push({ id: 'upgrade_offline', kind: 'upgrade', section: 'Upgrades', upgrade: 'offline' });

export const LISTINGS = listings;
export const LISTING_BY_ID = Object.fromEntries(listings.map((l) => [l.id, l])) as Record<string, Listing>;

/** Price and description of the next level of an upgrade, or null when maxed. */
export function nextUpgrade(upgrade: Upgrade, owned: number): { price: number; title: string; detail: string } | null {
  switch (upgrade) {
    case 'inventory':
      return { price: inventoryUpgradeCost(owned), title: 'Inventory +8 slots', detail: `${owned} bought so far` };
    case 'autoEat':
      if (owned >= AUTO_EAT_COST.length) return null;
      return {
        price: AUTO_EAT_COST[owned],
        title: owned === 0 ? 'Auto-eat II' : 'Auto-eat III',
        detail: AUTO_EAT[owned + 1].toFull ? `Eats until full, from ${AUTO_EAT[owned + 1].threshold * 100}% HP` : `Eats at ${AUTO_EAT[owned + 1].threshold * 100}% HP instead of ${AUTO_EAT[owned].threshold * 100}%`,
      };
    case 'offline':
      if (owned >= OFFLINE_UPGRADE_COST.length) return null;
      return { price: OFFLINE_UPGRADE_COST[owned], title: `Offline time ${OFFLINE_CAP_HOURS[owned + 1]} h`, detail: `Progress while away counts for up to ${OFFLINE_CAP_HOURS[owned + 1]} hours (now ${OFFLINE_CAP_HOURS[owned]})` };
  }
}

// Sanity at load: listings reference real items.
for (const l of listings) if (l.kind === 'item' && !ITEMS[l.item]) throw new Error(`Shop lists unknown item ${l.item}`);
