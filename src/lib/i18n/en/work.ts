/**
 * The work screens, in English.
 *
 * One file per section so the work can be split without two people editing the
 * same object. Keys read as `work.thing`. Plural stems end in `.one` /
 * `.few` / `.many` / `.other` and are reached through `t.plural` — English
 * needs two of those forms and Ukrainian needs four, so nothing may choose
 * between them with `n === 1`.
 */
export const work = {
  // ---------------------------------------------------------------------
  // Plural stems. Reached through `t.plural`, never picked by hand.
  // ---------------------------------------------------------------------
  'work.plural.visit.one': '{n} visit',
  'work.plural.visit.few': '{n} visits',
  'work.plural.visit.many': '{n} visits',
  'work.plural.visit.other': '{n} visits',
  'work.plural.lead.one': '{n} enquiry',
  'work.plural.lead.few': '{n} enquiries',
  'work.plural.lead.many': '{n} enquiries',
  'work.plural.lead.other': '{n} enquiries',
  'work.plural.waiting.one': '{n} waiting for an answer',
  'work.plural.waiting.few': '{n} waiting for an answer',
  'work.plural.waiting.many': '{n} waiting for an answer',
  'work.plural.waiting.other': '{n} waiting for an answer',
  'work.plural.newCaller.one': '{n} first-time caller',
  'work.plural.newCaller.few': '{n} first-time callers',
  'work.plural.newCaller.many': '{n} first-time callers',
  'work.plural.newCaller.other': '{n} first-time callers',

  // ---------------------------------------------------------------------
  // Shared across the work forms
  // ---------------------------------------------------------------------
  'work.form.today': 'Today',
  'work.form.save': 'Save',
  'work.form.saving': 'Saving…',
  'work.form.saved': 'Saved.',
  'work.form.noServer': 'Could not reach the server.',
  'work.form.checkingCalendar': 'Checking the calendar…',
  'work.form.ownTime': 'Or a time of your own',

  // ---------------------------------------------------------------------
  // Calendar
  // ---------------------------------------------------------------------
  'work.calendar.title': 'Calendar',
  'work.calendar.nothingBooked': 'Nothing booked',
  'work.calendar.view.month': 'Month',
  'work.calendar.view.week': 'Week',
  'work.calendar.view.day': 'Day',
  'work.calendar.today': 'Today',
  'work.calendar.stepBack': 'Back',
  'work.calendar.stepForward': 'Forward',
  'work.calendar.everyone': 'Everyone',
  'work.calendar.notConnectedWhat': 'Jobs and bookings',
  'work.calendar.monthSubtitle': 'Straight from JobPocket — the same jobs the app shows',
  'work.calendar.laneSubtitle': 'A lane is a person; the empty stretch is what you are looking for',
  'work.calendar.emptyHere':
    'Nothing booked here. Requests waiting for an answer are on the Bookings screen.',
  'work.calendar.bookTitle': 'Book a visit',
  'work.calendar.bookSubtitle': 'Somebody rang — put it in the diary',
  'work.calendar.noName': 'No name',
  'work.calendar.nobodyYet': 'Nobody yet',
  'work.calendar.shared': 'shared',
  'work.calendar.more': '+{n} more',
  'work.calendar.hint':
    'A live view of JobPocket, not a copy — accept a request here or in the app and both show the same job a moment later. Times are in the shop’s timezone; cancelled work is left out.',
  'work.calendar.hintOwn': ' Visits with no brand are your own work.',

  // ---------------------------------------------------------------------
  // One job
  // ---------------------------------------------------------------------
  'work.job.back': '← Calendar',
  'work.job.untitled': 'Job',
  'work.job.notScheduled': 'Not scheduled',
  'work.job.doneUnderBefore': 'Done under ',
  'work.job.doneUnderAfter': ' — dispatched work, not CoastPro’s own.',
  'work.job.pricedFrom': 'What it was priced from',
  'work.job.nothingItemised':
    'Nothing itemised yet. A visit is priced on site, so a job that has not happened carries no lines.',
  'work.job.item': 'Item',
  'work.job.qty': 'Qty',
  'work.job.each': 'Each',
  'work.job.lineTotal': 'Total',
  'work.job.subtotal': 'Subtotal',
  'work.job.tax': 'Tax ({rate}%)',
  'work.job.total': 'Total',
  'work.job.photos': 'Photos',
  'work.job.photosSubtitle': '{n} from the visit',
  'work.job.noPhotos': 'No photos on this job.',
  'work.job.photoAlt': 'Job photo',
  'work.job.photo.BEFORE': 'Before',
  'work.job.photo.DURING': 'During',
  'work.job.photo.AFTER': 'After',
  'work.job.photo.ISSUE': 'The problem',
  'work.job.photo.GENERAL': 'Other',
  'work.job.whatHappened': 'What happened',
  'work.job.diagnosis': 'Diagnosis',
  'work.job.resolution': 'What was done',
  'work.job.notes': 'Notes',
  'work.job.whoIsGoing': 'Who is going',
  'work.job.whoIsGoingSubtitle': 'They are told as soon as you save',
  'work.job.moveTitle': 'Move this visit',
  'work.job.moveHint':
    'Status, prices and payment are changed in the app. Finishing a job closes the technician’s time entry and can start a follow-up message, so it belongs where the work happens.',
  'work.job.documents': 'Estimates & invoices',
  'work.job.nothingBilled': 'Nothing has been billed on this job yet.',
  'work.job.doc.invoice': 'Invoice',
  'work.job.doc.estimate': 'Estimate',
  'work.job.doc.voided': ' · voided',
  'work.job.doc.paid': ' · paid {when}',
  'work.job.doc.signed': ' · signed {when}',
  'work.job.doc.sent': ' · sent {when}',
  'work.job.doc.notSent': ' · not sent',
  'work.job.scans': 'Scans',
  'work.job.scansSubtitle': 'Signed paper from the visit',
  'work.job.scansHint':
    'Internal. These are the paper documents scanned on the job, not something the customer is shown.',
  'work.job.customer': 'Customer',
  'work.job.name': 'Name',
  'work.job.phone': 'Phone',
  'work.job.address': 'Address',
  'work.job.appliance': 'Appliance',
  'work.job.timeline': 'Timeline',
  'work.job.created': 'Created',
  'work.job.scheduled': 'Scheduled',
  'work.job.started': 'Started',
  'work.job.completed': 'Completed',
  'work.job.paid': 'Paid',
  'work.job.notPaidYet': 'Not yet',
  'work.job.assignedTo': 'Assigned to',
  'work.job.hint':
    'Read live from JobPocket — this is the same job the app shows, not a copy of it. What a part cost to buy is deliberately not carried here.',

  // ---------------------------------------------------------------------
  // Who is going
  // ---------------------------------------------------------------------
  'work.assign.noTeam':
    'No team yet. Add somebody in the app and they will appear here as a lane on the calendar.',
  'work.assign.you': '(you)',
  'work.assign.failed': 'Could not change who is going.',
  'work.assign.told': 'Saved. They have been told.',
  'work.assign.clearedDone': 'Taken off everybody.',
  'work.assign.clear': 'Take it off everybody',

  // ---------------------------------------------------------------------
  // Moving a visit
  // ---------------------------------------------------------------------
  'work.move.locked': 'This job is finished or called off. Reopen it in the app before moving it.',
  'work.move.pickSomething': 'Pick a window or set a time.',
  'work.move.failed': 'Could not move that visit.',
  'work.move.done': 'Moved. The technician has been told and the app has it already.',
  'work.move.clash': 'Note: there is another visit within the hour{what}. Moved anyway.',
  'work.move.noWindows': 'No free windows that day on the booking page. Set a time below instead.',
  'work.move.submit': 'Move the visit',
  'work.move.submitting': 'Moving…',

  // ---------------------------------------------------------------------
  // Booking a visit by hand
  // ---------------------------------------------------------------------
  'work.book.name': 'Name',
  'work.book.namePlaceholder': 'Ann Wheeler',
  'work.book.phone': 'Phone',
  'work.book.address': 'Address',
  'work.book.service': 'Service',
  'work.book.notSureYet': 'Not sure yet',
  'work.book.problem': 'What is wrong',
  'work.book.problemPlaceholder': 'Not draining, grinding noise, error code F22…',
  'work.book.when': 'When',
  'work.book.noWindows':
    'No free windows that day on the booking page. You can still set a time below.',
  'work.book.notLimited':
    'Your diary is not limited to what the booking page is offering. Leave both empty to book without a time and ring them.',
  'work.book.submit': 'Book the visit',
  'work.book.submitting': 'Booking…',
  'work.book.failed': 'Could not create that job.',
  'work.book.done': 'Booked. It is on the calendar and in the app.',

  // ---------------------------------------------------------------------
  // Booking requests
  // ---------------------------------------------------------------------
  'work.bookings.title': 'Bookings',
  'work.bookings.nothingWaiting': 'Nothing waiting for an answer',
  'work.bookings.filter.all': 'All',
  'work.bookings.filter.PENDING': 'Waiting',
  'work.bookings.filter.ACCEPTED': 'Accepted',
  'work.bookings.filter.DECLINED': 'Declined',
  'work.bookings.requests': 'Requests',
  'work.bookings.requestsSubtitle': 'What came in, and what brought it',
  'work.bookings.emptyNoKey': 'Nothing to show until the key is connected.',
  'work.bookings.emptyFiltered': 'No requests with that status.',
  'work.bookings.empty':
    'No booking requests yet. They arrive here the moment somebody books on the website.',
  'work.bookings.who': 'Who',
  'work.bookings.what': 'What',
  'work.bookings.askedFor': 'Asked for',
  'work.bookings.cameFrom': 'Came from',
  'work.bookings.received': 'Received',
  'work.bookings.until': 'until {time}',
  'work.bookings.callToArrange': 'Call to arrange',
  'work.bookings.disagreement': 'Disagreement: {what}',
  'work.bookings.notFromWebsite': 'Not from the website',
  'work.bookings.older': 'Older →',
  'work.bookings.hint':
    'These come live from JobPocket — nothing is copied into this site, so the list cannot drift out of step with the app. “Came from” is the part only this console knows: it is matched from the enquiry the website captured before the request was filed.',

  // ---------------------------------------------------------------------
  // One booking request
  // ---------------------------------------------------------------------
  'work.booking.back': '← All bookings',
  'work.booking.contact': 'Contact',
  'work.booking.contactSubtitle': 'Shown here and nowhere else in this console',
  'work.booking.phone': 'Phone',
  'work.booking.email': 'Email',
  'work.booking.address': 'Address',
  'work.booking.appliance': 'Appliance',
  'work.booking.notGiven': 'Not given',
  'work.booking.asked': 'What they asked for',
  'work.booking.service': 'Service',
  'work.booking.window': 'Arrival window',
  'work.booking.noWindow': 'None picked — call to arrange',
  'work.booking.noDescription': 'They did not describe the problem.',
  'work.booking.access': 'Access',
  'work.booking.origin': 'Where they came from',
  'work.booking.originSubtitle': 'Known only here, not in the app',
  'work.booking.source': 'Source',
  'work.booking.campaign': 'Campaign',
  'work.booking.term': 'Search term',
  'work.booking.recordedValue': 'Recorded value',
  'work.booking.fullEnquiry': 'Full enquiry →',
  'work.booking.noOrigin':
    'No matching enquiry on this site. This one came in another way — the booking page directly, or somebody typed it in — so no advertising is being charged for it.',
  'work.booking.answer': 'Answer',
  'work.booking.becameJob': 'The job it became',
  'work.booking.number': 'Number',
  'work.booking.payment': 'Payment',
  'work.booking.total': 'Total',
  'work.booking.scheduled': 'Scheduled',
  'work.booking.notScheduled': 'Not scheduled',
  'work.booking.conflictTitle': 'Disagreement',
  'work.booking.conflictBody':
    'JobPocket and the outcome recorded on this site do not agree:',
  'work.booking.conflictHint':
    'Nothing has been changed automatically. A status set by a person who spoke to the customer outranks anything a synchronisation concludes, so this is recorded and left for you.',

  // Labels for the recorded disagreement codes. The code itself is a stored
  // value and is never translated — only what is shown for it.
  'work.conflict.accepted_after_lost': 'accepted after it was marked lost',
  'work.conflict.accepted_after_spam': 'accepted after it was marked spam',
  'work.conflict.working_after_lost': 'work started after it was marked lost',
  'work.conflict.working_after_spam': 'work started after it was marked spam',
  'work.conflict.invoiced_after_lost': 'invoiced after it was marked lost',
  'work.conflict.invoiced_after_spam': 'invoiced after it was marked spam',
  'work.conflict.paid_after_lost': 'paid after it was marked lost',
  'work.conflict.paid_after_spam': 'paid after it was marked spam',
  'work.conflict.declined_after_booked': 'declined after it had been booked',
  'work.conflict.cancelled_after_booked': 'cancelled after it had been booked',
  'work.conflict.refund_after_won': 'refunded after it was counted as won',

  // ---------------------------------------------------------------------
  // Answering a request
  // ---------------------------------------------------------------------
  'work.answer.failed': 'That did not go through.',
  'work.answer.declined': 'Declined.',
  'work.answer.already': 'Already a job — nothing new was created.',
  'work.answer.accepted': 'Accepted. It is on the calendar now.',
  'work.answer.wasAccepted': 'Accepted — this is a job now.',
  'work.answer.wasDeclined': 'Declined.',
  'work.answer.wasCancelled': 'Cancelled by the customer.',
  'work.answer.whenToTurnUp': 'When to turn up',
  'work.answer.theirTime': 'What they picked. Change it and the job takes the new time.',
  'work.answer.noTime':
    'They did not pick a time. Leave it empty to accept without one and ring them.',
  'work.answer.accept': 'Accept',
  'work.answer.accepting': 'Accepting…',
  'work.answer.decline': 'Decline',
  'work.answer.declining': 'Declining…',
  'work.answer.note':
    'Accepting creates the job in JobPocket and puts it on the calendar. The customer is not told anything automatically — that still happens when you ring them.',

  // ---------------------------------------------------------------------
  // Enquiries
  // ---------------------------------------------------------------------
  'work.leads.title': 'Enquiries',
  'work.leads.search': 'Search',
  'work.leads.searchPlaceholder': 'Name, phone, email, town',
  'work.leads.any': 'Any',
  'work.leads.channel': 'Channel',
  'work.leads.clear': 'Clear',
  'work.leads.empty': 'No enquiries match this filter.',
  'work.leads.when': 'When',
  'work.leads.name': 'Name',
  'work.leads.contact': 'Contact',
  'work.leads.town': 'Town',
  'work.leads.appliance': 'Appliance',
  'work.leads.form': 'Form',
  'work.leads.decidedIn': 'Decided in',
  'work.leads.duplicate': 'dup',
  'work.leads.showing': '{from}–{to} of {total}',
  'work.leads.newer': '← Newer',
  'work.leads.older': 'Older →',
  'work.leads.hint':
    'Marking an enquiry won, with its value, is what makes the money figures elsewhere real — and it is also what gets sent back to Google and Meta so their bidding optimises for paid jobs instead of form fills.',

  // Enquiry outcomes. The value is what the database and the query string
  // carry; only the label changes with the language.
  'work.leadStatus.new': 'New',
  'work.leadStatus.contacted': 'Contacted',
  'work.leadStatus.booked': 'Booked',
  'work.leadStatus.won': 'Won',
  'work.leadStatus.lost': 'Lost',
  'work.leadStatus.spam': 'Spam',

  // Which form it arrived on.
  'work.sourceForm.contact': 'Contact form',
  'work.sourceForm.booking': 'Booking form',
  'work.sourceForm.calendly': 'Calendly',
  'work.sourceForm.call': 'Phone call',
  'work.sourceForm.manual': 'Entered by hand',

  // ---------------------------------------------------------------------
  // One enquiry
  // ---------------------------------------------------------------------
  'work.lead.back': '← All enquiries',
  'work.lead.unnamed': 'Unnamed enquiry',
  'work.lead.duplicate':
    'This looks like a repeat of an earlier submission from the same number within thirty days. It is excluded from enquiry counts so the channel’s cost per enquiry stays honest.',
  'work.lead.contact': 'Contact',
  'work.lead.phone': 'Phone',
  'work.lead.email': 'Email',
  'work.lead.address': 'Address',
  'work.lead.appliance': 'Appliance',
  'work.lead.notificationEmail': 'Notification email',
  'work.lead.emailNotAttempted': 'not attempted',
  'work.lead.emailDelivered': 'delivered',
  'work.lead.emailFailed': 'FAILED — nobody was told by email',
  'work.lead.decidedIn': 'Decided in',
  'work.lead.attribution': 'Attribution',
  'work.lead.attributionSubtitle': 'Frozen at the moment they got in touch',
  'work.lead.firstTouch': 'First touch',
  'work.lead.firstTouchNote': 'What introduced them to the business',
  'work.lead.lastTouch': 'Last touch',
  'work.lead.lastTouchNote': 'What was in play when they converted',
  'work.lead.source': 'Source',
  'work.lead.medium': 'Medium',
  'work.lead.campaign': 'Campaign',
  'work.lead.ad': 'Ad',
  'work.lead.keyword': 'Keyword',
  'work.lead.landedOn': 'Landed on',
  'work.lead.referrer': 'Referrer',
  'work.lead.clickIds': 'Click identifiers',
  'work.lead.clickIdsHint':
    'These are what let a won job be reported back to the ad platform, tied to the exact click that produced it.',
  'work.lead.behaviour': 'What they did',
  'work.lead.behaviourSubtitle': 'Their behaviour on the visit that converted',
  'work.lead.noBehaviour':
    'No behaviour recorded — the enquiry arrived without a tracked session, which happens with a direct phone call or a Calendly link.',
  'work.lead.after': ' after {duration}',
  'work.lead.outcome': 'Outcome',
  'work.lead.calls': 'Calls',
  'work.lead.callsSubtitle': 'From this number',
  'work.lead.noCalls': 'No calls linked.',
  'work.lead.missed': 'missed',
  'work.lead.earlierVisits': 'Earlier visits',
  'work.lead.earlierVisitsSubtitle': 'Everything this browser did before',
  'work.lead.noVisits': 'No other visits.',
  'work.lead.when': 'When',
  'work.lead.channel': 'Channel',
  'work.lead.pages': 'Pages',
  'work.lead.exports': 'Sent back to ad platforms',
  'work.lead.export.sent': 'sent',
  'work.lead.export.failed': 'failed',
  'work.lead.export.pending': 'pending',

  // What a visitor did on the site. The event name is a stored value; these
  // are only the words shown for it.
  'work.event.pageview': 'Viewed',
  'work.event.engagement': 'Reading',
  'work.event.scroll': 'Scrolled',
  'work.event.click_phone': 'Tapped the phone number',
  'work.event.click_email': 'Tapped the email',
  'work.event.click_cta': 'Clicked',
  'work.event.outbound': 'Left to',
  'work.event.form_start': 'Started the form',
  'work.event.form_field': 'Filled in',
  'work.event.form_step': 'Form step',
  'work.event.form_submit': 'Submitted the form',
  'work.event.form_error': 'Form rejected',
  'work.event.calendly_view': 'Reached the calendar',
  'work.event.calendly_booked': 'Booked an appointment',
  'work.event.rage_click': 'Clicked repeatedly on',
  'work.event.js_error': 'Hit a script error',
  'work.event.exit': 'Left the site',

  // ---------------------------------------------------------------------
  // Recording the outcome
  // ---------------------------------------------------------------------
  'work.editor.jobValue': 'Job value',
  'work.editor.valueHint':
    'What the job actually invoiced. Blank means unknown, which is different from zero.',
  'work.editor.notes': 'Notes',
  'work.editor.notesPlaceholder': 'What happened when you called.',
  'work.editor.saveFailed': 'Could not save.',

  // ---------------------------------------------------------------------
  // Calls
  // ---------------------------------------------------------------------
  'work.calls.title': 'Calls',
  'work.calls.noNumbersBefore':
    'No tracking numbers are configured, so calls cannot be attributed to a channel. Add them under ',
  'work.calls.noNumbersAfter': ' — one number per channel, each forwarded to the main line.',
  'work.calls.count': 'Calls',
  'work.calls.answered': 'Answered',
  'work.calls.ofCalls': '{pct} of calls',
  'work.calls.missed': 'Missed',
  'work.calls.missedHint': 'each one is a job somebody else got',
  'work.calls.missedNone': 'none',
  'work.calls.talkTime': 'Talk time',
  'work.calls.overSeconds': '{n} calls longer than {seconds}s',
  'work.calls.log': 'Call log',
  'work.calls.empty':
    'No calls recorded. Calls only appear here once tracking numbers are live and the Telnyx webhook is pointed at this site.',
  'work.calls.when': 'When',
  'work.calls.from': 'From',
  'work.calls.rang': 'Rang',
  'work.calls.channel': 'Channel',
  'work.calls.town': 'Town',
  'work.calls.wasReading': 'Was reading',
  'work.calls.length': 'Length',
  'work.calls.result': 'Result',
  'work.calls.new': 'new',
  'work.calls.tooShort': 'Too short',
  'work.calls.wasAnswered': 'Answered',
  'work.calls.wasMissed': 'Missed',
  'work.calls.lead': 'enquiry',
  'work.calls.hint':
    '“Was reading” is the page the matching browsing session landed on — how the call gets tied back to an ad. It is a best match on channel and timing, so treat it as strong evidence rather than proof.',
} as const;
