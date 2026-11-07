#!/usr/bin/env bash
# Validates the Renovate repo config, renovate.json, in a directory (the repo
# root by default) with the Renovate the bot runs. CI runs it, and its tests in
# check-renovate-config.test.ts, when renovate.json, this script, its test or
# that workflow changes (.forgejo/workflows/renovate-config.yml).
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
# The validator does not resolve presets, so it accepts a misspelled name in
# extends (#114). A local Renovate run on the same file then resolves them: it
# logs an unknown preset as a warning and still exits 0, so the script fails on
# any record at warn level (40) or above in its JSON log, and on a log without
# the "Repository finished" record, so a log it cannot read fails too. The
# local run has no platform and no token: a local> or private preset, which the
# bot resolves on git.sbrn.eu, fails here.
#
# Exit 0: valid. 2: no renovate.json. 1: the validator or the local run
# refused the config, the local run failed or wrote a log the script cannot
# read, or no docker daemon answered. 125: docker could not pull or start the
# image.
set -euo pipefail

RENOVATE_IMAGE=ghcr.io/renovatebot/renovate:44.132.2

dir=${1:-$(dirname "$0")/..}
if [ ! -f "$dir/renovate.json" ]; then
  echo "check-renovate-config: no renovate.json in $dir" >&2
  exit 2
fi

# Runs in the image's sh, with renovate.json on stdin.
in_image=$(cat <<'EOF'
cd "$(mktemp -d)" && cat > renovate.json || exit 1
renovate-config-validator --strict || exit 1
if ! LOG_FORMAT=json renovate --platform=local --dry-run=extract > renovate.log 2>&1; then
  cat renovate.log
  echo "check-renovate-config: the local Renovate run failed" >&2
  exit 1
fi
exec node -e '
  const records = require("fs").readFileSync("renovate.log", "utf8").split("\n").flatMap((line) => {
    try { return [JSON.parse(line)]; } catch { return []; }
  });
  const problems = records.filter((r) => r.level >= 40).map((r) => [r.msg, r.err?.validationError].filter(Boolean).join(": "));
  if (!records.some((r) => r.msg === "Repository finished")) problems.push("no \"Repository finished\" record in its JSON log");
  if (problems.length) {
    console.error(`check-renovate-config: the local Renovate run refused the config:\n${problems.join("\n")}`);
    process.exit(1);
  }
  console.log("check-renovate-config: presets resolved");
'
EOF
)
exec docker run --rm -i --entrypoint sh "$RENOVATE_IMAGE" -c "$in_image" < "$dir/renovate.json"
