import { createSign } from 'crypto';

const GA4_SCOPE = 'https://www.googleapis.com/auth/analytics.readonly';

export function ga4Configured(): boolean {
  return Boolean(
    process.env.GA4_PROPERTY_ID && process.env.GA4_SA_CLIENT_EMAIL && process.env.GA4_SA_PRIVATE_KEY
  );
}

function b64url(input: Buffer | string): string {
  return Buffer.from(input)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

async function ga4AccessToken(): Promise<string> {
  const email = process.env.GA4_SA_CLIENT_EMAIL ?? '';
  const privateKey = (process.env.GA4_SA_PRIVATE_KEY ?? '').replace(/\\n/g, '\n');
  if (!email || !privateKey) throw new Error('GA4 service account is not configured.');

  const now = Math.floor(Date.now() / 1000);
  const header = b64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const claims = b64url(
    JSON.stringify({
      iss: email,
      scope: GA4_SCOPE,
      aud: 'https://oauth2.googleapis.com/token',
      iat: now,
      exp: now + 3600,
    })
  );

  const signer = createSign('RSA-SHA256');
  signer.update(`${header}.${claims}`);
  signer.end();
  const assertion = `${header}.${claims}.${b64url(signer.sign(privateKey))}`;

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion,
    }),
  });

  const body = (await response.json()) as { access_token?: string; error_description?: string };
  if (!response.ok || !body.access_token) {
    throw new Error(`GA4 token exchange failed: ${body.error_description ?? response.status}`);
  }
  return body.access_token;
}

interface RunReportResponse {
  dimensionHeaders?: { name: string }[];
  metricHeaders?: { name: string; type: string }[];
  rows?: { dimensionValues: { value: string }[]; metricValues: { value: string }[] }[];
  rowCount?: number;
  metadata?: {
    currencyCode?: string;
    timeZone?: string;
    dataLossFromOtherRow?: boolean;
    subjectToThresholding?: boolean;
    samplingMetadatas?: { samplesReadCount: string; samplingSpaceSize: string }[];
  };
  error?: { message?: string };
}

export interface Ga4DailyRow {
  day: string;
  source: string;
  medium: string;
  sessions: number;
  users: number;
  keyEvents: number;
}

export async function ga4DailyTraffic(startDate: string, endDate: string): Promise<Ga4DailyRow[]> {
  const propertyId = (process.env.GA4_PROPERTY_ID ?? '').replace(/\D/g, '');
  if (!propertyId) throw new Error('GA4_PROPERTY_ID is not set.');

  const token = await ga4AccessToken();
  const pageSize = 100_000;
  const out: Ga4DailyRow[] = [];

  for (let offset = 0; ; offset += pageSize) {
    const response = await fetch(
      `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dateRanges: [{ startDate, endDate }],
          dimensions: [{ name: 'date' }, { name: 'sessionSource' }, { name: 'sessionMedium' }],
          metrics: [{ name: 'sessions' }, { name: 'totalUsers' }, { name: 'keyEvents' }],
          orderBys: [{ dimension: { dimensionName: 'date' } }],
          keepEmptyRows: false,
          limit: pageSize,
          offset,
          returnPropertyQuota: true,
        }),
      }
    );

    const body = (await response.json().catch(() => ({}))) as RunReportResponse;
    if (!response.ok) {
      throw new Error(`GA4 runReport failed: ${body.error?.message ?? response.status}`);
    }

    const sample = body.metadata?.samplingMetadatas?.[0];
    if (sample) {
      const pct = (Number(sample.samplesReadCount) / Number(sample.samplingSpaceSize)) * 100;
      console.warn(`GA4 report is sampled: ${pct.toFixed(1)}% of events read.`);
    }

    for (const row of body.rows ?? []) {
      const ymd = row.dimensionValues[0]?.value ?? '';
      out.push({
        day: `${ymd.slice(0, 4)}-${ymd.slice(4, 6)}-${ymd.slice(6, 8)}`,
        source: row.dimensionValues[1]?.value ?? '(not set)',
        medium: row.dimensionValues[2]?.value ?? '(not set)',
        sessions: Number(row.metricValues[0]?.value) || 0,
        users: Number(row.metricValues[1]?.value) || 0,
        keyEvents: Number(row.metricValues[2]?.value) || 0,
      });
    }

    if (!body.rows?.length || offset + pageSize >= (body.rowCount ?? 0)) break;
  }

  return out;
}
