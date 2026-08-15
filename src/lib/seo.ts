import type { Metadata } from 'next';

/**
 * Title handling for copy this codebase did not write.
 *
 * Page titles authored here are short and brand-free, and the `(site)` layout
 * appends "| CoastPro" to them. Article titles come from the database, written
 * by the marketing generator, and that generator likes to sign its work: it
 * emits things like "LG Washer Not Draining | CoastPro Repair". Run through the
 * same template those went out as "… | CoastPro Repair | CoastPro".
 *
 * So: if a title already names the shop, it is taken as final and the template
 * is bypassed. Otherwise it flows through normally and gets the suffix.
 */

const BRAND = 'CoastPro';

export function articleTitle(title: string): Metadata['title'] {
  return title.toLowerCase().includes(BRAND.toLowerCase()) ? { absolute: title } : title;
}
