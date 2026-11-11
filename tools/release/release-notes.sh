#!/usr/bin/env bash
# Prints the GitHub release notes for one version of an Nx release group, from its CHANGELOG.md files.
#
#   tools/release/release-notes.sh <platform> <version>
#
# Keep in sync with "release.groups" in nx.json and tools/release/release-info.sh.
set -euo pipefail

group="${1:?usage: release-notes.sh <platform> <version>}"
version="${2:?usage: release-notes.sh <platform> <version>}"

# Body of the "## <version> ..." section: lines after that heading, up to the next one.
# Nx writes a major version's heading with one "#" ("# 1.0.0 (date)"), the rest with two.
section() { awk -v v="$version" '/^##? /{p = ($2 == v); next} p' "$1"; }

case "$group" in
  platform)
    # Fixed group: every package's entry for this version, minus Nx's bump-only ones.
    for f in libs/{shared,crm}/*/*/CHANGELOG.md; do
      [ -f "$f" ] || continue
      body=$(section "$f")
      if [ -z "$body" ] || grep -q "version bump only" <<<"$body"; then continue; fi
      echo "## $(node -p "require('./$(dirname "$f")/package.json').name")"
      echo "$body"
      echo
    done
    ;;
  *)
    echo "Unknown release group: $group" >&2
    exit 1
    ;;
esac
