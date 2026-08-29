import { core } from './core';
import { money } from './money';
import { overview } from './overview';
import { work } from './work';
import { marketing } from './marketing';
import { website } from './website';
import { settings } from './settings';
import { shared } from './shared';

/**
 * One language, assembled from its sections.
 *
 * Split by screen so translating the console could be shared out without two
 * hands on the same object. The merge is flat: keys carry their own section
 * prefix, so nothing collides.
 */
export const uk = {
  ...core,
  ...money,
  ...overview,
  ...work,
  ...marketing,
  ...website,
  ...settings,
  ...shared,
};
