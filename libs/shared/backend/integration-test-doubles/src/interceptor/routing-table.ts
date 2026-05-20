export interface RoutingEntry {
  /** The target host to intercept (e.g., "gmail.googleapis.com") */
  hostname: string;
  /** The local target URL to rewrite requests to (e.g., "http://localhost:9014") */
  target: string;
  /** Optional path prefix restriction (only intercept paths starting with this) */
  pathPrefix?: string;
}

export class RoutingTable {
  private readonly entries: Map<string, RoutingEntry[]> = new Map();

  constructor(initialEntries: RoutingEntry[] = []) {
    for (const entry of initialEntries) {
      this.addEntry(entry);
    }
  }

  addEntry(entry: RoutingEntry): void {
    const key = entry.hostname.toLowerCase();
    const list = this.entries.get(key) || [];
    list.push({
      ...entry,
      hostname: key,
      target: entry.target.replace(/\/+$/, ''), // Strip trailing slashes safely
    });
    this.entries.set(key, list);
  }

  resolve(urlStr: string): string | null {
    try {
      const url = new URL(urlStr);
      const host = url.hostname.toLowerCase();
      const list = this.entries.get(host);
      if (!list) return null;

      for (const entry of list) {
        if (!entry.pathPrefix || url.pathname.startsWith(entry.pathPrefix)) {
          const rewritten = new URL(entry.target);
          // Set pathname correctly, preserving subpaths
          let targetPath = rewritten.pathname;
          if (targetPath === '/') {
            targetPath = '';
          }
          rewritten.pathname = targetPath + url.pathname;
          rewritten.search = url.search;
          return rewritten.toString();
        }
      }
      return null;
    } catch {
      return null;
    }
  }
}
