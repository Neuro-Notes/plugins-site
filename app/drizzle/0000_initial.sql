CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

DO $$ BEGIN
  CREATE TYPE submission_kind AS ENUM ('new_plugin', 'new_version', 'metadata_update');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE submission_status AS ENUM ('pending', 'approved', 'rejected');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE moderation_decision AS ENUM ('approved', 'rejected');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS marketplace_users (
  external_user_id integer PRIMARY KEY,
  username text NOT NULL UNIQUE,
  display_name text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  is_verified boolean NOT NULL DEFAULT false,
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS plugins (
  id text PRIMARY KEY,
  owner_user_id integer NOT NULL REFERENCES marketplace_users(external_user_id),
  github_owner text NOT NULL,
  github_repository text NOT NULL,
  manifest_path text NOT NULL DEFAULT 'manifest.json',
  current_version text,
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (github_owner, github_repository)
);

CREATE INDEX IF NOT EXISTS plugins_owner_idx ON plugins(owner_user_id);

CREATE TABLE IF NOT EXISTS plugin_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plugin_id text NOT NULL REFERENCES plugins(id) ON DELETE CASCADE,
  version text NOT NULL,
  release_tag text NOT NULL,
  release_url text NOT NULL,
  repository_url text NOT NULL,
  commit_sha text NOT NULL,
  manifest jsonb NOT NULL,
  warnings jsonb NOT NULL DEFAULT '[]'::jsonb,
  published_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (plugin_id, version)
);

CREATE INDEX IF NOT EXISTS plugin_versions_published_idx ON plugin_versions(plugin_id, published_at DESC);

CREATE TABLE IF NOT EXISTS plugin_translations (
  plugin_id text NOT NULL REFERENCES plugins(id) ON DELETE CASCADE,
  locale text NOT NULL CHECK (locale IN ('ru', 'en')),
  summary text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (plugin_id, locale)
);

CREATE TABLE IF NOT EXISTS plugin_categories (
  plugin_id text NOT NULL REFERENCES plugins(id) ON DELETE CASCADE,
  category text NOT NULL,
  PRIMARY KEY (plugin_id, category)
);

CREATE TABLE IF NOT EXISTS submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plugin_id text NOT NULL,
  submitted_by integer NOT NULL REFERENCES marketplace_users(external_user_id),
  kind submission_kind NOT NULL,
  status submission_status NOT NULL DEFAULT 'pending',
  source jsonb NOT NULL,
  manifest jsonb NOT NULL,
  warnings jsonb NOT NULL DEFAULT '[]'::jsonb,
  categories jsonb NOT NULL DEFAULT '[]'::jsonb,
  translations jsonb NOT NULL DEFAULT '{}'::jsonb,
  submitted_at timestamptz NOT NULL DEFAULT now(),
  reviewed_at timestamptz,
  reviewed_by integer REFERENCES marketplace_users(external_user_id),
  review_reason text
);

CREATE UNIQUE INDEX IF NOT EXISTS submissions_one_pending_version_idx
  ON submissions(plugin_id, (manifest->>'version')) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS submissions_status_idx ON submissions(status, submitted_at DESC);
CREATE INDEX IF NOT EXISTS submissions_author_idx ON submissions(submitted_by, submitted_at DESC);

CREATE TABLE IF NOT EXISTS moderation_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id uuid NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
  reviewer_user_id integer NOT NULL REFERENCES marketplace_users(external_user_id),
  decision moderation_decision NOT NULL,
  reason text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
