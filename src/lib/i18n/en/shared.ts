/**
 * The shared screens, in English.
 *
 * One file per section so the work can be split without two people editing the
 * same object. Keys read as `shared.thing`. Plural stems end in `.one` /
 * `.few` / `.many` / `.other` and are reached through `t.plural` — English
 * needs two of those forms and Ukrainian needs four, so nothing may choose
 * between them with `n === 1`.
 *
 * A note on the fragments. Three of these screens put a `<code>`, a `<strong>`
 * or a `<Link>` in the middle of a sentence, so the sentence arrives here in
 * pieces. They are cut at clause boundaries rather than at words, and the
 * order the pieces are rendered in holds in both languages — but a translator
 * changing one has to read the JSX beside it, because the spacing lives there.
 */
export const shared = {
  // ── Status labels ────────────────────────────────────────────────────────
  // The keys are the enum values themselves — a lead status, a booking
  // request status, a JobPocket job status. They are what the database and
  // the API say; only the label beside them is anybody's language.
  'shared.status.new': 'New',
  'shared.status.contacted': 'Contacted',
  'shared.status.booked': 'Booked',
  'shared.status.won': 'Won',
  'shared.status.lost': 'Lost',
  'shared.status.spam': 'Spam',
  'shared.status.PENDING': 'Waiting',
  'shared.status.ACCEPTED': 'Accepted',
  'shared.status.DECLINED': 'Declined',
  'shared.status.CANCELLED': 'Cancelled',
  'shared.status.SCHEDULED': 'Scheduled',
  'shared.status.IN_PROGRESS': 'In progress',
  'shared.status.PAUSED': 'Paused',
  'shared.status.COMPLETED': 'Completed',
  'shared.status.INVOICED': 'Invoiced',
  'shared.status.PAID': 'Paid',
  'shared.status.DRAFT': 'Draft',
  'shared.status.SENT': 'Sent',
  'shared.status.APPROVED': 'Approved',

  // Payment status is a separate enum with its own PAID, so it gets its own
  // prefix rather than sharing one map with the job statuses.
  'shared.pay.PAID': 'Paid',
  'shared.pay.UNPAID': 'Unpaid',
  'shared.pay.PARTIAL': 'Part paid',
  'shared.pay.REFUNDED': 'Refunded',
  'shared.pay.WRITTEN_OFF': 'Written off',
  'shared.pay.FREE': 'No charge',

  // ── The screen that appears when the database is unreachable ─────────────
  'shared.setup.noDatabase': 'Database not connected yet',
  'shared.setup.noTables': 'Tables not created yet',
  'shared.setup.failed': 'Could not load',
  'shared.setup.copy': 'Copy',
  'shared.setup.addToVercel': 'from the Railway Postgres service, add it to Vercel as',
  'shared.setup.andRedeploy': ', and redeploy.',
  'shared.setup.publicOne': 'It has to be the public one. The internal address —',
  'shared.setup.internalOnly':
    '— only resolves inside Railway’s own network, and this site does not run there.',
  'shared.setup.emptyRun': 'The database is reachable but empty. Run',
  'shared.setup.once': 'once.',

  // ── The screen that appears when JobPocket has not been connected ────────
  'shared.notConnected.title': 'Not connected yet',
  'shared.notConnected.subtitle': '{what} come from JobPocket, and there is no key yet',
  'shared.notConnected.body':
    'This screen is empty because it has nothing to ask. It is not saying you have no work — it has not been given a way to look.',
  'shared.notConnected.step1': 'In JobPocket:',
  'shared.notConnected.step1menu': 'Settings → Integrations',
  'shared.notConnected.step1find': ', find',
  'shared.notConnected.step1toggle': 'Bookings and calendar',
  'shared.notConnected.step1end': ', and switch it on.',
  'shared.notConnected.step2': 'Copy the key it shows. It is shown',
  'shared.notConnected.step2once': 'once',
  'shared.notConnected.step2end': '— closing the screen means minting a new one.',
  'shared.notConnected.step3': 'Paste it on',
  'shared.notConnected.step3under': 'under',
  'shared.notConnected.step3keys': 'JobPocket keys',
  'shared.notConnected.step3end': ', with the type set to “Bookings and calendar”.',
  'shared.notConnected.footnote':
    'Not the “Your own website” key — that one can only file enquiries, and it is meant to be refused here. If you paste it by mistake this screen will say so rather than going quiet.',

  // ── Charts ───────────────────────────────────────────────────────────────
  'shared.chart.noData': 'No data yet.',
  'shared.chart.overTime': '{series} over time',
  'shared.chart.ofVisits': '{pct} of visits',
  'shared.chart.carriedOver': '{pct} carried over',
  'shared.chart.heatmapHover': '{day} at {hour}:00 — {requests}',
  'shared.chart.heatmapLegend':
    'Darkest cell = {requests}. Hover a cell for the exact figure.',
  'shared.chart.cellTitle': '{day} {hour}:00 — {total}',

  // Weekdays, indexed the way `Date.getDay()` counts them. Used as labels
  // only — the row key is the number, so translating these cannot collapse
  // the grid.
  'shared.day.0': 'Sun',
  'shared.day.1': 'Mon',
  'shared.day.2': 'Tue',
  'shared.day.3': 'Wed',
  'shared.day.4': 'Thu',
  'shared.day.5': 'Fri',
  'shared.day.6': 'Sat',

  // ── Paging ───────────────────────────────────────────────────────────────
  'shared.pager.range': '{from}–{to}',
  'shared.pager.rangeOfTotal': '{from}–{to} of {total}',

  // ── The phone at the desk ────────────────────────────────────────────────
  'shared.call.takeCalls': 'Take calls here',
  'shared.call.goingToPhone': 'Calls are going to the phone.',
  'shared.call.connecting': 'Connecting the phone',
  'shared.call.onDuty': 'On duty — calls ring here and on the phone.',
  'shared.call.stop': 'Stop',
  'shared.call.incoming': 'Incoming call',
  'shared.call.ringing': 'Ringing',
  'shared.call.firstTime': 'First time',
  'shared.call.owes': 'Owes {amount}',
  'shared.call.multiple': 'Several customers on this number',
  'shared.call.booked': 'Booked',
  'shared.call.lastVisit': 'Last visit',
  'shared.call.answer': 'Answer',
  'shared.call.mute': 'Mute',
  'shared.call.unmute': 'Unmute',
  'shared.call.decline': 'Decline',
  'shared.call.hangUp': 'Hang up',

  'shared.call.stage.mic': 'Asking for the microphone',
  'shared.call.stage.loading': 'Loading the phone',
  'shared.call.stage.connecting': 'Connecting',
  'shared.call.stage.signingIn': 'Signing in',
  'shared.call.stage.socketFailed': 'The connection to the phone network failed',

  'shared.call.err.request': 'That did not go through.',
  'shared.call.err.outbound': 'That call would not go through.',
  'shared.call.err.noMediaApi':
    'This browser will not share a microphone with the page. Chrome, Edge or Safari over https will.',
  'shared.call.err.micBlocked':
    'The microphone is blocked for this site. Click the padlock in the address bar, allow the microphone, then reload.',
  'shared.call.err.micMissing':
    'No microphone found. Plug one in, or pick one in the system sound settings.',
  'shared.call.err.micBusy': 'Another program is holding the microphone. Close it and try again.',
  'shared.call.err.micOther': 'The microphone could not be opened{detail}.',
  'shared.call.err.notTold': 'Connected, but the server was not told: {message}',
  'shared.call.err.lostServer': 'Lost touch with the server: {message}',
  'shared.call.err.phoneFailed': 'The phone connection failed.',
  'shared.call.err.closed': 'The phone network closed the connection. Try again.',
  'shared.call.err.noAnswer': 'The phone network did not answer{stage}. Try again.',
  'shared.call.err.stoppedAt': ' — it stopped at: {stage}',
  'shared.call.err.unreachable': 'Could not reach the phone network.',
  'shared.call.err.startPhone': 'Could not start the phone.',
  'shared.call.err.audioBlocked':
    'The browser blocked the call audio. Click the page and try again.',
  'shared.call.err.answer': 'Could not pick that up.',
  'shared.call.notice.micLater': 'The microphone will be asked for on the first call.',

  'shared.callButton.title': 'Call on the business line',
  'shared.callButton.action': '↗ call',

  // ── Plurals ──────────────────────────────────────────────────────────────
  'shared.request.one': '{n} request',
  'shared.request.few': '{n} requests',
  'shared.request.many': '{n} requests',
  'shared.request.other': '{n} requests',
  'shared.lastJobs.one': 'Last {n} job',
  'shared.lastJobs.few': 'Last {n} jobs',
  'shared.lastJobs.many': 'Last {n} jobs',
  'shared.lastJobs.other': 'Last {n} jobs',
} as const;
