CREATE TABLE IF NOT EXISTS users (
  id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT NOT NULL,
  password TEXT NOT NULL,
  enabled BOOLEAN NOT NULL,
  reset_password BOOLEAN NOT NULL,

  CONSTRAINT unique_username
  UNIQUE (username)
);

-- Create an intial user that has a temporary password. The password is: admin
INSERT INTO users (username, password, enabled, reset_password)
  VALUES('admin', '$pbkdf2-sha256$i=600000,l=32$V62SYtsc1HWC2hV3jbevjg$OrOHoTwo1YPmNrPUnAUy3Vfg4Lrw90mxOTTISVHmjnk', TRUE, TRUE);
