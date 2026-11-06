#!/usr/bin/env bash
# Validates the Renovate repo config, renovate.json, in a directory (the repo
# root by default) with the Renovate the bot runs. CI runs it, and its tests in
# check-renovate-config.test.ts, when renovate.json, this script or its test
# changes (.forgejo/workflows/renovate-config.yml).
#
# The validator runs inside the bot's image, so the Renovate version, its Node
# and its dependencies are the bot's. RENOVATE_IMAGE must equal the image in
# renovate/renovate-config's .forgejo/workflows/renovate.yml. The file goes in
# on stdin: in a CI job, docker talks to the runner host's daemon, where a bind
# mount of a job path comes up empty.
#
# The validator gets no file argument. Given a path, renovate 44.132.2
# validates that file as global config, which accepts global-only options such
# as allowedCommands. --strict also fails a config that needs migration.
#
# Exit 0: valid. 2: no renovate.json. 1: the validator refused the config, or
# no docker daemon answered. 125: docker could not pull or start the image.
set -euo pipefail

RENOVATE_IMAGE=ghcr.io/renovatebot/renovate:44.132.2

dir=${1:-$(dirname "$0")/..}
if [ ! -f "$dir/renovate.json" ]; then
  echo "check-renovate-config: no renovate.json in $dir" >&2
  exit 2
fi
exec docker run --rm -i --entrypoint sh "$RENOVATE_IMAGE" \
  -c 'cd "$(mktemp -d)" && cat > renovate.json && exec renovate-config-validator --strict' \
  < "$dir/renovate.json"
