CREATE TABLE IF NOT EXISTS users (
  id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT NOT NULL,
  password TEXT NOT NULL,
  enabled BOOLEAN NOT NULL,
  reset_password BOOLEAN NOT NULL,

  CONSTRAINT unique_username
  UNIQUE (username)
);

-- Create an intial user that has a temporary password
INSERT INTO users (username, password, enabled, reset_password)
  VALUES("admin", "admin", TRUE, TRUE);
