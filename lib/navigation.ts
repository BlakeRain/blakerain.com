import { promises as fs } from "fs";
import path from "path";
import yaml from "yaml";

/// An entry in the site navigation.
export interface SiteNavigation {
  /// The title of the navigation item.
  label: string;
  /// The URL of the navigation item.
  url: string;
}

/// Load the site navigation from the `navigation.yaml` file in the `/content/` directory.
export async function loadNavigation(): Promise<SiteNavigation[]> {
  const navPath = path.join(process.cwd(), "content", "navigation.yaml");
  const navSrc = await fs.readFile(navPath, "utf-8");
  return yaml.parse(navSrc) as SiteNavigation[];
}
