/**
 * The overview screens, in English.
 *
 * One file per section so the work can be split without two people editing the
 * same object. Keys read as `overview.thing`. Plural stems end in `.one` /
 * `.few` / `.many` / `.other` and are reached through `t.plural` — English
 * needs two of those forms and Ukrainian needs four, so nothing may choose
 * between them with `n === 1`.
 */
export const overview = {
  'overview.title': 'Overview',
  'overview.subtitle': '{range} · compared with the {days} before it',

  // A paid channel with traffic but no cost on file. The sentence carries on
  // into a link, so it ends where the link begins.
  'overview.paidNoSpend':
    '{channels} sent traffic but has no cost recorded for this period, so its cost per lead is blank. Add it under',
  'overview.paidNoSpendLink': 'Spend',

  // The four figures the business is actually run on.
  'overview.requests': 'Service requests',
  'overview.requestsHint': 'forms + answered calls',
  'overview.costPerRequest': 'Cost per request',
  'overview.costPerRequestHint': 'on {amount} spent',
  'overview.noSpend': 'no spend recorded',
  'overview.jobsWon': 'Jobs won',
  'overview.jobsWonHint': '{marked} marked · {invoiced} invoiced',
  'overview.roas': 'Return on ad spend',
  'overview.roasNeeds': 'needs spend + paid jobs',
  'overview.roasHint': 'invoiced money ÷ spend',

  // How many came, and how many asked for something.
  'overview.visits': 'Visits',
  'overview.formLeads': 'Form leads',
  'overview.allClean': 'all clean',
  'overview.calls': 'Phone calls',
  'overview.callsHint': '{n} answered',
  'overview.visitToRequest': 'Visit → request',
  'overview.visitToRequestHint': 'share of visits that ask for service',

  // How the visit itself went — the part a visit count never says.
  'overview.pagesPerVisit': 'Pages per visit',
  'overview.pagesSeen': '{pages} seen',
  'overview.timeOnSite': 'Time on site',
  'overview.timeOnSiteHint': 'average across visits',
  'overview.bounced': 'Bounced',
  'overview.bouncedHint': 'one page, gone inside 5s',
  'overview.engagedVisits': 'Engaged visits',
  'overview.engagedVisitsHint': '15s+, or read more than one page',

  // Charts.
  'overview.panel.visits': 'Visits',
  'overview.panel.visitsSub': 'Bots excluded',
  'overview.series.visits': 'Visits',
  'overview.panel.requests': 'Requests',
  'overview.panel.requestsSub': 'Forms and calls, day by day',
  'overview.series.formLeads': 'Form leads',
  'overview.series.calls': 'Calls',
  'overview.twoChartsHint':
    'Visits and requests are drawn separately on purpose. Put them on one chart and the two scales have to be forced together, which makes the shapes say whatever the scale was chosen to make them say.',
  'overview.panel.money': 'Money',
  'overview.panel.moneySub': 'Ad spend against revenue from won jobs',
  'overview.series.spend': 'Spend',
  'overview.series.invoiced': 'Invoiced',
  'overview.panel.sources': 'Where requests come from',
  'overview.panel.sourcesSub': 'Leads and calls by channel',
  'overview.each': '{amount} each',
  'overview.panel.funnel': 'Funnel',
  'overview.panel.funnelSub': 'Where people stop',

  // The channel table.
  'overview.panel.channels': 'Channels',
  'overview.panel.channelsSub': 'Everything that brought traffic or cost money',
  'overview.noTraffic': 'No traffic recorded in this period yet.',
  'overview.col.channel': 'Channel',
  'overview.col.visits': 'Visits',
  'overview.col.leads': 'Leads',
  'overview.col.calls': 'Calls',
  'overview.col.booked': 'Booked',
  'overview.col.won': 'Won',
  'overview.col.spend': 'Spend',
  'overview.col.costPerRequest': 'Cost / request',
  'overview.col.revenue': 'Revenue',
  'overview.col.roas': 'ROAS',
  'overview.channelsHint':
    'Cost per request divides spend by leads plus answered calls, not by leads alone. Judging a phone-heavy channel on form fills only would make it look several times worse than it is.',

  // Counted things. Four forms declared even where English uses two, because
  // the Ukrainian file is typed against this one.
  'overview.person.one': '{n} person',
  'overview.person.few': '{n} people',
  'overview.person.many': '{n} people',
  'overview.person.other': '{n} people',
  'overview.page.one': '{n} page',
  'overview.page.few': '{n} pages',
  'overview.page.many': '{n} pages',
  'overview.page.other': '{n} pages',
  'overview.dupe.one': '{n} duplicate/spam',
  'overview.dupe.few': '{n} duplicate/spam',
  'overview.dupe.many': '{n} duplicate/spam',
  'overview.dupe.other': '{n} duplicate/spam',
} as const;
