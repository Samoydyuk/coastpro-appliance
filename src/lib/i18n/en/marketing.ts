/**
 * The marketing screens, in English.
 *
 * One file per section so the work can be split without two people editing the
 * same object. Keys read as `marketing.thing`. Plural stems end in `.one` /
 * `.few` / `.many` / `.other` and are reached through `t.plural` — English
 * needs two of those forms and Ukrainian needs four, so nothing may choose
 * between them with `n === 1`.
 */
export const marketing = {
  'marketing.version.one': '{n} version',
  'marketing.version.few': '{n} versions',
  'marketing.version.many': '{n} versions',
  'marketing.version.other': '{n} versions',

  // Channel names. The slugs themselves are JOIN keys and never move; these are
  // only what the reader sees. Most are brand names and are the same word in
  // both languages — they are still listed, so one lookup answers for all of
  // them and nothing on a Ukrainian screen falls back to `CHANNEL_LABELS`.
  'marketing.channel.google_ads': 'Google Ads',
  'marketing.channel.google_lsa': 'Local Services Ads',
  'marketing.channel.google_organic': 'Google organic',
  'marketing.channel.meta_ads': 'Meta Ads',
  'marketing.channel.meta_organic': 'Facebook / Instagram',
  'marketing.channel.bing_ads': 'Microsoft Ads',
  'marketing.channel.bing_organic': 'Bing organic',
  'marketing.channel.tiktok_ads': 'TikTok Ads',
  'marketing.channel.yelp_ads': 'Yelp Ads',
  'marketing.channel.yelp': 'Yelp',
  'marketing.channel.nextdoor': 'Nextdoor',
  'marketing.channel.email': 'Email',
  'marketing.channel.sms': 'SMS',
  'marketing.channel.referral': 'Referral',
  'marketing.channel.organic_other': 'Other organic',
  'marketing.channel.paid_other': 'Other paid',
  'marketing.channel.direct': 'Direct',
  'marketing.channel.internal': 'Internal',
  'marketing.channel.unknown': 'Unknown',

  // Columns, shared across these screens
  'marketing.col.channel': 'Channel',
  'marketing.col.visits': 'Visits',
  'marketing.col.leads': 'Leads',
  'marketing.col.calls': 'Calls',
  'marketing.col.convRate': 'Conv. rate',
  'marketing.col.booked': 'Booked',
  'marketing.col.won': 'Won',
  'marketing.col.closeRate': 'Close rate',
  'marketing.col.spend': 'Spend',
  'marketing.col.costPerRequest': 'Cost / request',
  'marketing.col.costPerJob': 'Cost / job',
  'marketing.col.costPerLead': 'Cost / lead',
  'marketing.col.costPerClick': 'Cost / click',
  'marketing.col.invoiced': 'Invoiced',
  'marketing.col.marked': 'Marked',
  'marketing.col.roas': 'ROAS',
  'marketing.col.revenue': 'Revenue',
  'marketing.col.day': 'Day',
  'marketing.col.campaign': 'Campaign',
  'marketing.col.cost': 'Cost',
  'marketing.col.clicks': 'Clicks',
  'marketing.col.impressions': 'Impressions',
  'marketing.col.source': 'Source',
  'marketing.col.query': 'Query',
  'marketing.col.page': 'Page',
  'marketing.col.shown': 'Shown',
  'marketing.col.clickRate': 'Click rate',
  'marketing.col.position': 'Position',
  'marketing.col.change': 'Change',
  'marketing.col.measure': 'Measure',
  'marketing.col.thisPeriod': 'This period',
  'marketing.col.started': 'Started',
  'marketing.col.rows': 'Rows',
  'marketing.col.outcome': 'Outcome',
  'marketing.col.finished': 'Finished',
  'marketing.col.fault': 'Fault',
  'marketing.col.codes': 'Codes',
  'marketing.col.photos': 'Photos',

  // Shared words
  'marketing.any': 'Any',
  'marketing.action.apply': 'Apply',
  'marketing.action.clear': 'Clear',
  'marketing.action.save': 'Save',
  'marketing.action.close': 'Close',
  'marketing.msg.saved': 'Saved.',
  'marketing.msg.couldNotSave': 'Could not save.',
  'marketing.msg.noServer': 'Could not reach the server.',

  // "3d ago", in words rather than through `relativeTime`, which takes no
  // language. Short forms on purpose: these sit inside a subtitle.
  'marketing.ago.s': '{n}s ago',
  'marketing.ago.m': '{n}m ago',
  'marketing.ago.h': '{n}h ago',
  'marketing.ago.d': '{n}d ago',

  // Channels
  'marketing.channels.title': 'Channels',
  'marketing.channels.creditThe': 'Credit the',
  'marketing.channels.lastClick': 'Last click',
  'marketing.channels.firstClick': 'First click',
  'marketing.channels.attributionHint':
    'Last click credits whichever channel was in play when the person got in touch. First ' +
    'click credits whatever introduced them, which is often weeks earlier — usually an ad, ' +
    'even when the visit that converted came from a Google search for the business name. ' +
    'Switching between the two is the fastest way to see which channels are being quietly ' +
    'underpaid by the ad platforms’ own reporting.',
  'marketing.channels.spend': 'Spend',
  'marketing.channels.spendSub': 'Where the money went',
  'marketing.channels.noSpendBefore': 'No spend recorded for this period.',
  'marketing.channels.noSpendLink': 'Add it',
  'marketing.channels.noSpendAfter': ' to unlock cost per lead and ROAS.',
  'marketing.channels.revenue': 'Revenue',
  'marketing.channels.revenueSub': 'Invoiced in JobPocket, for work that began as an enquiry',
  'marketing.channels.noWon': 'No won jobs with a value recorded yet.',
  'marketing.channels.every': 'Every channel',
  'marketing.channels.everySub': 'Traffic, requests, cost and what came back',
  'marketing.channels.nothing': 'Nothing recorded in this period.',
  'marketing.channels.inside': 'Inside the channels',
  'marketing.channels.insideSub': 'The same numbers, one level down',
  'marketing.channels.group.campaign': 'Campaign',
  'marketing.channels.group.content': 'Ad / creative',
  'marketing.channels.group.term': 'Keyword',
  'marketing.channels.untagged': 'Nothing tagged at this level yet.',
  'marketing.channels.taggingHintBefore':
    'Keyword and creative rows only appear for traffic that arrived tagged. Google Ads ' +
    'auto-tagging supplies the click id but not the keyword, so add ',
  'marketing.channels.taggingHintAfter':
    ' to the tracking template if you want this level filled in.',

  // Ad spend
  'marketing.spend.title': 'Ad spend',
  'marketing.spend.spent': 'Spent',
  'marketing.spend.costPerRequest': 'Cost per request',
  'marketing.spend.costPerRequestHint': '{n} leads + calls',
  'marketing.spend.costPerJob': 'Cost per job',
  'marketing.spend.costPerJobHint': '{n} won',
  'marketing.spend.return': 'Return',
  'marketing.spend.returnHint': '{amount} invoiced',
  'marketing.spend.add': 'Add spend',
  'marketing.spend.addSub': 'One row per day per campaign — saving again overwrites it',
  'marketing.spend.addHint':
    'Take the figures straight off the platform’s own reporting. Entering campaign-level rows ' +
    'is optional but it is what makes the per-campaign cost per lead work; leave the campaign ' +
    'blank to record a whole channel’s daily total.',
  'marketing.spend.vsRevenue': 'Spend against revenue',
  'marketing.spend.daily': 'Daily',
  'marketing.spend.seriesSpend': 'Spend',
  'marketing.spend.seriesRevenue': 'Revenue from won jobs',
  'marketing.spend.chartHint':
    'Revenue is dated to when the lead arrived, not when the invoice was paid — so a recent ' +
    'day can look thin simply because those jobs have not been done yet.',
  'marketing.spend.recorded': 'Recorded spend',
  'marketing.spend.nothing': 'Nothing recorded for this period.',
  'marketing.spend.source.manual': 'Manual',
  'marketing.spend.campaignOptional': 'Campaign (optional)',
  'marketing.spend.campaignPlaceholder': 'Leave blank for the whole channel',

  // Search
  'marketing.search.title': 'Search',
  'marketing.search.dataThrough': ' · Google has data through {day}',
  'marketing.search.held': 'held',
  'marketing.search.up': 'up {n}',
  'marketing.search.down': 'down {n}',
  'marketing.search.new': 'new',
  'marketing.search.nothingYet': 'Nothing recorded for this period yet.',
  'marketing.search.laggedAll':
    'Google reports search data two to three days late, and this range is almost entirely ' +
    'inside that gap — the near-zero figures below are the lag, not a collapse in traffic. ' +
    'Pick a wider range to see anything meaningful.',
  'marketing.search.laggedEdge':
    'The last two or three days of this range are still filling in. Google restates them as ' +
    'it finalises, so the right-hand edge of the chart will rise over the next few days.',
  'marketing.search.notConnectedBefore':
    'Search Console is not connected, so none of this has any numbers behind it yet. Connect it on ',
  'marketing.search.notConnectedLink': 'Presence',
  'marketing.search.notConnectedAfter': '.',
  'marketing.search.timesShown': 'Times shown',
  'marketing.search.timesShownHint': 'appearances in search results',
  'marketing.search.clicksFrom': 'Clicks from search',
  'marketing.search.clicksHint': 'people who chose us',
  'marketing.search.avgPosition': 'Average position',
  'marketing.search.avgPositionHint': 'weighted by how often each query ran',
  'marketing.search.clickRateHint': '{queries} shown but never clicked',
  'marketing.search.shownAndClicked': 'Shown and clicked',
  'marketing.search.shownAndClickedSub': 'Day by day, straight from Google',
  'marketing.search.noDays': 'No days imported yet.',
  'marketing.search.restatesHint':
    'Google restates the last few days as it finalises them, so the right-hand edge of this ' +
    'chart moves for about seventy-two hours after it first appears.',
  'marketing.search.nearly': 'Closest to the first page',
  'marketing.search.nearlySub': 'Real volume, positions 4 to 25 — where a small push pays',
  'marketing.search.nearlyHint':
    'These are already ranking, just not high enough to be chosen. Almost all clicks go to the ' +
    'first page, so a query sitting at 12 with a few hundred impressions is worth far more ' +
    'attention than a new page targeting a query the site has never appeared for at all.',
  'marketing.search.every': 'Every query',
  'marketing.search.everySub': 'What people typed, most shown first',
  'marketing.search.everyHint':
    'Google withholds queries used by too few people to stay anonymous, which is why these ' +
    'rarely add up to the totals above. The gap is real traffic, not a fault.',
  'marketing.search.pages': 'Pages earning impressions',
  'marketing.search.pagesSub': 'Which addresses search actually shows',
  'marketing.search.pagesHint':
    'A page published and never listed here is a page Google has not found worth showing for ' +
    'anything — a different problem from one shown often and clicked rarely.',
  'marketing.search.fetch': 'Fetch from Google',
  'marketing.search.fetching': 'Fetching…',
  'marketing.search.refreshFailed': 'Refresh failed.',
  'marketing.search.nothingToFetch': 'Nothing to fetch.',
  'marketing.search.rowsWritten': '{rows} written',
  'marketing.search.heldThrough': 'Held through {day}; refreshed nightly.',
  'marketing.search.nothingImported': 'Nothing imported yet.',

  // Presence
  'marketing.presence.title': 'Presence',
  'marketing.presence.source.gbp_api': 'fetched from Google',
  'marketing.presence.source.meta_api': 'fetched from Meta',
  'marketing.presence.source.manual_entry': 'typed in',
  'marketing.presence.connections': 'Connected accounts',
  'marketing.presence.connectionsSub':
    'Connecting an account is a click; registering the app with Google and Meta is a one-time ' +
    'job in their developer consoles',
  'marketing.presence.googleSetup':
    'Set GBP_CLIENT_ID and GBP_CLIENT_SECRET first — those register the app itself.',
  'marketing.presence.searchConsoleSetup':
    'Uses the same GBP_CLIENT_ID and GBP_CLIENT_SECRET, and needs the Search Console API ' +
    'switched on in the same Google Cloud project.',
  'marketing.presence.metaSetup':
    'Set META_APP_ID and META_APP_SECRET first — those register the app itself.',
  'marketing.presence.serviceAccount':
    '{email} — add this address in Search Console under Settings → Users and permissions',
  'marketing.presence.connectedFallback': 'Connected',
  'marketing.presence.noneYet':
    'No listing has reported yet. Google, Instagram and Facebook fill themselves in once their ' +
    'accounts are connected above; Yelp and Apple are entered by hand.',
  'marketing.presence.nothingFetched': 'Nothing fetched yet',
  'marketing.presence.nothingEntered': 'Nothing entered yet',
  'marketing.presence.through': ' · through {day}',
  'marketing.presence.staleAuto':
    'No new rows for {days} — the importer may have stopped or the credentials may have lapsed.',
  'marketing.presence.staleManual':
    'Last entered {days} ago. These numbers are older than the range above.',
  'marketing.presence.emptyRange':
    'Nothing for this range. It will fill in once the importer has credentials.',
  'marketing.presence.runs': 'Importer runs',
  'marketing.presence.runsSub':
    'An importer that quietly stopped looks exactly like a quiet month',
  'marketing.presence.noRuns': 'No importer has run yet.',
  'marketing.presence.ok': 'ok',
  'marketing.presence.running': 'running',
  'marketing.presence.footHint':
    'Nothing here is added to leads or calls. A tap on Google’s call button and a phone that ' +
    'actually rang are two different events, and the same customer often causes both.',
  'marketing.presence.notConnected': 'Not connected',
  'marketing.presence.key': 'Key',
  'marketing.presence.reconnect': 'Reconnect',
  'marketing.presence.connect': 'Connect',
  'marketing.presence.disconnect': 'Disconnect',
  'marketing.presence.disconnectConfirm':
    'Disconnect {label}? The importer stops until it is connected again.',
  'marketing.presence.refreshFetched': 'Refresh fetched',
  'marketing.presence.working': 'Working…',
  'marketing.presence.enterByHand': 'Enter by hand',
  'marketing.presence.listing': 'Listing',
  'marketing.presence.savedDay': 'Saved {channel} for {day}.',
  'marketing.presence.blankZero': 'Blank counts as zero. Sending the same day again replaces it.',
  'marketing.presence.saveDay': 'Save day',
  'marketing.presence.saving': 'Saving…',
  'marketing.presence.refreshFailed': 'Refresh failed.',
  'marketing.presence.nothingToFetch': 'Nothing to fetch.',

  // The presence catalogue lives beside the importers, in
  // `lib/presence/store.ts`, so its labels are answered here by channel and
  // measure. Anything the catalogue gains later falls back to its own English.
  'marketing.presence.measure.google_business.impressions': 'Views',
  'marketing.presence.hint.google_business.impressions': 'Search and Maps, desktop and mobile',
  'marketing.presence.measure.google_business.calls': 'Calls',
  'marketing.presence.measure.google_business.directions': 'Directions',
  'marketing.presence.measure.google_business.clicks': 'Website clicks',
  'marketing.presence.measure.google_business.bookings': 'Bookings',
  'marketing.presence.measure.google_business.conversations': 'Messages',
  'marketing.presence.measure.apple_maps.impressions': 'Views',
  'marketing.presence.measure.apple_maps.calls': 'Taps to call',
  'marketing.presence.measure.apple_maps.directions': 'Directions',
  'marketing.presence.measure.apple_maps.clicks': 'Website taps',
  'marketing.presence.measure.yelp_profile.impressions': 'Page views',
  'marketing.presence.measure.yelp_profile.leads': 'Leads',
  'marketing.presence.measure.yelp_profile.calls': 'Calls',
  'marketing.presence.measure.yelp_profile.clicks': 'Website clicks',
  'marketing.presence.measure.yelp_profile.reviews': 'Reviews',
  'marketing.presence.hint.yelp_profile.reviews': 'Total on the profile, not new ones',
  'marketing.presence.measure.instagram.impressions': 'Impressions',
  'marketing.presence.measure.instagram.reach': 'Reach',
  'marketing.presence.hint.instagram.reach': 'People, not views',
  'marketing.presence.measure.instagram.profileViews': 'Profile views',
  'marketing.presence.measure.instagram.clicks': 'Website taps',
  'marketing.presence.measure.instagram.followers': 'Followers',
  'marketing.presence.hint.instagram.followers': 'Total on the day, not new ones',
  'marketing.presence.measure.facebook.impressions': 'Impressions',
  'marketing.presence.measure.facebook.reach': 'Reach',
  'marketing.presence.measure.facebook.profileViews': 'Page views',
  'marketing.presence.measure.facebook.clicks': 'Website clicks',
  'marketing.presence.measure.facebook.followers': 'Followers',
  'marketing.presence.reason.apple_maps':
    'Apple’s API is for chains and aggregators; a single place card reports only in the dashboard.',
  'marketing.presence.reason.yelp_profile':
    'The Fusion API returns public business data, not owner analytics. These live only in Yelp for Business.',

  // Marketing: the list of released jobs
  'marketing.jobs.title': 'Marketing',
  'marketing.jobs.none': 'No released jobs yet',
  'marketing.jobs.releasedCount': '{jobs} released for content',
  'marketing.jobs.houseVoice': 'House voice',
  'marketing.jobs.emptyState':
    'Nothing here yet. A finished job appears once it is switched on for the website — the ' +
    'toggle is at the bottom of the Complete Job sheet in the app, and photos have their own ' +
    'switch in the job’s photo list. Both are off by default, which is why this page starts ' +
    'empty rather than full.',
  'marketing.jobs.search': 'Search',
  'marketing.jobs.searchPlaceholder': 'Fault, repair, model',
  'marketing.jobs.appliance': 'Appliance',
  'marketing.jobs.brand': 'Brand',
  'marketing.jobs.town': 'Town',
  'marketing.jobs.errorCode': 'Error code',
  'marketing.jobs.content': 'Content',
  'marketing.jobs.status.none': 'Nothing written',
  'marketing.jobs.status.draft': 'Draft',
  'marketing.jobs.status.generated': 'Generated',
  'marketing.jobs.status.edited': 'Edited',
  'marketing.jobs.status.published': 'Published',
  'marketing.jobs.status.skipped': 'Skipped',
  'marketing.jobs.noMatch': 'No released jobs match this filter.',
  'marketing.jobs.newer': '← Newer',
  'marketing.jobs.older': 'Older →',
  'marketing.jobs.listHint':
    'This list is a copy of what JobPocket is willing to publish, and that is all it can ever ' +
    'be: no customer name, phone, email or street address is sent, and none of those columns ' +
    'exist here to put one in. Location is the town and nothing finer.',
  'marketing.jobs.refresh': 'Refresh from JobPocket',
  'marketing.jobs.reading': 'Reading…',
  'marketing.jobs.readFailed': 'Could not read from JobPocket.',
  'marketing.jobs.refreshResult': '{jobs}, {photos}',
  'marketing.jobs.lastRead': 'Last read {when}',

  // Marketing: one job
  'marketing.job.back': '← Marketing',
  'marketing.job.repairFallback': 'Repair',
  'marketing.job.model': 'Model {model}',
  'marketing.job.unreleased':
    'This job has been taken off the website list in the app. It is still here because ' +
    'something has been written from it — but nothing new should be, and anything already ' +
    'published from it is worth taking down.',
  'marketing.job.similarLead': 'Something has already been written about {jobs}:',
  'marketing.job.similarTail':
    '. Worth a look before writing another — two pages about the same fault compete with each ' +
    'other for the search that matters. Not a reason not to: the second one may be the better page.',
  'marketing.job.live': ' (live)',
  'marketing.job.theRepair': 'The repair',
  'marketing.job.whatWasWrong': 'What was wrong',
  'marketing.job.whatWasDone': 'What was done',
  'marketing.job.techNote': 'Technician’s note for the website',
  'marketing.job.nothingWritten':
    'Nothing was written on this job. An article can still be built from the appliance, the ' +
    'brand and the parts — but it will be a thin one.',
  'marketing.job.redacted':
    'Removed before this left JobPocket: {fields}. The text above is what remains — a phone ' +
    'number or a name the technician typed never reached this server, and the labels are here ' +
    'so that is visible rather than assumed.',
  'marketing.job.parts': 'Parts replaced',
  'marketing.job.noParts': 'No parts recorded with a number.',
  'marketing.job.content': 'Content',
  'marketing.job.contentSub': 'Written from the fields above and nothing else. Every piece is a draft.',
  'marketing.job.photos': 'Photos',
  'marketing.job.photosSub': '{photos} released · tap to choose',
  'marketing.job.noPhotos':
    'No photos released for this job. A picture has its own switch in the app — off until ' +
    'somebody turns it on, because no field filter can see a house number or a face in an image.',
  'marketing.job.photosHint':
    'Served through this console rather than from storage, so the location the camera wrote ' +
    'into the file is stripped on the way and the key never reaches the browser.',

  // House voice, and the pieces it applies to
  'marketing.voice.title': 'House voice',
  'marketing.voice.subtitle':
    'Applies to every channel. Changing it changes the next draft, not the ones already written.',
  'marketing.voice.whatGets': 'What gets written',
  'marketing.voice.hint':
    'Each draft is built from an outline assembled out of the fields that job actually has. A ' +
    'repair with no diagnosis recorded does not get a “what we found” section written from ' +
    'guesswork — it gets an outline with no such section in it.',
  'marketing.piece.article': 'Article',
  'marketing.piece.instagram': 'Instagram',
  'marketing.piece.facebook': 'Facebook',
  'marketing.piece.google_business': 'Google Business',
  'marketing.piece.short': 'Short version',
  'marketing.brief.article':
    'A page on the shop’s own website about this repair. Its reader arrived from a search for ' +
    'the same symptom and wants to know what the fault usually turns out to be, whether it is ' +
    'fixable, and roughly what happens next.',
  'marketing.brief.instagram':
    'A caption for a photo of this repair. Opens with the specific thing that was wrong, not ' +
    'with a question or a hook. Hashtags on their own last line, at most six, all of them ' +
    'either the appliance, the brand, the fault or the town.',
  'marketing.brief.facebook':
    'A post for the shop’s page. Reads like the owner wrote it between jobs: what came in, ' +
    'what it turned out to be, what was done. No hashtags.',
  'marketing.brief.google_business':
    'A Google Business Profile update. Local and concrete — the town and the appliance in the ' +
    'first sentence, because that is what the listing is being read for.',
  'marketing.brief.short':
    'Two sentences that can sit under a photo anywhere: what was wrong, what was done. No call ' +
    'to action, no hashtags.',

  // Plurals. English needs two forms; Ukrainian needs four.
  'marketing.plural.piece.one': '{n} piece',
  'marketing.plural.piece.few': '{n} pieces',
  'marketing.plural.piece.many': '{n} pieces',
  'marketing.plural.piece.other': '{n} pieces',
  'marketing.plural.photo.one': '{n} photo',
  'marketing.plural.photo.few': '{n} photos',
  'marketing.plural.photo.many': '{n} photos',
  'marketing.plural.photo.other': '{n} photos',
  'marketing.plural.query.one': '{n} query',
  'marketing.plural.query.few': '{n} queries',
  'marketing.plural.query.many': '{n} queries',
  'marketing.plural.query.other': '{n} queries',
  'marketing.plural.row.one': '{n} row',
  'marketing.plural.row.few': '{n} rows',
  'marketing.plural.row.many': '{n} rows',
  'marketing.plural.row.other': '{n} rows',
  'marketing.plural.finishedJob.one': '{n} finished job',
  'marketing.plural.finishedJob.few': '{n} finished jobs',
  'marketing.plural.finishedJob.many': '{n} finished jobs',
  'marketing.plural.finishedJob.other': '{n} finished jobs',
  'marketing.plural.similarJob.one': '{n} similar job',
  'marketing.plural.similarJob.few': '{n} similar jobs',
  'marketing.plural.similarJob.many': '{n} similar jobs',
  'marketing.plural.similarJob.other': '{n} similar jobs',
} as const;
