export const fmt = (n: number) => Math.floor(n).toLocaleString('en-NZ');
export const compact = (n: number) => (n >= 10_000 ? `${fmt(n / 1000)}k` : n >= 1000 ? `${(n / 1000).toFixed(1)}k` : fmt(n));
/** Peter's card format: "3.5 sec". */
export const secs = (ms: number) => `${(ms / 1000).toFixed(1).replace(/\.0$/, '')} sec`;

export function span(ms: number): string {
  const m = Math.floor(ms / 60_000), h = Math.floor(m / 60), d = Math.floor(h / 24);
  if (d) return `${d} d ${h % 24} h`;
  if (h) return `${h} h ${m % 60} m`;
  if (m) return `${m} m`;
  return `${Math.max(1, Math.round(ms / 1000))} s`;
}

const GERUND: Record<string, string> = { Cut: 'Cutting', Mine: 'Mining', Catch: 'Catching', Smelt: 'Smelting', Forge: 'Forging', Fletch: 'Fletching' };
export const gerund = (verb: string) => GERUND[verb] ?? `${verb}ing`;
