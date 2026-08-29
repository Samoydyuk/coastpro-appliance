/**
 * The settings screens, in English.
 *
 * One file per section so the work can be split without two people editing the
 * same object. Keys read as `settings.thing`. Plural stems end in `.one` /
 * `.few` / `.many` / `.other` and are reached through `t.plural` — English
 * needs two of those forms and Ukrainian needs four, so nothing may choose
 * between them with `n === 1`.
 *
 * Most of this file is prose rather than labels. The hints and the setup
 * instructions are the part of the console that explains itself, so they are
 * kept whole: a sentence split into fragments to save a key cannot be reordered
 * by a translator, and Ukrainian word order is not English word order. Where a
 * sentence genuinely wraps around a `<code>` sample the pieces are numbered
 * `.1`, `.2`, and the sample itself never enters the dictionary — it is not
 * language, it is a literal a reader copies.
 */
export const settings = {
  // The page itself
  'settings.title': 'Settings',
  'settings.subtitle': 'Numbers, integrations and what is still missing',

  // What is connected
  'settings.integrations.title': 'Integrations',
  'settings.integrations.subtitle': 'What is connected right now',
  'settings.integrations.ready': 'ready',
  'settings.integrations.notReady': 'not set up',

  'settings.integ.database': 'Database',
  'settings.integ.database.on': 'Connected. Visits, leads and calls are being recorded.',

  'settings.integ.resend': 'Lead notifications (Resend)',
  'settings.integ.resend.on': 'Delivered to {email}',
  'settings.integ.resend.off':
    'RESEND_API_KEY is not set — form submissions are recorded but nobody is emailed.',

  'settings.integ.jobpocket': 'JobPocket bookings',
  'settings.integ.jobpocket.on':
    'Enquiries go straight to the phone as booking requests, and the outcome of each job comes back here.',
  'settings.integ.jobpocket.paused':
    'Configured but switched off — enquiries are being recorded and queued, not dispatched.',
  'settings.integ.jobpocket.off':
    'No plugin key. Enquiries are recorded here but nobody is notified.',

  'settings.integ.telnyx': 'Call tracking (Telnyx)',
  'settings.integ.telnyx.on':
    'Webhook authenticated. Point each tracking number at /api/telnyx/webhook.',
  'settings.integ.telnyx.off':
    'No public key or token set — the call webhook will accept anything, which is fine only while testing.',

  'settings.integ.googleAds': 'Google Ads conversions',
  'settings.integ.googleAds.on': 'Won jobs are uploaded against the original click.',
  'settings.integ.googleAds.off':
    'Not configured. Google is optimising on form fills rather than on paid jobs.',

  'settings.integ.meta': 'Meta conversions',
  'settings.integ.meta.on': 'Events are sent server-side through the Conversions API.',
  'settings.integ.meta.off':
    'Not configured. Meta sees only what survives the browser, which is a minority of it.',

  // Who can get in
  'settings.access.title': 'Who can get in',
  'settings.access.subtitle':
    "This console shows customers' names, addresses and the week's schedule",
  'settings.access.on': 'on',
  'settings.access.off': 'off',

  'settings.access.totp': 'Code from an authenticator app',
  'settings.access.totp.on': 'Signing in needs the password and a six-digit code.',
  'settings.access.totp.off':
    'ADMIN_TOTP_SECRET is not set — the password on its own opens everything here.',

  'settings.access.sealed': 'Keys sealed in the database',
  'settings.access.sealed.on': 'A copy of the database does not reveal the JobPocket keys.',
  'settings.access.sealed.off':
    'SETTINGS_ENCRYPTION_KEY is not set — keys would sit in the database in plain text.',

  // Answering calls at a desk
  'settings.desk.title': 'Answering calls here',
  'settings.desk.subtitle': 'Take the business number at a desk instead of on the phone',
  'settings.desk.seatReady': 'Seat ready — {name}',
  'settings.desk.noSeat': 'No dispatcher seat yet',
  'settings.desk.creating': 'Creating…',
  'settings.desk.createSeat': 'Create the seat',
  'settings.desk.ringing': 'Calls ring at the desk as well as the phone',
  'settings.desk.notRinging': 'The seat exists but no calls reach it yet',
  'settings.desk.saving': 'Saving…',
  'settings.desk.stopRinging': 'Stop ringing here',
  'settings.desk.startRinging': 'Ring here too',
  'settings.desk.failed': 'That did not go through.',
  'settings.desk.takeCalls': 'Take calls here',
  'settings.desk.hint':
    'The seat is an identity for the phone system to route to — it has no email and no phone number, so nobody can sign into it. Whoever is at the desk presses “{button}” in the bar at the top; closing the tab sends the next call to the phone.',

  // JobPocket keys
  'settings.keys.title': 'JobPocket keys',
  'settings.keys.subtitle': 'Paste a key here when you mint or rotate one',
  'settings.keys.scope': 'What for',
  'settings.keys.scope.operations': 'Bookings and calendar',
  'settings.keys.scope.website': 'Website leads',
  'settings.keys.scope.marketing': 'Marketing',
  'settings.keys.field': 'Key',
  'settings.keys.checking': 'Checking…',
  'settings.keys.save': 'Save key',
  'settings.keys.saved': '{label} saved — {masked}',
  'settings.keys.failed': 'Could not save that key.',
  'settings.keys.hint':
    'JobPocket → Settings → Integrations → the scope you want → Switch on, then copy the key it shows once. It is checked here before it is stored, so a mistyped key is refused now rather than showing up later as an empty screen.',

  // Tracking numbers
  'settings.numbers.title': 'Tracking numbers',
  'settings.numbers.subtitle':
    'One per channel — whichever rings tells us which ad paid for the call',
  'settings.numbers.number': 'Number',
  'settings.numbers.shownTo': 'Shown to',
  'settings.numbers.label': 'Label',
  'settings.numbers.labelPlaceholder': 'Optional note',
  'settings.numbers.status': 'Status',
  'settings.numbers.add': 'Add',
  'settings.numbers.retire': 'Retire',
  'settings.numbers.active': 'Active',
  'settings.numbers.retired': 'Retired',
  'settings.numbers.everyoneElse': 'Everyone else',
  'settings.numbers.fallback': 'Everyone else (fallback)',
  'settings.numbers.saveFailed': 'Could not save.',
  'settings.numbers.empty':
    'No numbers yet. Until one is added, every visitor sees {phone} and calls cannot be attributed.',
  'settings.numbers.hint.1':
    'Buy the numbers in Telnyx, forward each to {phone}, and point their voice webhook at',
  'settings.numbers.hint.2':
    'The site then shows each visitor the number for their channel; anyone whose channel has no number keeps the main line, so no call can ever be lost to a missing row here.',

  // Tagging the ads
  'settings.tag.title': 'How to tag your ads',
  'settings.tag.subtitle': 'What each platform needs on its links',
  'settings.tag.google': 'Google Ads',
  'settings.tag.google.body':
    'Leave auto-tagging on — it supplies the click id by itself. To get keyword and creative reporting, set the account tracking template to',
  'settings.tag.lsa': 'Local Services Ads',
  'settings.tag.lsa.1': 'LSA has no click id, so tag the profile’s website link with',
  'settings.tag.lsa.2':
    'Most LSA leads arrive by phone, so its tracking number matters more than the tag.',
  'settings.tag.meta': 'Meta',
  'settings.tag.meta.1': 'Add',
  'settings.tag.meta.2':
    'to the URL parameters field. Without the medium, Meta traffic cannot be told apart from an ordinary post.',
  'settings.tag.other': 'Yelp, Nextdoor, anything else',
  'settings.tag.other.1': 'Any link works as long as it carries',
  'settings.tag.other.2': 'and',
  'settings.tag.other.3':
    'Untagged traffic still gets classified by its referrer, just less precisely.',

  // Signing in
  'settings.login.console': 'Marketing console',
  'settings.login.password': 'Password',
  'settings.login.code': 'Authenticator code',
  'settings.login.codeHint': 'Six digits from your authenticator app',
  'settings.login.submit': 'Sign in',
  'settings.login.failed': 'Could not sign in.',

  // Shared by every form on these screens
  'settings.unreachable': 'Could not reach the server.',
} as const;
