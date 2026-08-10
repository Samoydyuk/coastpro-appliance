import fs from 'node:fs';
import path from 'node:path';
import { slideCaptions, type HeroSlide } from '@/data/hero-slides';

const HERO_DIR = path.join(process.cwd(), 'public', 'images', 'hero');
const IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.avif']);

/**
 * Reads the hero photos off disk at build time so that adding a picture is a
 * matter of dropping the file into `public/images/hero/` — no code edit. Runs
 * during static generation only; Hero is a server component.
 *
 * Order follows the file name, and captions are matched by file name against
 * `slideCaptions`. A missing folder simply yields no slides, which the hero
 * renders as a plain espresso panel.
 */
export function getHeroSlides(): HeroSlide[] {
  let files: string[];
  try {
    files = fs.readdirSync(HERO_DIR);
  } catch {
    return [];
  }

  return files
    .filter((file) => IMAGE_EXTENSIONS.has(path.extname(file).toLowerCase()))
    .sort((a, b) => a.localeCompare(b))
    .map((file) => {
      const meta = slideCaptions[file];
      return {
        src: `/images/hero/${file}`,
        alt: meta?.alt ?? 'CoastPro appliance repair work in Orange County',
        location: meta?.location,
        caption: meta?.caption,
      };
    });
}
