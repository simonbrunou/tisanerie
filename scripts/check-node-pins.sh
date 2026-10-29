#!/usr/bin/env bash
# Check that CI, the production image and the Node types pin one Node major
# (#96). CI runs this script before `npm ci`, so a local run runs the same
# check.
#
#   scripts/check-node-pins.sh [<repo dir>]
#
# It reads each pin from the file that sets it:
#   .nvmrc  the Node CI runs: actions/setup-node reads it through
#     `node-version-file`. Its one line that is neither blank nor a comment
#     must be a version (24, v24, 24.12.0), not an alias such as lts/*.
#   Dockerfile  the major of the tag of every `FROM [<registry>/]node:<tag>`
#     (24 out of 24-alpine or 24.12.0-alpine@sha256:...), the Node that
#     Coolify builds production on. A FROM continued over several lines is
#     read whole. Where this script could read a Dockerfile otherwise than
#     Docker does, it fails rather than skip a line: a heredoc body (RUN
#     <<EOF) reads like any other line, so a body line FROM node:<tag>
#     counts as a stage, and so does a line that starts with FROM inside a
#     continued instruction, read with the lines that continue it; FROM
#     node reads as an untagged image even when it names an earlier stage
#     called node; an escape directive other than a backslash fails.
#     Skipping heredoc bodies or stage names would take BuildKit's parser,
#     and any way this script read one differently could let a real stage
#     go unread.
#   package.json  the major of the `@types/node` range (24 out of ^24.12.4),
#     in devDependencies or dependencies, not both.
# The Node.js group in renovate.json moves the three together. The dev
# shell's Node comes from flake.nix, which Renovate does not update, so a
# `node --version` with another major prints a warning only.
# Exit 0: every pin reads the same major. Exit 1: the pins differ or one
# cannot be read, and the output names each file, line and value. Exit 2: a
# wrong call, a <repo dir> that does not exist, or no node on PATH.
# scripts/check-node-pins.test.ts runs it on edited copies of the three
# files, one failure class per test: add a test there when the parsing
# changes.
set -uo pipefail

if [ $# -gt 1 ]; then
  echo "usage: scripts/check-node-pins.sh [<repo dir>]" >&2
  exit 2
fi
ROOT="${1:-$(cd "$(dirname "$0")/.." && pwd)}"
if [ ! -d "$ROOT" ]; then
  echo "check-node-pins: no directory $ROOT" >&2
  exit 2
fi
# It parses package.json with node, so in CI it runs after setup-node.
if ! command -v node >/dev/null 2>&1; then
  echo "check-node-pins: needs node on PATH" >&2
  exit 2
fi

NVMRC=.nvmrc
DOCKERFILE=Dockerfile
PACKAGE=package.json

# One entry per pin: where it is, the major it reads, and the text it read.
where=()
major=()
shown=()
status=0

pin() {
  where+=("$1")
  major+=("$2")
  shown+=("$3")
}

fail() {
  echo "check-node-pins: $1" >&2
  status=1
}

read_nvmrc() {
  local file="$ROOT/$NVMRC" value
  if [ ! -f "$file" ]; then
    fail "$NVMRC not found"
    return
  fi
  value=$(sed -e 's/\r$//' -e 's/^[[:space:]]*//' -e 's/[[:space:]]*$//' "$file" |
    grep -v -e '^$' -e '^#')
  if [ -z "$value" ]; then
    fail "$NVMRC is empty"
    return
  fi
  # setup-node takes the first line that reads as a version, which need not
  # be the line this check reads, so a second line fails.
  if [[ "$value" == *$'\n'* ]]; then
    fail "$NVMRC has more than one line that is neither blank nor a comment"
    return
  fi
  if [[ ! "$value" =~ ^v?([0-9]+)(\.[0-9]+){0,2}$ ]]; then
    fail "$NVMRC '$value' is not a Node version such as 24 or 24.12.0"
    return
  fi
  pin "$NVMRC" "${BASH_REMATCH[1]}" "$value"
}

# Whether a FROM line named a node image.
found_node=0

# Read one FROM: its line number and image.
read_from() {
  local n="$1" image="$2" ref name last tag
  # An image named by a build arg (FROM ${IMAGE}) hides its tag from this
  # check, so it fails instead of passing that stage unread.
  if [[ "$image" == *'$'* ]]; then
    fail "$DOCKERFILE:$n FROM takes its image from a build arg, which this check cannot read"
    return
  fi
  ref=${image%%@*}
  # The tag follows the last colon after the last slash, so a registry port
  # (localhost:5000/node) is not read as a tag.
  name=$ref
  tag=
  last=${ref##*/}
  if [[ "$last" == *:* ]]; then
    tag=${last#*:}
    name=${ref%:*}
  fi
  if [[ ! "$name" =~ (^|/)node$ ]]; then
    return
  fi
  found_node=1
  if [ -z "$tag" ]; then
    fail "$DOCKERFILE:$n $image has no tag"
  elif [[ "$tag" =~ ^([0-9]+)([.-]|$) ]]; then
    pin "$DOCKERFILE:$n" "${BASH_REMATCH[1]}" "$image"
  else
    fail "$DOCKERFILE:$n node tag '$tag' does not start with a Node major"
  fi
}

read_dockerfile() {
  local file="$ROOT/$DOCKERFILE" entry n i
  local -a words
  if [ ! -f "$file" ]; then
    fail "$DOCKERFILE not found"
    return
  fi
  while IFS= read -r entry; do
    n=${entry%%:*}
    entry=${entry#*:}
    if [ "$entry" = '#escape' ]; then
      fail "$DOCKERFILE:$n sets an escape character other than a backslash, which this check does not read"
      continue
    fi
    read -ra words <<<"$entry"
    # Skip the flags (--platform=...) between FROM and the image.
    i=1
    while [[ "${words[i]:-}" == --* ]]; do i=$((i + 1)); done
    read_from "$n" "${words[i]:-}"
  done < <(
    # One `<line>:<instruction>` per instruction, its continued lines
    # (ending in a backslash) joined, so `FROM \` does not hide the image on
    # the next line. Comment lines, and blank lines inside an instruction,
    # drop out as Docker drops them, so a comment that ends in a backslash
    # continues nothing. A line that starts with FROM inside a continued
    # instruction also prints, with the lines that continue it: Docker may
    # end the instruction before it (a heredoc end word that ends in a
    # backslash), so it reads as a stage either way. It reads bytes
    # (LC_ALL=C), drops a UTF-8 byte order mark as Docker does, and prints
    # `<line>:#escape` for an escape directive other than a backslash
    # (escape=` makes a backslash literal).
    LC_ALL=C awk '
      # The instruction, then each FROM inside it: the rest of buf from the
      # column at[k] where line inner[k] starts.
      function emit(k) {
        print start ":" buf
        for (k = 1; k <= froms; k++) print inner[k] ":" substr(buf, at[k])
      }
      { sub(/\r$/, "") }
      NR == 1 { sub(/^\357\273\277/, "") }
      tolower($0) ~ /^[ \t]*#[ \t]*escape[ \t]*=/ && $0 !~ /=[ \t]*\\[ \t]*$/ { print NR ":#escape" }
      /^[ \t]*#/ { next }
      cont && /^[ \t]*$/ { next }
      cont && tolower($0) ~ /^[ \t]*from([ \t]|\\|$)/ { froms++; inner[froms] = NR; at[froms] = length(buf) + 2 }
      { if (cont) buf = buf " " $0; else { buf = $0; start = NR; froms = 0 } }
      /\\[ \t]*$/ { sub(/\\[ \t]*$/, "", buf); cont = 1; next }
      { cont = 0; emit() }
      END { if (cont) emit() }
    ' "$file" | grep -iE '^[0-9]+:([[:space:]]*FROM([[:space:]]|$)|#escape$)'
  )
  if [ "$found_node" -eq 0 ]; then
    fail "$DOCKERFILE has no FROM node line"
  fi
}

read_package() {
  local file="$ROOT/$PACKAGE" value
  if [ ! -f "$file" ]; then
    fail "$PACKAGE not found"
    return
  fi
  # Exit 1: not JSON. Exit 3: @types/node in both fields, which leaves the
  # installed one to npm.
  value=$(PIN_FILE="$file" node -e '
    let pkg;
    try {
      pkg = JSON.parse(require("fs").readFileSync(process.env.PIN_FILE, "utf8"));
    } catch {
      process.exit(1);
    }
    const dev = pkg?.devDependencies?.["@types/node"];
    const dep = pkg?.dependencies?.["@types/node"];
    if (dev !== undefined && dep !== undefined) process.exit(3);
    const v = dev ?? dep;
    if (typeof v === "string") console.log(v);
  ')
  case $? in
    0) ;;
    3)
      fail "$PACKAGE lists @types/node in both devDependencies and dependencies"
      return
      ;;
    *)
      fail "$PACKAGE is not valid JSON"
      return
      ;;
  esac
  if [ -z "$value" ]; then
    fail "$PACKAGE has no @types/node in devDependencies or dependencies"
    return
  fi
  # One major: ^24.12.4, ~24.1.0, 24.12.4, 24, 24.x. A range that spans
  # majors (>=24, ^24 || ^26) or names none (*, latest) fails. The pattern
  # sits in a variable because bash drops the backslash of a `[\^~]` written
  # inline, which turns the class into "not ~".
  local one_major='^[~^]?v?([0-9]+)(\.([0-9]+|x|\*)){0,2}(-[0-9A-Za-z.-]+)?$'
  if [[ ! "$value" =~ $one_major ]]; then
    fail "$PACKAGE @types/node '$value' does not pin one Node major"
    return
  fi
  pin "$PACKAGE @types/node" "${BASH_REMATCH[1]}" "$value"
}

read_nvmrc
read_dockerfile
read_package

expected="${major[0]:-}"
differ=0
for v in "${major[@]}"; do
  if [ "$v" != "$expected" ]; then differ=1; fi
done

if [ "$differ" -eq 1 ] || [ "$status" -ne 0 ]; then
  if [ "$differ" -eq 1 ]; then echo "check-node-pins: the Node majors differ" >&2; fi
  for i in "${!where[@]}"; do
    printf '  %s  %s (%s)\n' "${where[$i]}" "${major[$i]}" "${shown[$i]}" >&2
  done
  exit 1
fi

echo "check-node-pins: ${#major[@]} pins read Node $expected ($NVMRC, $DOCKERFILE, $PACKAGE @types/node)"
running=$(node --version)
running=${running#v}
if [ "${running%%.*}" != "$expected" ]; then
  echo "check-node-pins: warning: this shell runs Node $running, not $expected." \
    "The dev shell's Node comes from flake.nix, which Renovate does not update." >&2
fi
