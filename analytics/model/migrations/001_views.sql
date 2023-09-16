CREATE TABLE IF NOT EXISTS page_views (
  id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  path TEXT NOT NULL,
  time TIMESTAMP WITH TIME ZONE NOT NULL,
  user_agent TEXT,
  viewport_width INTEGER,
  viewport_height INTEGER,
  screen_width INTEGER,
  screen_height INTEGER,
  timezone TEXT,
  referrer TEXT,
  beacon BOOLEAN NOT NULL,
  duration FLOAT8,
  scroll FLOAT8
);

CREATE TABLE IF NOT EXISTS page_views_day (
  id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  path TEXT NOT NULL,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL,
  day INTEGER NOT NULL,
  hour INTEGER NOT NULL,
  count INTEGER NOT NULL,
  total_beacon INTEGER NOT NULL,
  total_scroll FLOAT8 NOT NULL,
  total_duration FLOAT8 NOT NULL,

  CONSTRAINT unique_page_views_day
  UNIQUE (path, year, month, day, hour)
);

CREATE TABLE IF NOT EXISTS page_views_week (
  id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  path TEXT NOT NULL,
  year INTEGER NOT NULL,
  week INTEGER NOT NULL,
  dow INTEGER NOT NULL,
  count INTEGER NOT NULL,
  total_beacon INTEGER NOT NULL,
  total_scroll FLOAT8 NOT NULL,
  total_duration FLOAT8 NOT NULL,

  CONSTRAINT unique_page_views_week
  UNIQUE (path, year, week, dow)
);

CREATE TABLE IF NOT EXISTS page_views_month (
  id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  path TEXT NOT NULL,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL,
  day INTEGER NOT NULL,
  count INTEGER NOT NULL,
  total_beacon INTEGER NOT NULL,
  total_scroll FLOAT8 NOT NULL,
  total_duration FLOAT8 NOT NULL,

  CONSTRAINT unique_page_views_month
  UNIQUE (path, year, month, day)
);
