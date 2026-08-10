import fs from 'node:fs';
import path from 'node:path';
import { photoCaptions, type WorkPhoto } from '@/data/work-photos';

const WORK_DIR = path.join(process.cwd(), 'public', 'images', 'work');
const IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.avif']);

/**
 * Reads the job photos off disk at build time, so adding a picture is a matter
 * of dropping the file into `public/images/work/` — no code edit. Feeds both
 * the hero slider and the gallery. Server components only.
 *
 * Order follows the file name, and captions are matched by file name against
 * `photoCaptions`. A missing folder simply yields no slides, which the hero
 * renders as a plain espresso panel.
 */
export function getWorkPhotos(): WorkPhoto[] {
  let files: string[];
  try {
    files = fs.readdirSync(WORK_DIR);
  } catch {
    return [];
  }

  return files
    .filter((file) => IMAGE_EXTENSIONS.has(path.extname(file).toLowerCase()))
    .sort((a, b) => a.localeCompare(b))
    .map((file) => {
      const meta = photoCaptions[file];
      return {
        src: `/images/work/${file}`,
        alt: meta?.alt ?? 'CoastPro appliance repair work in Orange County',
        location: meta?.location,
        caption: meta?.caption,
      };
    });
}
