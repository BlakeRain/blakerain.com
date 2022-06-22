import { promises as fs } from "fs";
import path from "path";
import yaml from "yaml";

export interface SiteNavigation {
  label: string;
  url: string;
}

export async function loadNavigation(): Promise<SiteNavigation[]> {
  const navPath = path.join(process.cwd(), "content", "navigation.yaml");
  const navSrc = await fs.readFile(navPath, "utf-8");
  return yaml.parse(navSrc) as SiteNavigation[];
}
