#!/usr/bin/env bash
# Prints the version, git tag and changelog of an Nx release group, as GitHub Actions outputs
# (key=value lines), read from the manifest the group's version is written to.
#
#   tools/release/release-info.sh <platform|logging>
#
# Keep in sync with "release.groups" in nx.json.
set -euo pipefail

group="${1:?usage: release-info.sh <platform|logging>}"

case "$group" in
  platform)
    # Fixed group: every package shares one version; util-constants stands in for all of them.
    manifest="libs/shared/poly/util-constants/package.json"
    tag_prefix="v"
    ;;
  logging)
    manifest="libs/shared/backend/util-logging/package.json"
    tag_prefix="@open-kingdom/shared-backend-util-logging@"
    ;;
  *)
    echo "Unknown release group: $group" >&2
    exit 1
    ;;
esac

version=$(node -p "require('./${manifest}').version")
tag="${tag_prefix}${version}"

# A group with no tag yet has never been released.
if git tag -l "${tag_prefix}*" | grep -q .; then
  first_release=false
else
  first_release=true
fi

echo "version=${version}"
echo "tag=${tag}"
echo "changelog=$(dirname "$manifest")/CHANGELOG.md"
echo "first_release=${first_release}"
