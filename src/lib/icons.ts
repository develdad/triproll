// One consistent inline SVG line-icon set (24 grid, 1.7 stroke, round caps). No icon font, no emoji.
// Each value is the inner markup of the <svg>. Rendered by Icon.astro and islands/Icon.tsx.
export const ICONS = {
  plane: '<path d="M12 2.5c.9 0 1.5 1 1.5 2.2V9l8 4.5V16l-8-2.2v4.3l2 1.5V22L12 21l-3.5 1v-1.4l2-1.5v-4.3L2.5 16v-2.5L10.5 9V4.7c0-1.2.6-2.2 1.5-2.2z"/>',
  bed: '<path d="M3 19V6M3 15h18v4M21 15v-3a3 3 0 0 0-3-3h-7v6"/><circle cx="7.5" cy="11" r="1.6"/>',
  car: '<path d="M5 16v-5l1.7-4.2A2 2 0 0 1 8.5 5.5h7a2 2 0 0 1 1.8 1.3L19 11v5M3.5 11h17M5 16h14v2.5h-2.5V16M7.5 18.5V16"/><circle cx="8" cy="13.5" r=".9"/><circle cx="16" cy="13.5" r=".9"/>',
  compass: '<circle cx="12" cy="12" r="9"/><path d="M15.6 8.4l-2 5.2-5.2 2 2-5.2z"/>',
  bag: '<rect x="5" y="7.5" width="14" height="13" rx="2.5"/><path d="M9 7.5V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5v2M9.5 11v6M14.5 11v6"/>',
  sun: '<circle cx="12" cy="12" r="3.8"/><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6 7 7M17 17l1.4 1.4M18.4 5.6 17 7M7 17l-1.4 1.4"/>',
  lock: '<rect x="5" y="10.5" width="14" height="10" rx="2.5"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5M12 14.5V17"/>',
  user: '<circle cx="12" cy="8" r="3.6"/><path d="M4.8 20c.6-3.7 3.5-5.6 7.2-5.6s6.6 1.9 7.2 5.6"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.2 2"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 2.8 3 15.2 0 18M12 3c-3 2.8-3 15.2 0 18"/>',
  calendar: '<rect x="3.5" y="5" width="17" height="15.5" rx="2.5"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
  pin: '<path d="M12 21s6.5-5.7 6.5-11A6.5 6.5 0 0 0 5.5 10c0 5.3 6.5 11 6.5 11z"/><circle cx="12" cy="10" r="2.3"/>',
  tag: '<path d="M3.5 12.2V4.5h7.7l9 9a1.8 1.8 0 0 1 0 2.5l-5.2 5.2a1.8 1.8 0 0 1-2.5 0z"/><circle cx="8" cy="9" r="1.2"/>',
  shield: '<path d="M12 3l7.5 3v5.5c0 4.6-3.1 8-7.5 9.5-4.4-1.5-7.5-4.9-7.5-9.5V6z"/><path d="M9 12l2.3 2.3L15.5 10"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  minus: '<path d="M5 12h14"/>',
  arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  mail: '<rect x="3" y="5.5" width="18" height="13" rx="2.5"/><path d="M3.5 7.5l8.5 6 8.5-6"/>',
  route: '<circle cx="6" cy="18" r="2.2"/><circle cx="18" cy="6" r="2.2"/><path d="M8.2 18H15a3 3 0 0 0 0-6H9a3 3 0 0 1 0-6h6.8"/>',
  sliders: '<path d="M4 7h9M17 7h3M4 17h3M11 17h9"/><circle cx="15" cy="7" r="2"/><circle cx="9" cy="17" r="2"/>',
} as const;
export type IconName = keyof typeof ICONS;
