/**
 * Seed synthetic 30-day ranking history for a Caposeo project.
 *
 * Usage:
 *   npx tsx scripts/seed-rankings.ts --project-id <uuid>
 *
 * Required env vars:
 *   SUPABASE_URL              — project URL (https://xxx.supabase.co)
 *   SUPABASE_SERVICE_ROLE_KEY — service role key (bypasses RLS for seeding)
 *
 * What it does:
 *   1. Reads projects.tracked_keywords + projects.domain for the given project.
 *   2. For each keyword, upserts one keyword_rankings row.
 *   3. Generates 30 daily ranking_snapshots with a realistic random-walk position.
 *   4. For each day, inserts 10 serp_results rows (organic top-10, with ~5% chance
 *      of a featured_snippet at position 0 on any given day).
 *   5. is_own_domain is set to true when the SERP row's domain matches projects.domain.
 *
 * Re-run safety:
 *   - keyword_rankings: upserted (onConflict ignore) — idempotent.
 *   - ranking_snapshots: checked per (keyword_ranking_id, date) before insert — skip if exists.
 *   - serp_results: upserted with ignoreDuplicates — idempotent.
 */

import { createClient } from '@supabase/supabase-js';

// ─── env validation ──────────────────────────────────────────────────────────

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error(
    'ERROR: Missing required env vars.\n' +
      '  SUPABASE_URL\n' +
      '  SUPABASE_SERVICE_ROLE_KEY\n' +
      'Copy .env.example to .env.local and fill in values.',
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ─── arg parsing ─────────────────────────────────────────────────────────────

function getProjectIdArg(): string {
  const idx = process.argv.indexOf('--project-id');
  if (idx === -1 || !process.argv[idx + 1]) {
    console.error('ERROR: --project-id <uuid> is required.');
    process.exit(1);
  }
  return process.argv[idx + 1];
}

// ─── synthetic data helpers ──────────────────────────────────────────────────

/** Random integer in [min, max] inclusive. */
function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Produce an array of 30 positions (integers) using a bounded random walk.
 * Starting position is random in [5, 50].
 * Each day drifts by ±3, clamped to [1, 100] (null-like values stay in range).
 */
function generatePositionSeries(days: number): number[] {
  const positions: number[] = [];
  let pos = randInt(5, 50);
  for (let i = 0; i < days; i++) {
    const delta = randInt(-3, 3);
    pos = Math.max(1, Math.min(100, pos + delta));
    positions.push(pos);
  }
  return positions;
}

/** ISO date string (YYYY-MM-DD) for `daysAgo` days before today. */
function dateFor(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().slice(0, 10);
}

/** Strip protocol + trailing slash from a URL to produce a bare domain. */
function stripDomain(url: string): string {
  return url.replace(/^https?:\/\//, '').replace(/\/.*$/, '').toLowerCase();
}

/** Generate a plausible competitor URL for position `rank` around `keyword`. */
function competitorUrl(keyword: string, rank: number): string {
  const slug = keyword.toLowerCase().replace(/\s+/g, '-');
  const hosts = [
    'semrush.com',
    'ahrefs.com',
    'moz.com',
    'searchengineland.com',
    'neilpatel.com',
    'backlinko.com',
    'hubspot.com',
    'wordstream.com',
    'searchenginejournal.com',
    'yoast.com',
  ];
  const host = hosts[(rank - 1) % hosts.length];
  return `https://www.${host}/blog/${slug}`;
}

// ─── main ────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const projectId = getProjectIdArg();

  // 1. Fetch project
  console.log(`\nFetching project ${projectId}…`);
  const { data: project, error: projectErr } = await supabase
    .from('projects')
    .select('id, domain, tracked_keywords')
    .eq('id', projectId)
    .single();

  if (projectErr || !project) {
    console.error('ERROR: Could not fetch project —', projectErr?.message ?? 'not found');
    process.exit(1);
  }

  const { domain, tracked_keywords: trackedKeywords } = project as {
    domain: string;
    tracked_keywords: string[];
  };

  if (!trackedKeywords || trackedKeywords.length === 0) {
    console.warn('WARNING: projects.tracked_keywords is empty — nothing to seed.');
    process.exit(0);
  }

  console.log(`Project domain : ${domain}`);
  console.log(`Keywords found : ${trackedKeywords.length}`);

  const DAYS = 30;
  // Normalize: handle domain stored as "example.com" or "https://example.com"
  const projectDomain = domain
    .replace(/^https?:\/\//, '')
    .replace(/\/.*$/, '')
    .toLowerCase();

  // 2. Process each keyword
  for (let ki = 0; ki < trackedKeywords.length; ki++) {
    const keyword = trackedKeywords[ki];
    console.log(`\n[${ki + 1}/${trackedKeywords.length}] "${keyword}"`);

    // 2a. Upsert keyword_rankings row
    const { data: krRows, error: krErr } = await supabase
      .from('keyword_rankings')
      .upsert(
        {
          project_id: projectId,
          keyword,
          search_engine: 'google',
          location_code: 2840,
          language_code: 'en',
        },
        { onConflict: 'project_id,keyword,search_engine,location_code,language_code', ignoreDuplicates: false },
      )
      .select('id');

    if (krErr || !krRows || krRows.length === 0) {
      console.error(`  ERROR upserting keyword_ranking: ${krErr?.message}`);
      continue;
    }

    const keywordRankingId: string = (krRows[0] as { id: string }).id;
    console.log(`  keyword_ranking id: ${keywordRankingId}`);

    // Generate 30-day position series
    const positions = generatePositionSeries(DAYS);

    let snapshotsInserted = 0;
    let snapshotsSkipped = 0;
    let serpInserted = 0;

    for (let day = 0; day < DAYS; day++) {
      const daysAgo = DAYS - 1 - day; // day 0 = 29 days ago, day 29 = today
      const snapshotDate = dateFor(daysAgo);
      const position = positions[day];
      const ownUrl = `https://${domain}/blog/${keyword.toLowerCase().replace(/\s+/g, '-')}`;

      // 2b. Skip if a snapshot for this (keyword_ranking_id, date) already exists
      // Check whether this calendar day has already been seeded.
      // Use open-ended upper bound (next-day midnight) to avoid
      // sub-second boundary gaps.
      const nextDate = dateFor(daysAgo - 1);
      const { count } = await supabase
        .from('ranking_snapshots')
        .select('id', { count: 'exact', head: true })
        .eq('keyword_ranking_id', keywordRankingId)
        .gte('fetched_at', `${snapshotDate}T00:00:00Z`)
        .lt('fetched_at', `${nextDate}T00:00:00Z`);

      if (count && count > 0) {
        snapshotsSkipped++;
        continue;
      }

      // 2c. Insert ranking_snapshot
      const { error: snapErr } = await supabase.from('ranking_snapshots').insert({
        keyword_ranking_id: keywordRankingId,
        position,
        url: ownUrl,
        search_volume: randInt(100, 8000),
        cpc: parseFloat((Math.random() * 5).toFixed(2)),
        difficulty: randInt(10, 90),
        fetched_at: `${snapshotDate}T12:00:00Z`,
      });

      if (snapErr) {
        console.error(`  ERROR inserting snapshot (${snapshotDate}): ${snapErr.message}`);
        continue;
      }
      snapshotsInserted++;

      // 2d. Build top-10 SERP rows for this date
      // ~5% chance of a featured snippet (owned by project domain)
      const hasFeaturedSnippet = Math.random() < 0.05;
      const serpRows: Array<{
        keyword_ranking_id: string;
        snapshot_date: string;
        position: number;
        url: string;
        title: string;
        description: string;
        domain: string;
        result_type: string;
        is_own_domain: boolean;
      }> = [];

      if (hasFeaturedSnippet) {
        serpRows.push({
          keyword_ranking_id: keywordRankingId,
          snapshot_date: snapshotDate,
          position: 0,
          url: ownUrl,
          title: `${keyword} — Expert Guide`,
          description: `Everything you need to know about ${keyword}, including best practices and strategies.`,
          domain: projectDomain,
          result_type: 'featured_snippet',
          is_own_domain: true,
        });
      }

      for (let rank = 1; rank <= 10; rank++) {
        // Slot the project's own URL at its tracked position; fill rest with competitors
        const isOwnSlot = rank === position && position <= 10;
        const url = isOwnSlot ? ownUrl : competitorUrl(keyword, rank);
        const rowDomain = stripDomain(url);

        serpRows.push({
          keyword_ranking_id: keywordRankingId,
          snapshot_date: snapshotDate,
          position: rank,
          url,
          title: isOwnSlot
            ? `${keyword} | ${domain}`
            : `${keyword} - Rank ${rank} Result`,
          description: `Comprehensive resource about ${keyword} at position ${rank}.`,
          domain: rowDomain,
          result_type: 'organic',
          is_own_domain: rowDomain === projectDomain,
        });
      }

      const { error: serpErr } = await supabase
        .from('serp_results')
        .upsert(serpRows, {
          onConflict: 'keyword_ranking_id,snapshot_date,position,result_type',
          ignoreDuplicates: true,
        });

      if (serpErr) {
        console.error(`  ERROR upserting serp_results (${snapshotDate}): ${serpErr.message}`);
      } else {
        serpInserted += serpRows.length;
      }
    }

    console.log(
      `  snapshots: +${snapshotsInserted} inserted, ${snapshotsSkipped} skipped | serp rows: +${serpInserted}`,
    );
  }

  console.log('\nSeed complete.');
}

main().catch((err: unknown) => {
  console.error('Unhandled error:', err);
  process.exit(1);
});
