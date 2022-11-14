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

export function parseGitLogEntries(source: string): GitLogEntry[] {
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

export async function loadFileRevisions(
  filename: string
): Promise<GitLogEntry[]> {
  let { stdout } = await exec_async(
    `git log --pretty=format:'${GIT_LOG_FORMAT}' "${filename}"`
  );

  try {
    return parseGitLogEntries(stdout);
  } catch (exc) {
    console.error("Failed to parse JSON from 'git log'");
    throw exc;
  }
}
