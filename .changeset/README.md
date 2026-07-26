# Changesets

This folder is managed by [Changesets](https://github.com/changesets/changesets)
to version and publish the `@zenith-visuals/*` packages.

## Workflow

1. After making changes, describe them:

   ```bash
   pnpm changeset
   ```

   Select the affected packages and a semver bump (patch / minor / major).

2. Apply version bumps and update changelogs:

   ```bash
   pnpm version-packages
   ```

3. Build and publish everything that changed to npm:

   ```bash
   pnpm release
   ```

`pnpm release` runs the full build first, then `changeset publish`, which
publishes only the packages whose versions changed and rewrites the internal
`workspace:*` dependency ranges to real version numbers automatically.
