// A utility module for extracting git history
//
// This module exports some functions that can be used to extract the history for a given path in the repository. This
// allows us to include a revision history with each file (e.g. a blog post).
//
// The trick here is to get git to format it's output as JSON so we can parse it. However, git will not escape any
// inverted commas (`"`) in commit messages. For this reason we use a placeholder (currently `^^^^`) for an inverted
// comma, and later perform the escaping ourselves (see the `parseGitLogEntries` function).

import util from "util";
import { exec } from "child_process";

const exec_async = util.promisify(exec);
const GIT_LOG_FORMAT =
  "{^^^^hash^^^^:^^^^%H^^^^,^^^^abbreviated^^^^:^^^^%h^^^^,^^^^author^^^^:^^^^%an^^^^,^^^^date^^^^:^^^^%aI^^^^,^^^^message^^^^:^^^^%s^^^^}";

export interface GitLogEntry {
  hash: string;
  abbreviated: string;
  author: string;
  date: string;
  message: string;
}

function parseGitLogEntries(source: string): GitLogEntry[] {
  return JSON.parse(
    "[" +
    source
      .replaceAll("`", "'")
      .replaceAll('"', '\\"')
      .replaceAll("^^^^", '"')
      .split("\n")
      .join(",") +
    "]"
  );
}

/// Load the revisions history of the given file.
export async function loadFileRevisions(
  file_path: string
): Promise<GitLogEntry[]> {
  let { stdout } = await exec_async(
    `git log --pretty=format:'${GIT_LOG_FORMAT}' "${file_path}"`
  );

  try {
    return parseGitLogEntries(stdout);
  } catch (exc) {
    console.error("Failed to parse JSON from 'git log' for '" + file_path + "'");
    throw exc;
  }
}
