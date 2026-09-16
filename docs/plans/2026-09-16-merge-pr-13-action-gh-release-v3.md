# Merge PR #13 (softprops/action-gh-release v2 -> v3) before that tag

## Status
PR #13 (`ci: bump softprops/action-gh-release to v3 (Node 20 deprecation)`) is already merged into `main` (commit history includes it). This plan documents the verification done for tracking purposes.

## Why
The v1.0.1 release run surfaced a Node 20 deprecation warning: `softprops/action-gh-release@v2` runs on Node 20 but is forced onto Node 24. Upstream's `v2` tag is frozen at `2.6.2`; the Node 24 runtime only ships on the `v3` line. Bumping to `v3` removes the last Node 20 pin from the release path (`.github/workflows/release.yml`).

## Verification
- `gh pr view 13` confirms state `MERGED`.
- The bump is runtime-only (v3.0.0-v3.0.3 changelog: Node 20 -> 24 runtime, dependency maintenance, draft/prerelease handling, error classification) with no input/behavior changes affecting this workflow's usage (only `files:` is passed).
- Real exercise happens on the next `vX.Y.Z` tag push, since `release.yml` only runs on version tags.

## Outcome
No further action needed on this item; it will be exercised on the next tag push.
