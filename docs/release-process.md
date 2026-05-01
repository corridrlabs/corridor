# Release process

Corridor public repos should be published in a controlled, repeatable way.

## Rules
- Keep releases tied to source changes.
- Publish only mapped source folders.
- Never mirror secrets or build outputs.
- Use versioned release notes when behavior changes.

## Flow
1. Update the source tree in the private monorepo.
2. Update docs and examples.
3. Push to `main`.
4. Mirror approved subtrees into the public repos.
5. Tag or note the release in the public update repos.

## Public update repos
- `changelog`
- `status`
- `roadmap`

