# Security notes

## npm audit: Next.js bundled PostCSS advisory

As of the initial scaffold, `npm audit --omit=dev` reports GHSA-qx2v-qp2m-jg93 through the `postcss` copy bundled inside `next@16.2.6`.

The app also pins direct `postcss@8.5.15`, which is outside the vulnerable range. The remaining advisory is for Next.js' internal bundled dependency and npm currently reports no compatible upgrade path for this scaffold; its suggested fix downgrades Next.js to `9.3.3`, which is not acceptable for this project.

Risk assessment for this app:

- The app does not expose user-provided CSS input.
- The public tunnel serves rendered planning pages, not a CSS authoring or build service.
- The vulnerable path is CSS stringification during build/tooling, not a user-facing editing workflow.

Decision:

- Accept this moderate advisory temporarily for v1 scaffolding.
- Keep dependencies pinned for reproducibility.
- Re-run `npm audit --omit=dev` during dependency updates and upgrade Next.js when a compatible patched release is available.
