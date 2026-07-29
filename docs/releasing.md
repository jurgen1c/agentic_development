# Releasing Agentic Development

Release only after the exact dependency versions already exist in npm.

1. Confirm `main` is clean and synchronized with `origin/main`.
2. Run `bun install --frozen-lockfile`.
3. Run `bun run ci`.
4. Run `bun run verify:package`.
5. Confirm the target version is unused in npm.
6. Create and push the matching `vX.Y.Z` GitHub release tag.

The publish workflow validates package/tag alignment, reruns the full gate,
tests a clean consumer install, and publishes with npm provenance.

If a GitHub release exists but npm publication failed and the version remains
unused, fix the cause, delete that failed GitHub release and tag, then recreate
the same version from the corrected commit. Never move a version that exists in
npm.
