/**
 * The money screens, in English.
 *
 * One file per section so the work can be split without two people editing the
 * same object. Keys read as `money.thing`. Plural stems end in `.one` /
 * `.few` / `.many` / `.other` and are reached through `t.plural` — English
 * needs two of those forms and Ukrainian needs four, so nothing may choose
 * between them with `n === 1`.
 *
 * Everything the money screens share with the rest of the console — `common.`,
 * `money.`, `unpaid.`, `stuck.`, `dispatchers.`, `technicians.`, `payments.` —
 * already lives in `core.ts`. Only what is missing is here.
 */
export const money = {
  'ihord.buildingTitle': 'Gathering the figures',
  'ihord.buildingBody': 'Both sets of books are being read. It takes about a minute the first time for a window, and is instant afterwards.',
  'ihord.buildingRetry': 'Check again',
  'ihord.age': 'These figures were gathered {minutes} minutes ago. A fresh read is already running behind this page.',

  'profile.title': 'Technician picture',
  'profile.noWork': 'No finished work in this window.',
  'profile.partsRate': 'Parts recorded',
  'profile.againstBooks': '{pct}% across the books',
  'profile.serviceCalls': 'Service call only',
  'profile.serviceCallsHint': 'a trip made and nothing sold',
  'profile.time': 'Actual visit',
  'profile.booked': 'booked for {n} min',
  'profile.worth': 'about {amount} over the window',
  'profile.byAppliance': 'By appliance',
  'profile.byMake': 'By make',
  'profile.makeUnrecorded': 'Not recorded',
  'profile.byDispatcher': 'By dispatcher, kept',
  'profile.hint': 'Every finding is worked out from these books over this window and states the numbers behind it — nothing here is a trade average from somewhere else. Under eight visits it says nothing at all, because two jobs is not a pattern. What a part cost is not broken out per person: on a thin slice, revenue beside a margin gives it away.',

  'ihord.unpaidHere': 'Nothing taken',

  'ihord.hasPhotos': '{n} photos',
  'ihord.noPhotos': 'No photos',
  'ihord.hasScan': '{n} scanned',
  'ihord.noScan': 'No paper scan',

  'ihord.title': 'Dispatcher reconciliation',
  'ihord.subtitle': 'Esquire\'s books beside ours',
  'ihord.period.thisMonth': 'This month',
  'ihord.period.lastMonth': 'Last month',
  'ihord.period.all': 'All time',
  'ihord.notConnected': 'The sync service has not answered yet.',
  'ihord.earned': 'Earned',
  'ihord.notSettled': 'Not settled',
  'ihord.paid': 'Paid out',
  'ihord.stillOwed': 'Still owed',
  'ihord.overpaid': 'they are ahead of the work',
  'ihord.parseGap': 'The earnings page lists {claimed} visits and {parsed} could be read. The figures above are theirs, not ours, so they are right — but the tables below are short by the difference.',
  'ihord.notSettledTitle': 'Done, not agreed yet',
  'ihord.notSettledSubtitle': 'Work handed in that they have not marked reconciled',
  'ihord.allSettled': 'Everything handed in has been agreed.',
  'ihord.notSettledHint': 'Reconciled is their word for "we agree this one is settled". Until a visit carries it, the money for it is not on its way.',
  'ihord.missingHere': 'In their books, not in ours',
  'ihord.missingThere': 'In ours, not in their books',
  'ihord.bothAgree': 'Both sides carry the same work.',
  'ihord.missingHereHint': 'Over a long window most of these are simply older than the sync, not lost. Over a month, they are worth asking about.',
  'ihord.missingThereHint': 'Work we have that never reached their earnings — nobody has been asked to pay for it.',
  'ihord.payouts': 'Payouts received',
  'ihord.noPayouts': 'No payouts recorded in this window.',
  'ihord.payoutsHint': 'What they have recorded paying. Compared against {count} jobs on our side.',
  'ihord.sold': 'Sold',
  'ihord.parts': 'Parts',
  'ihord.toYou': 'To you',
  'ihord.visit.one': '{n} visit',
  'ihord.visit.few': '{n} visits',
  'ihord.visit.many': '{n} visits',
  'ihord.visit.other': '{n} visits',
  'ihord.payout.one': '{n} payout',
  'ihord.payout.few': '{n} payouts',
  'ihord.payout.many': '{n} payouts',
  'ihord.payout.other': '{n} payouts',

  'money.entry.one': '{n} entry',
  'money.entry.few': '{n} entries',
  'money.entry.many': '{n} entries',
  'money.entry.other': '{n} entries',

  // Shared by every money screen
  'money.notConnected': 'Jobs and payments',
  'money.noAnswer': 'JobPocket did not answer.',
  'money.noFinishedWork': 'No finished work in this window.',
  'money.afterDispatchersShare': "after the dispatchers' share",
  'money.avgTicketShort': 'Avg ticket',
  'money.revenue': 'Revenue',
  'money.technician': 'Technician',

  // Profit — tiles
  'money.ofWhatWasBilled': '{pct} of what was billed',

  // Profit — the descent from billed to kept
  'money.dispatchersShareNote': 'what the companies sending you work keep',
  'money.fuelNote': 'from the mileage log',
  'money.writtenOffNote': 'debts given up on in this window',
  'money.overheadNote': 'standing costs, shared across the days you picked',
  'money.nothingOnThisLine': 'Nothing recorded against this line.',
  'money.waterfallHint':
    'This is what the business made, not what is left after paying yourself — a draw is a share ' +
    'of the answer, not a cost against it. Every figure is worked out by JobPocket; the console ' +
    'formats them and calculates nothing, so this page and the app cannot drift apart. Underlined ' +
    'lines open onto the jobs behind them.',

  // Profit — what the numbers are not being told
  'money.missingCategories':
    'Nothing has been entered under {categories}. A margin built on a few categories out of ' +
    'eleven looks excellent and is not.',
  'money.unsplitWarning':
    '{companies} {verb} no split recorded, so the whole ticket is counted as yours. If they take ' +
    'a cut, this profit is too high.',
  'money.unsplitVerb.one': 'has',
  'money.unsplitVerb.few': 'have',
  'money.unsplitVerb.many': 'have',
  'money.unsplitVerb.other': 'have',

  // Profit — the trend
  'money.pickLongerWindow': 'Pick a longer window to see the shape of it.',
  'money.trendHint':
    'Profit is deliberately not a third line here. Overhead and your own pay are spread across ' +
    'whichever window you picked, so cutting them per day would draw a profit that does not add ' +
    'up to the one in the table above.',

  // Three revenue figures
  'money.basis.title': 'Three revenue figures, three different questions',
  'money.basis.figure': 'Figure',
  'money.basis.answers': 'What it answers',
  'money.basis.invoiced': 'Invoiced in JobPocket',
  'money.basis.invoicedAnswer': 'All the work, whoever it came from.',
  'money.basis.traceable': 'Traceable to an enquiry',
  'money.basis.traceableAnswer':
    'The jobs that began as a website form or a call to a tracked number.',
  'money.basis.reported': 'Reported to Google Ads',
  'money.basis.reportedAnswer': 'Fixed when the job was marked won. Never amended.',
  'money.basis.note':
    'These do not add up, and they are not meant to. The first is the business. The second is the ' +
    'part of it advertising can be judged on — dispatcher work, calls to the shop’s own number ' +
    'and customers who already had it arrive with nothing to trace, so channel revenue can never ' +
    'reach the business total. The third is the figure Google Ads holds: it was uploaded against ' +
    'a click on the day the job was marked won and cannot be amended from here, so it stays where ' +
    'it is and the invoice figure is shown beside it rather than written over it.',
  'money.basis.wholePicture': 'The whole picture is under Money.',
  'money.basis.line':
    'Revenue here is real invoice money, and it covers only the work that started as an enquiry ' +
    'or a call to a tracked number — {attributed}. Anything from a dispatcher, from the shop’s ' +
    'own line, or from a customer who already had us has nothing to attribute it to. The figure ' +
    'Google Ads holds is different again — {reported} — because it was fixed when each job was ' +
    'marked won.',
  'money.basis.businessTotal': 'Money has the business total.',

  // Unpaid
  'money.ofWhatIsOwed': '{pct} of what is owed',
  'money.measuredToToday': 'Measured to today, not to a date window',
  'money.ageUnder30': 'Under 30 days',
  'money.age30to60': '31 to 60 days',
  'money.age60to90': '61 to 90 days',
  'money.ageOver90': 'Over 90 days',
  'money.nothingOutstandingLong': 'Nothing outstanding. Everything finished has been paid for.',
  'money.unpaidNoWindowHint':
    'There is no date window on this page on purpose. A debt does not stop existing because the ' +
    'report was narrowed to last week, and the oldest ones are the only ones that need a decision.',
  'money.oldestFirst': 'Oldest first — age decides who to ring, not size',
  'money.writeOffHint':
    'A debt that has been given up on is not outstanding and is not here — writing one off in the ' +
    'app takes it out of this list and books the loss in the period the decision was made.',

  // Stuck
  'money.nothingScanned': 'finished, nothing scanned onto them',
  'money.sameListApp': 'the same list the app watches',
  'money.everyJobWhereItShouldBe':
    'Every job is where it should be — invoiced, scanned, closed and assigned.',
  'money.stuckHint':
    'This list is not the console’s own. It comes from the checks JobPocket already watches, so ' +
    'the app and this page cannot come to different conclusions about what counts as unscanned or ' +
    'never invoiced — and a new check added there appears here by itself.',

  // Dispatchers
  'money.dispatchedShareOfWork':
    '{pct} of the work was dispatched — {own} of {total} jobs carried your own name.',
  'money.centsOnDollar': '{cents}¢ on the dollar',
  'money.whatCustomersCharged': 'what the customers were charged',
  'money.rankedOnSurvives': 'Ranked on what survives, not on what they send',
  'money.keptOfBilled': '{pct} of {billed}',
  'money.keptRankHint':
    'Ranked on what you keep rather than what was billed: billed ranks who sends the most work, ' +
    'kept ranks who is worth the most, and only the second changes what you do about it.',
  'money.whatDealReturns': 'What the deal actually returns',
  'money.partsBack': ', parts back',
  'money.keptPctHint':
    'Kept % is what survives of the whole ticket, which is not the headline percentage: a ' +
    'dispatcher who reimburses parts returns that money whole, so the share they keep is smaller ' +
    'than their number suggests.',

  // Technicians
  'money.afterTheSplit': 'What each of them brought in, after the split',
  'money.avgEach': '{amount} avg',
  'money.openTheWeek': 'Open the week to see what they actually did',
  'money.minutes': '{n} min',
  'money.jobsLink': 'jobs',
  'money.techRevenueOnlyHint':
    'Revenue only, deliberately. What a job cost is not broken out per person here: on a short ' +
    'window a technician often has one job, and revenue beside a margin would give away what that ' +
    'job’s parts cost. The booked time answers the same question without it.',

  // Payments
  'money.ofWhatWasTaken': '{pct} of what was taken',
  'money.excludedWarning':
    '{amount} is in the log below but not in the total above: {list}. A partly refunded payment ' +
    'counts for nothing in any total in the system, which is worth knowing before this figure is ' +
    'compared with a bank statement.',
  'money.showingOnly': 'Showing {method} only',
  'money.onlyWentThrough': 'Only payments that went through',
  'money.nothingTaken': 'Nothing was taken in this window.',
  'money.methodAll': 'All',
  'money.deposit': 'deposit',
  'money.paymentsHint':
    'Dated by when the money arrived, not when the invoice was raised. A voided payment keeps its ' +
    'amount here so it can be accounted for, and is struck through because it is in no total.',

  // Jobs behind a figure
  'money.jobsPageTitle': 'Jobs',
  'money.everyJobBehind': 'Every job behind that figure',
  'money.noJobsMatch': 'No finished work matches that.',
  'money.jobsHint':
    'Billed is what the customer was charged; kept is what survives the dispatcher’s share. On ' +
    'split work they are different numbers, and the difference is the whole reason this section ' +
    'exists.',

  // How the money arrived. The enum value is the key and never the label —
  // `CASH` is what the filter and the palette are keyed on.
  'money.method.STRIPE': 'Stripe',
  'money.method.CASH': 'Cash',
  'money.method.CHECK': 'Check',
  'money.method.BANK_TRANSFER': 'Bank transfer',
  'money.method.ZELLE': 'Zelle',
  'money.method.VENMO': 'Venmo',
  'money.method.OTHER': 'Other',

  // What became of a payment. Shown beside the method when it is in no total.
  'money.status.pending': 'pending',
  'money.status.processing': 'processing',
  'money.status.failed': 'failed',
  'money.status.canceled': 'canceled',
  'money.status.voided': 'voided',
  'money.status.refunded': 'refunded',
  'money.status.partially_refunded': 'partly refunded',

  // Expense categories, as JobPocket names them.
  'money.category.MATERIALS': 'Materials',
  'money.category.TOOLS': 'Tools',
  'money.category.FUEL': 'Fuel',
  'money.category.VEHICLE': 'Vehicle',
  'money.category.INSURANCE': 'Insurance',
  'money.category.LICENSE': 'Licence',
  'money.category.MARKETING': 'Marketing',
  'money.category.OFFICE': 'Office',
  'money.category.UTILITIES': 'Utilities',
  'money.category.LABOR': 'Labour',
  'money.category.OTHER': 'Other',

  // How often a standing cost falls due. Reads after an amount: "$400 monthly".
  'money.cadence.WEEKLY': 'weekly',
  'money.cadence.MONTHLY': 'monthly',
  'money.cadence.QUARTERLY': 'quarterly',
  'money.cadence.YEARLY': 'yearly',

  // Plural stems
  'money.partsJob.one': '{n} job carried parts',
  'money.partsJob.few': '{n} jobs carried parts',
  'money.partsJob.many': '{n} jobs carried parts',
  'money.partsJob.other': '{n} jobs carried parts',
  'money.finishedJob.one': '{n} finished job',
  'money.finishedJob.few': '{n} finished jobs',
  'money.finishedJob.many': '{n} finished jobs',
  'money.finishedJob.other': '{n} finished jobs',
  'money.acrossKinds.one': 'across {n} kind',
  'money.acrossKinds.few': 'across {n} kinds',
  'money.acrossKinds.many': 'across {n} kinds',
  'money.acrossKinds.other': 'across {n} kinds',
  'money.voided.one': '{n} voided',
  'money.voided.few': '{n} voided',
  'money.voided.many': '{n} voided',
  'money.voided.other': '{n} voided',
  'money.refunded.one': '{n} refunded',
  'money.refunded.few': '{n} refunded',
  'money.refunded.many': '{n} refunded',
  'money.refunded.other': '{n} refunded',
  'money.partlyRefunded.one': '{n} partly refunded',
  'money.partlyRefunded.few': '{n} partly refunded',
  'money.partlyRefunded.many': '{n} partly refunded',
  'money.partlyRefunded.other': '{n} partly refunded',
  'money.stillPending.one': '{n} still pending',
  'money.stillPending.few': '{n} still pending',
  'money.stillPending.many': '{n} still pending',
  'money.stillPending.other': '{n} still pending',
} as const;
