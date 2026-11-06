// Liquid glass on the sidebar: the rim refraction from Glasswork's lens.js.
// It draws in Chromium only; elsewhere the CSS glass in site.css stays as it is.
import { liquidGlass } from './vendor/glasswork-lens.js';

for (const el of document.querySelectorAll('.glass')) {
  liquidGlass(el, { rim: 40, edge: 1.1, power: 2.6, dispersion: 0.15 });
}
