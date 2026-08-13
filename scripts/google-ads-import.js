/**
 * CoastPro Appliance Repair — Google Ads → coastpro.us statistics importer.
 *
 * Paste this whole file into Google Ads → Tools & Settings → Bulk actions →
 * Scripts → "+" → Ads Script. Change the two constants directly below,
 * click "Authorise", then "Preview" once, then schedule it Daily.
 *
 * It reads nine reports and POSTs them to /api/ingest/ad-stats in batches.
 * Every run re-fetches a rolling window of recent days, because Google
 * restates the last few days after the fact; the endpoint upserts, so a
 * re-sent day overwrites rather than accumulates.
 */

// ─────────────────────────────────────────────────────────────────────────────
// EDIT THESE TWO, NOTHING ELSE.
// ─────────────────────────────────────────────────────────────────────────────
const ENDPOINT = 'https://coastpro.us/api/ingest/ad-stats';
const SECRET   = 'PASTE_THE_VALUE_OF_AD_STATS_INGEST_SECRET_HERE';
// ─────────────────────────────────────────────────────────────────────────────

const API_VERSION   = 'v25';   // Ads Scripts rejects sunsetted versions.
const LOOKBACK_DAYS = 14;      // Rolling re-fetch window, including today.
const BATCH_ROWS    = 500;     // Endpoint hard-caps a batch at 5000.
const CHANNEL       = 'google_ads';
const SOURCE        = 'google_ads_script';

// change_event is only retained by Google for 30 days and the query must carry
// a LIMIT of at most 10000.
const CHANGE_MAX_DAYS = 25;
const CHANGE_LIMIT    = 10000;

function main() {
  const account  = AdsApp.currentAccount();
  const timeZone = account.getTimeZone();
  const currency = account.getCurrencyCode();

  const dayTo   = dayString(0, timeZone);
  const dayFrom = dayString(LOOKBACK_DAYS - 1, timeZone);

  Logger.log('Account %s (%s), time zone %s, currency %s',
             account.getCustomerId(), account.getName(), timeZone, currency);
  Logger.log('Window %s .. %s (account time zone)', dayFrom, dayTo);
  if (timeZone !== 'America/Los_Angeles') {
    Logger.log('WARNING: account time zone is %s, not America/Los_Angeles. ' +
               'Google cuts its reporting days in the account time zone while ' +
               'the console cuts its days in California time, so every ' +
               'cost-per-lead will be misaligned by the offset.', timeZone);
  }

  const rows = [];
  const report = {};

  runReport(report, 'campaign',          function () { return campaignDaily(dayFrom, dayTo, rows); });
  runReport(report, 'conversion_action', function () { return conversionActions(dayFrom, dayTo, rows); });
  runReport(report, 'search_term',       function () { return searchTerms(dayFrom, dayTo, rows); });
  runReport(report, 'keyword',           function () { return keywords(dayFrom, dayTo, rows); });
  runReport(report, 'geo',               function () { return geography(dayFrom, dayTo, rows); });
  runReport(report, 'device',            function () { return devices(dayFrom, dayTo, rows); });
  runReport(report, 'hour',              function () { return hours(dayFrom, dayTo, rows); });
  runReport(report, 'call',              function () { return calls(dayFrom, dayTo, rows, timeZone); });
  runReport(report, 'change',            function () { return changes(rows, timeZone); });

  Logger.log('Collected %s rows: %s', rows.length, JSON.stringify(report));
  post(rows, dayFrom, dayTo);
}

/** Runs one report, and keeps going if it fails — a broken report must not cost us the other eight. */
function runReport(tally, name, fn) {
  try {
    tally[name] = fn();
  } catch (e) {
    tally[name] = 'FAILED: ' + e;
    Logger.log('Report "%s" failed and was skipped: %s', name, e);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Reports
// ─────────────────────────────────────────────────────────────────────────────

/**
 * The canonical campaign row. Deliberately unsegmented, so its cost always
 * reconciles exactly to what Google billed, and so the endpoint can mirror it
 * into ad_spend (it only mirrors level='campaign' with an empty segment).
 */
function campaignDaily(from, to, out) {
  const q =
    'SELECT segments.date, campaign.id, campaign.name, campaign.status, ' +
    '  campaign.advertising_channel_type, campaign.bidding_strategy_type, ' +
    '  campaign_budget.amount_micros, ' +
    '  metrics.impressions, metrics.clicks, metrics.cost_micros, ' +
    '  metrics.conversions, metrics.conversions_value, metrics.all_conversions, ' +
    '  metrics.average_cpc, metrics.ctr, ' +
    '  metrics.search_impression_share, ' +
    '  metrics.search_budget_lost_impression_share, ' +
    '  metrics.search_rank_lost_impression_share, ' +
    '  metrics.search_absolute_top_impression_share, ' +
    '  metrics.phone_calls, metrics.phone_impressions, metrics.phone_through_rate ' +
    'FROM campaign ' +
    "WHERE segments.date BETWEEN '" + from + "' AND '" + to + "'";

  let n = 0;
  eachRow(q, function (r) {
    out.push({
      day:        r['segments.date'],
      channel:    CHANNEL,
      level:      'campaign',
      entityId:   str(r['campaign.id']),
      entityName: str(r['campaign.name']),
      segment:    '',
      impressions:          num(r['metrics.impressions']),
      clicks:               num(r['metrics.clicks']),
      costCents:            micros2cents(r['metrics.cost_micros']),
      conversions:          num(r['metrics.conversions']),
      conversionValueCents: Math.round(num(r['metrics.conversions_value']) * 100),
      extra: {
        status:            str(r['campaign.status']),
        channelType:       str(r['campaign.advertising_channel_type']),
        biddingStrategy:   str(r['campaign.bidding_strategy_type']),
        budgetCents:       micros2cents(r['campaign_budget.amount_micros']),
        allConversions:    num(r['metrics.all_conversions']),
        avgCpcCents:       micros2cents(r['metrics.average_cpc']),
        ctr:               frac(r['metrics.ctr']),
        // Kept apart on purpose. Budget-lost says raise tomorrow's budget;
        // rank-lost says raise the bid or fix the ad. Both are 0..1 fractions.
        searchImprShare:           frac(r['metrics.search_impression_share']),
        searchBudgetLostImprShare: frac(r['metrics.search_budget_lost_impression_share']),
        searchRankLostImprShare:   frac(r['metrics.search_rank_lost_impression_share']),
        searchAbsTopImprShare:     frac(r['metrics.search_absolute_top_impression_share']),
        phoneCalls:       num(r['metrics.phone_calls']),
        phoneImpressions: num(r['metrics.phone_impressions']),
        phoneThroughRate: frac(r['metrics.phone_through_rate'])
      }
    });
    n++;
  });
  return n;
}

/**
 * What Google accepted and attributed, per conversion action. This is the only
 * way to see whether the "Won job" upload actually landed.
 *
 * NOTE: segments.conversion_action_name cannot be selected alongside
 * metrics.cost_micros, metrics.clicks or metrics.impressions — the API refuses
 * it. These rows therefore carry conversions only, and must never be summed
 * with the campaign rows above.
 */
function conversionActions(from, to, out) {
  const q =
    'SELECT segments.date, campaign.id, campaign.name, ' +
    '  segments.conversion_action_name, segments.conversion_action_category, ' +
    '  metrics.conversions, metrics.all_conversions, ' +
    '  metrics.conversions_value, metrics.all_conversions_value, ' +
    '  metrics.view_through_conversions ' +
    'FROM campaign ' +
    "WHERE segments.date BETWEEN '" + from + "' AND '" + to + "'";

  let n = 0;
  eachRow(q, function (r) {
    const action = str(r['segments.conversion_action_name']);
    out.push({
      day:        r['segments.date'],
      channel:    CHANNEL,
      level:      'campaign',
      entityId:   str(r['campaign.id']),
      entityName: str(r['campaign.name']),
      // Prefixed so these never collide with, and are never mistaken for, the
      // unsegmented campaign rows.
      segment:    'conv:' + action,
      impressions: 0,
      clicks:      0,
      costCents:   0,
      conversions:          num(r['metrics.conversions']),
      conversionValueCents: Math.round(num(r['metrics.conversions_value']) * 100),
      extra: {
        conversionAction:     action,
        conversionCategory:   str(r['segments.conversion_action_category']),
        allConversions:       num(r['metrics.all_conversions']),
        allConversionsValue:  num(r['metrics.all_conversions_value']),
        viewThroughConv:      num(r['metrics.view_through_conversions']),
        costIsNotAvailable:   true
      }
    });
    n++;
  });
  return n;
}

/** What people actually typed. The negative-keyword list comes out of this. */
function searchTerms(from, to, out) {
  const q =
    'SELECT segments.date, campaign.id, campaign.name, ad_group.id, ad_group.name, ' +
    '  search_term_view.search_term, search_term_view.status, ' +
    '  segments.keyword.info.text, segments.keyword.info.match_type, ' +
    '  segments.search_term_match_type, ' +
    '  metrics.impressions, metrics.clicks, metrics.cost_micros, ' +
    '  metrics.conversions, metrics.conversions_value ' +
    'FROM search_term_view ' +
    "WHERE segments.date BETWEEN '" + from + "' AND '" + to + "'";

  let n = 0;
  eachRow(q, function (r) {
    out.push({
      day:        r['segments.date'],
      channel:    CHANNEL,
      level:      'search_term',
      entityId:   str(r['search_term_view.search_term']).slice(0, 300),
      entityName: str(r['search_term_view.search_term']).slice(0, 300),
      parentName: str(r['campaign.name']),
      // The same term can be bought by two ad groups on the same day, and the
      // primary key is (day, channel, level, entity_id, segment) — without a
      // disambiguator here one would silently overwrite the other.
      segment:    (str(r['ad_group.id']) + '|' + str(r['segments.keyword.info.match_type'])).slice(0, 120),
      impressions:          num(r['metrics.impressions']),
      clicks:               num(r['metrics.clicks']),
      costCents:            micros2cents(r['metrics.cost_micros']),
      conversions:          num(r['metrics.conversions']),
      conversionValueCents: Math.round(num(r['metrics.conversions_value']) * 100),
      extra: {
        campaignId:     str(r['campaign.id']),
        adGroupId:      str(r['ad_group.id']),
        adGroupName:    str(r['ad_group.name']),
        matchedKeyword: str(r['segments.keyword.info.text']),
        keywordMatch:   str(r['segments.keyword.info.match_type']),
        termMatch:      str(r['segments.search_term_match_type']),
        termStatus:     str(r['search_term_view.status'])
      }
    });
    n++;
  });
  return n;
}

/**
 * Keywords, with the Quality Score components. Imported daily because Google
 * keeps no history for them — a daily snapshot is the only way to ever see
 * that landing-page experience dropped the week the homepage changed.
 */
function keywords(from, to, out) {
  const q =
    'SELECT segments.date, campaign.id, campaign.name, ad_group.id, ad_group.name, ' +
    '  ad_group_criterion.criterion_id, ad_group_criterion.keyword.text, ' +
    '  ad_group_criterion.keyword.match_type, ad_group_criterion.status, ' +
    '  ad_group_criterion.effective_cpc_bid_micros, ' +
    '  metrics.historical_quality_score, metrics.historical_creative_quality_score, ' +
    '  metrics.historical_landing_page_quality_score, metrics.historical_search_predicted_ctr, ' +
    '  metrics.impressions, metrics.clicks, metrics.cost_micros, ' +
    '  metrics.conversions, metrics.conversions_value, ' +
    '  metrics.search_impression_share, metrics.search_budget_lost_impression_share, ' +
    '  metrics.search_rank_lost_impression_share ' +
    'FROM keyword_view ' +
    "WHERE segments.date BETWEEN '" + from + "' AND '" + to + "'";

  let n = 0;
  eachRow(q, function (r) {
    out.push({
      day:        r['segments.date'],
      channel:    CHANNEL,
      level:      'keyword',
      // Criterion ids are only unique within an ad group; this pair is the
      // keyword's real identity.
      entityId:   str(r['ad_group.id']) + '~' + str(r['ad_group_criterion.criterion_id']),
      entityName: str(r['ad_group_criterion.keyword.text']),
      parentName: str(r['campaign.name']),
      segment:    '',
      impressions:          num(r['metrics.impressions']),
      clicks:               num(r['metrics.clicks']),
      costCents:            micros2cents(r['metrics.cost_micros']),
      conversions:          num(r['metrics.conversions']),
      conversionValueCents: Math.round(num(r['metrics.conversions_value']) * 100),
      extra: {
        campaignId:   str(r['campaign.id']),
        adGroupId:    str(r['ad_group.id']),
        adGroupName:  str(r['ad_group.name']),
        matchType:    str(r['ad_group_criterion.keyword.match_type']),
        status:       str(r['ad_group_criterion.status']),
        cpcBidCents:  micros2cents(r['ad_group_criterion.effective_cpc_bid_micros']),
        qualityScore:      num(r['metrics.historical_quality_score']),
        qsAdRelevance:     str(r['metrics.historical_creative_quality_score']),
        qsLandingPage:     str(r['metrics.historical_landing_page_quality_score']),
        qsExpectedCtr:     str(r['metrics.historical_search_predicted_ctr']),
        searchImprShare:           frac(r['metrics.search_impression_share']),
        searchBudgetLostImprShare: frac(r['metrics.search_budget_lost_impression_share']),
        searchRankLostImprShare:   frac(r['metrics.search_rank_lost_impression_share'])
      }
    });
    n++;
  });
  return n;
}

/**
 * Where the searcher physically was. user_location_view, not geographic_view,
 * because "presence" is what decides whether the van can get there.
 *
 * user_location_view is one row per country until a geo segment is added;
 * segments.geo_target_city is what makes it a city report.
 */
function geography(from, to, out) {
  const q =
    'SELECT segments.date, campaign.id, campaign.name, ' +
    '  segments.geo_target_city, user_location_view.targeting_location, ' +
    '  metrics.impressions, metrics.clicks, metrics.cost_micros, ' +
    '  metrics.conversions, metrics.conversions_value ' +
    'FROM user_location_view ' +
    "WHERE segments.date BETWEEN '" + from + "' AND '" + to + "'";

  const collected = [];
  const ids = {};
  eachRow(q, function (r) {
    const raw = str(r['segments.geo_target_city']);
    const id  = geoId(raw);
    if (id) ids[id] = true;
    collected.push({ r: r, raw: raw, id: id });
  });

  const names = resolveGeoNames(Object.keys(ids));

  let n = 0;
  for (let i = 0; i < collected.length; i++) {
    const r   = collected[i].r;
    const id  = collected[i].id;
    const raw = collected[i].raw;
    // If resolveGeoNames already handed back a name, `id` is empty and the raw
    // value is the name.
    const name = names[id] || (id ? id : raw);
    out.push({
      day:        r['segments.date'],
      channel:    CHANNEL,
      level:      'geo',
      entityId:   (id || raw || 'unknown').slice(0, 300),
      entityName: String(name).slice(0, 300),
      parentName: str(r['campaign.name']),
      // Same city, two campaigns, one day would otherwise collide.
      segment:    str(r['campaign.id']).slice(0, 120),
      impressions:          num(r['metrics.impressions']),
      clicks:               num(r['metrics.clicks']),
      costCents:            micros2cents(r['metrics.cost_micros']),
      conversions:          num(r['metrics.conversions']),
      conversionValueCents: Math.round(num(r['metrics.conversions_value']) * 100),
      extra: {
        campaignId:       str(r['campaign.id']),
        geoTargetCity:    raw,
        wasTargeted:      String(r['user_location_view.targeting_location']) === 'true'
      }
    });
    n++;
  }
  return n;
}

/** Pulls "geoTargetConstants/1014044" (or a bare id) down to "1014044". */
function geoId(raw) {
  if (!raw) return '';
  const slash = raw.lastIndexOf('/');
  const tail  = slash >= 0 ? raw.substring(slash + 1) : raw;
  return /^\d+$/.test(tail) ? tail : '';
}

/** Turns geo target constant ids into city names. Best-effort. */
function resolveGeoNames(ids) {
  const names = {};
  if (!ids.length) return names;
  for (let start = 0; start < ids.length; start += 200) {
    const chunk = ids.slice(start, start + 200);
    try {
      eachRow(
        'SELECT geo_target_constant.id, geo_target_constant.name, ' +
        '  geo_target_constant.canonical_name ' +
        'FROM geo_target_constant ' +
        'WHERE geo_target_constant.id IN (' + chunk.join(',') + ')',
        function (r) {
          names[str(r['geo_target_constant.id'])] =
            str(r['geo_target_constant.canonical_name']) || str(r['geo_target_constant.name']);
        }
      );
    } catch (e) {
      Logger.log('Could not resolve geo names (ids kept instead): %s', e);
    }
  }
  return names;
}

/** Mobile vs desktop vs tablet. A quarterly decision, so it is only three rows. */
function devices(from, to, out) {
  const q =
    'SELECT segments.date, segments.device, campaign.id, campaign.name, ' +
    '  metrics.impressions, metrics.clicks, metrics.cost_micros, ' +
    '  metrics.conversions, metrics.conversions_value ' +
    'FROM campaign ' +
    "WHERE segments.date BETWEEN '" + from + "' AND '" + to + "'";

  let n = 0;
  eachRow(q, function (r) {
    out.push({
      day:        r['segments.date'],
      channel:    CHANNEL,
      level:      'device',
      entityId:   str(r['campaign.id']),
      entityName: str(r['campaign.name']),
      parentName: str(r['campaign.name']),
      segment:    str(r['segments.device']).slice(0, 120),
      impressions:          num(r['metrics.impressions']),
      clicks:               num(r['metrics.clicks']),
      costCents:            micros2cents(r['metrics.cost_micros']),
      conversions:          num(r['metrics.conversions']),
      conversionValueCents: Math.round(num(r['metrics.conversions_value']) * 100),
      extra: { campaignId: str(r['campaign.id']), device: str(r['segments.device']) }
    });
    n++;
  });
  return n;
}

/**
 * Spend by hour. The console already knows from Telnyx which hours produce
 * answered calls; this is the other half of the equation.
 *
 * Day of week is derived from the date rather than selected, exactly as
 * specified — it is a function of the date and adds no rows.
 */
function hours(from, to, out) {
  const q =
    'SELECT segments.date, segments.hour, campaign.id, campaign.name, ' +
    '  metrics.impressions, metrics.clicks, metrics.cost_micros, ' +
    '  metrics.conversions, metrics.conversions_value ' +
    'FROM campaign ' +
    "WHERE segments.date BETWEEN '" + from + "' AND '" + to + "'";

  let n = 0;
  eachRow(q, function (r) {
    const day = r['segments.date'];
    out.push({
      day:        day,
      channel:    CHANNEL,
      level:      'hour',
      entityId:   str(r['segments.hour']),
      entityName: str(r['segments.hour']) + ':00',
      parentName: str(r['campaign.name']),
      segment:    str(r['campaign.id']).slice(0, 120),
      impressions:          num(r['metrics.impressions']),
      clicks:               num(r['metrics.clicks']),
      costCents:            micros2cents(r['metrics.cost_micros']),
      conversions:          num(r['metrics.conversions']),
      conversionValueCents: Math.round(num(r['metrics.conversions_value']) * 100),
      extra: {
        campaignId: str(r['campaign.id']),
        hour:       num(r['segments.hour']),
        dayOfWeek:  dayOfWeek(day)
      }
    });
    n++;
  });
  return n;
}

/**
 * Calls Google says the ads produced. The number that changes behaviour is
 * call_status = MISSED.
 *
 * call_view has no metrics and no segments at all — not even segments.date —
 * so the window is filtered on call_view.start_call_date_time instead.
 */
function calls(from, to, out, timeZone) {
  const select =
    'SELECT call_view.resource_name, call_view.caller_country_code, ' +
    '  call_view.caller_area_code, call_view.call_duration_seconds, ' +
    '  call_view.start_call_date_time, call_view.end_call_date_time, ' +
    '  call_view.call_status, call_view.type, ' +
    '  call_view.call_tracking_display_location, campaign.id, campaign.name ' +
    'FROM call_view ';

  // The exact literal format for a datetime attribute is not documented, so
  // try the datetime form first and fall back to plain dates.
  const attempts = [
    "WHERE call_view.start_call_date_time >= '" + from + " 00:00:00'" +
    "  AND call_view.start_call_date_time <= '" + to + " 23:59:59'",
    "WHERE call_view.start_call_date_time >= '" + from + "'" +
    "  AND call_view.start_call_date_time <= '" + to + "'"
  ];

  let n = 0;
  let lastError = null;
  for (let a = 0; a < attempts.length; a++) {
    try {
      n = 0;
      const staged = [];
      eachRow(select + attempts[a], function (r) {
        const started = str(r['call_view.start_call_date_time']);
        const day = started ? started.substring(0, 10) : dayString(0, timeZone);
        const status = str(r['call_view.call_status']);
        staged.push({
          day:        day,
          channel:    CHANNEL,
          level:      'call',
          entityId:   str(r['call_view.resource_name']).slice(0, 300),
          entityName: str(r['call_view.caller_area_code']),
          parentName: str(r['campaign.name']),
          segment:    status.slice(0, 120),
          impressions: 0,
          clicks:      0,
          costCents:   0,
          conversions: 0,
          conversionValueCents: 0,
          extra: {
            campaignId:      str(r['campaign.id']),
            callStatus:      status,
            missed:          status === 'MISSED',
            callType:        str(r['call_view.type']),
            displayLocation: str(r['call_view.call_tracking_display_location']),
            durationSeconds: num(r['call_view.call_duration_seconds']),
            callerAreaCode:  str(r['call_view.caller_area_code']),
            callerCountry:   str(r['call_view.caller_country_code']),
            startedAt:       started,
            endedAt:         str(r['call_view.end_call_date_time']),
            // These are Google's own count. The authoritative record of a call
            // is Telnyx; never add the two together.
            asReportedBy:    'google_ads'
          }
        });
        n++;
      });
      for (let i = 0; i < staged.length; i++) out.push(staged[i]);
      return n;
    } catch (e) {
      lastError = e;
    }
  }
  throw lastError;
}

/**
 * Change history. Google keeps only 30 days, so capturing it daily is the only
 * way to keep it. The useful signal for an owner-run account is client_type
 * GOOGLE_ADS_RECOMMENDATIONS / GOOGLE_ADS_RECOMMENDATIONS_SUBSCRIPTION —
 * Google changing the account on its own.
 */
function changes(out, timeZone) {
  const days = Math.min(LOOKBACK_DAYS, CHANGE_MAX_DAYS);
  const from = dayString(days - 1, timeZone);
  const to   = dayString(0, timeZone);

  const base =
    'SELECT change_event.change_date_time, change_event.change_resource_type, ' +
    '  change_event.change_resource_name, change_event.resource_change_operation, ' +
    '  change_event.client_type, change_event.user_email, ' +
    '  change_event.campaign, change_event.ad_group';
  const tail =
    ' FROM change_event ' +
    " WHERE change_event.change_date_time >= '" + from + "'" +
    "   AND change_event.change_date_time <= '" + to + "'" +
    ' ORDER BY change_event.change_date_time DESC' +
    ' LIMIT ' + CHANGE_LIMIT;

  // changed_fields is a protobuf FieldMask. AdsApp.report() flattens rows into
  // strings and message-typed fields are the documented weak spot, so ask for
  // it, and drop it if the query is refused.
  const attempts = [base + ', change_event.changed_fields' + tail, base + tail];

  let lastError = null;
  for (let a = 0; a < attempts.length; a++) {
    try {
      const staged = [];
      let i = 0;
      eachRow(attempts[a], function (r) {
        const when = str(r['change_event.change_date_time']);
        staged.push({
          day:        when ? when.substring(0, 10) : dayString(0, timeZone),
          channel:    CHANNEL,
          level:      'change',
          // change_event has no id of its own; this pair is unique per event.
          entityId:   (when + '|' + str(r['change_event.change_resource_name'])).slice(0, 300),
          entityName: str(r['change_event.change_resource_type']),
          parentName: str(r['change_event.campaign']),
          segment:    str(r['change_event.resource_change_operation']).slice(0, 120),
          impressions: 0,
          clicks:      0,
          costCents:   0,
          conversions: 0,
          conversionValueCents: 0,
          extra: {
            changedAt:     when,
            resourceType:  str(r['change_event.change_resource_type']),
            resource:      str(r['change_event.change_resource_name']),
            operation:     str(r['change_event.resource_change_operation']),
            clientType:    str(r['change_event.client_type']),
            userEmail:     str(r['change_event.user_email']),
            campaign:      str(r['change_event.campaign']),
            adGroup:       str(r['change_event.ad_group']),
            changedFields: str(r['change_event.changed_fields']),
            // The reason this report exists.
            autoApplied:   str(r['change_event.client_type']).indexOf('RECOMMENDATIONS') >= 0
          }
        });
        i++;
      });
      for (let k = 0; k < staged.length; k++) out.push(staged[k]);
      return i;
    } catch (e) {
      lastError = e;
    }
  }
  throw lastError;
}

// ─────────────────────────────────────────────────────────────────────────────
// Plumbing
// ─────────────────────────────────────────────────────────────────────────────

/** Runs a GAQL query and hands each row to fn. Rows are keyed by the exact field names selected. */
function eachRow(query, fn) {
  const rows = AdsApp.report(query, { apiVersion: API_VERSION }).rows();
  while (rows.hasNext()) fn(rows.next());
}

/** yyyy-MM-dd, N days ago, in the ACCOUNT's time zone — not the script's default Pacific. */
function dayString(daysAgo, timeZone) {
  const d = new Date(new Date().getTime() - daysAgo * 24 * 60 * 60 * 1000);
  return Utilities.formatDate(d, timeZone, 'yyyy-MM-dd');
}

function dayOfWeek(ymd) {
  const parts = String(ymd).split('-');
  const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
  return ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'][d.getDay()];
}

function str(v) {
  return (v === null || v === undefined) ? '' : String(v).trim();
}

/**
 * AdsApp.report() rows are documented as an associative array of GAQL column
 * names, but the reference does not say what type the values are — so every
 * number is coerced rather than trusted, and thousands separators, percent
 * signs and currency symbols are stripped in case a value arrives formatted.
 */
function num(v) {
  if (v === null || v === undefined) return 0;
  let s = String(v).trim();
  if (!s || s === '--') return 0;
  s = s.replace(/[,%$\s]/g, '');
  const n = Number(s);
  return isFinite(n) ? n : 0;
}

/** Ratios are 0..1 doubles in GAQL; normalise anything that arrived as a percentage. */
function frac(v) {
  const n = num(v);
  return n > 1 ? n / 100 : n;
}

/** GAQL always returns money in micros. 1 cent = 10,000 micros. */
function micros2cents(v) {
  return Math.round(num(v) / 10000);
}

/** POSTs the rows in batches, with a shared-secret header and retries. */
function post(rows, dayFrom, dayTo) {
  if (!rows.length) {
    Logger.log('Nothing to send.');
    return;
  }
  if (SECRET.indexOf('PASTE_') === 0) {
    throw new Error('Set SECRET at the top of the script to the value of AD_STATS_INGEST_SECRET.');
  }

  let sent = 0;
  let written = 0;
  for (let start = 0; start < rows.length; start += BATCH_ROWS) {
    const batch = rows.slice(start, start + BATCH_ROWS);
    const payload = JSON.stringify({
      source:  SOURCE,
      dayFrom: dayFrom,
      dayTo:   dayTo,
      rows:    batch
    });

    const response = postWithRetry(payload, (start / BATCH_ROWS) + 1);
    sent += batch.length;
    if (response) {
      try {
        written += Number(JSON.parse(response).written) || 0;
      } catch (e) { /* body was not JSON; the status code already passed */ }
    }
  }
  Logger.log('Sent %s rows in %s batch(es); endpoint reported %s written.',
             sent, Math.ceil(rows.length / BATCH_ROWS), written);
}

function postWithRetry(payload, batchNumber) {
  const options = {
    method: 'POST',
    contentType: 'application/json',
    headers: { 'x-coastpro-key': SECRET },
    payload: payload,
    muteHttpExceptions: true
  };

  let lastBody = '';
  for (let attempt = 1; attempt <= 3; attempt++) {
    const response = UrlFetchApp.fetch(ENDPOINT, options);
    const code = response.getResponseCode();
    lastBody = response.getContentText();
    if (code >= 200 && code < 300) return lastBody;

    // 401 and 400 will not fix themselves by trying again.
    if (code === 401 || code === 400 || code === 413) {
      throw new Error('Batch ' + batchNumber + ' rejected with HTTP ' + code + ': ' + lastBody);
    }
    Logger.log('Batch %s attempt %s got HTTP %s, retrying...', batchNumber, attempt, code);
    Utilities.sleep(2000 * attempt);
  }
  throw new Error('Batch ' + batchNumber + ' failed after 3 attempts: ' + lastBody);
}
