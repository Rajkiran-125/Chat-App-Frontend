/**
 * Self-contained SVG avatars (data URIs) - no external image hosts,
 * so avatars always load, even offline.
 */
const GRADIENTS: Array<[string, string]> = [
  ['#6366f1', '#8b5cf6'], // indigo -> violet
  ['#ec4899', '#f43f5e'], // pink -> rose
  ['#f59e0b', '#f97316'], // amber -> orange
  ['#10b981', '#14b8a6'], // emerald -> teal
  ['#0ea5e9', '#3b82f6'], // sky -> blue
  ['#ef4444', '#ec4899'], // red -> pink
  ['#84cc16', '#22c55e'], // lime -> green
  ['#64748b', '#475569'] // slate
];

function personSvg(from: string, to: string, seed: number): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96">
<defs><linearGradient id="g${seed}" x1="0" y1="0" x2="1" y2="1">
<stop offset="0" stop-color="${from}"/><stop offset="1" stop-color="${to}"/>
</linearGradient></defs>
<rect width="96" height="96" fill="url(#g${seed})"/>
<circle cx="48" cy="38" r="16" fill="rgba(255,255,255,0.92)"/>
<path d="M16 96c0-18 14-30 32-30s32 12 32 30z" fill="rgba(255,255,255,0.92)"/>
</svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export const AVATAR_PRESETS: string[] = GRADIENTS.map(([from, to], i) => personSvg(from, to, i));
