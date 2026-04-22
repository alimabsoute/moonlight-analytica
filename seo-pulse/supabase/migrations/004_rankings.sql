-- Phase 3: keyword rank tracking persistence
-- Tables: keyword_rankings, ranking_snapshots, serp_results

-- ─────────────────────────────────────────────
-- keyword_rankings
-- One row per (project × keyword × engine × locale).
-- This is the "tracking config" — ranking history hangs off it.
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS keyword_rankings (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id        uuid        REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  keyword           text        NOT NULL,
  search_engine     text        NOT NULL DEFAULT 'google',
  location_code     int         NOT NULL DEFAULT 2840,
  language_code     text        NOT NULL DEFAULT 'en',
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),
  UNIQUE(project_id, keyword, search_engine, location_code, language_code)
);

ALTER TABLE keyword_rankings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_own_keyword_rankings" ON keyword_rankings
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = keyword_rankings.project_id
        AND p.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = keyword_rankings.project_id
        AND p.user_id = auth.uid()
    )
  );

CREATE INDEX ON keyword_rankings(project_id);

-- ─────────────────────────────────────────────
-- ranking_snapshots
-- One row per data fetch for a tracked keyword.
-- position is nullable — null means not in top 100 on that fetch.
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ranking_snapshots (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  keyword_ranking_id  uuid        REFERENCES keyword_rankings(id) ON DELETE CASCADE NOT NULL,
  position            int,
  url                 text,
  search_volume       int,
  cpc                 numeric,
  difficulty          int,
  fetched_at          timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE ranking_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_own_ranking_snapshots" ON ranking_snapshots
  FOR ALL
  USING (
    EXISTS (
      SELECT 1
        FROM keyword_rankings kr
        JOIN projects p ON p.id = kr.project_id
       WHERE kr.id = ranking_snapshots.keyword_ranking_id
         AND p.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
        FROM keyword_rankings kr
        JOIN projects p ON p.id = kr.project_id
       WHERE kr.id = ranking_snapshots.keyword_ranking_id
         AND p.user_id = auth.uid()
    )
  );

-- Primary access pattern: latest-N snapshots per tracked keyword
CREATE INDEX ON ranking_snapshots(keyword_ranking_id, fetched_at DESC);

-- ─────────────────────────────────────────────
-- serp_results
-- Full top-10 SERP capture per (keyword × day) for competitor analysis.
-- result_type covers the full taxonomy of Google SERP features.
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS serp_results (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  keyword_ranking_id  uuid        REFERENCES keyword_rankings(id) ON DELETE CASCADE NOT NULL,
  snapshot_date       date        NOT NULL,
  position            int         NOT NULL,
  url                 text        NOT NULL,
  title               text,
  description         text,
  domain              text,
  result_type         text        NOT NULL CHECK (
                                    result_type IN (
                                      'organic',
                                      'featured_snippet',
                                      'people_also_ask',
                                      'video',
                                      'image',
                                      'news',
                                      'shopping'
                                    )
                                  ),
  is_own_domain       bool        NOT NULL DEFAULT false,
  UNIQUE(keyword_ranking_id, snapshot_date, position, result_type)
);

ALTER TABLE serp_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_own_serp_results" ON serp_results
  FOR ALL
  USING (
    EXISTS (
      SELECT 1
        FROM keyword_rankings kr
        JOIN projects p ON p.id = kr.project_id
       WHERE kr.id = serp_results.keyword_ranking_id
         AND p.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
        FROM keyword_rankings kr
        JOIN projects p ON p.id = kr.project_id
       WHERE kr.id = serp_results.keyword_ranking_id
         AND p.user_id = auth.uid()
    )
  );

CREATE INDEX ON serp_results(keyword_ranking_id, snapshot_date DESC);

-- ─────────────────────────────────────────────
-- Trigger: keep keyword_rankings.updated_at current
-- whenever a new ranking snapshot is inserted.
-- ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION touch_keyword_ranking_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  UPDATE keyword_rankings
     SET updated_at = now()
   WHERE id = NEW.keyword_ranking_id;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER on_ranking_snapshot_insert
  AFTER INSERT ON ranking_snapshots
  FOR EACH ROW EXECUTE FUNCTION touch_keyword_ranking_updated_at();
