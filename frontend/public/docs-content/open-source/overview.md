# Corridor Open Source Ecosystem

Corridor's open-source program is organized as a public product system, not a pile of unrelated repos. The goal is to make the public surface clear, reproducible, and easy to contribute to.

The canonical public home is the organization repository list:

- https://github.com/orgs/corridrlabs/repositories

## Canonical Scope

The public ecosystem is grouped into these layers:

1. **Learn About Corridor**
2. **Docs and integration guides**
3. **Documentation site source**
4. **API contracts and schemas**
5. **AI-native automation via MCP**
6. **SDKs and libraries**
7. **Plugins and tooling**
8. **Platform updates**
9. **Starters and examples**

## How the pieces fit together

| Layer | What it does | Primary source of truth |
| --- | --- | --- |
| Docs and guides | Explains product behavior, APIs, and implementation rules | `docs/` and mirrored docs content |
| Docs site | Publishes the docs UI and navigation | `docs-site` |
| API contracts | Defines endpoints, schemas, and event formats | `openapi` and `api-specs` |
| MCP | Exposes approved product actions to agents | `mcp` and `mcp-tools` |
| SDKs | Provide typed clients for supported languages | Generated from API contracts |
| Plugins | Connect Corridor into popular developer tools | `chatgpt-plugin`, `claude-plugin`, `cursor-plugin`, `terraform-provider`, `postman` |
| Updates | Communicate changes, incidents, and release plans | `changelog`, `status`, `roadmap` |
| Starters | Shorten time-to-first-success | Example apps, boilerplates, and templates |

## Implementation model

### 1. Write the contract first
- Define the API in OpenAPI and related schema files.
- Treat contract changes as breaking until proven otherwise.
- Validate the contract in CI before publishing SDKs.

### 2. Publish docs from one source
- Keep authoritative docs in the docs tree.
- Mirror only curated content into the public docs site.
- Make navigation stable so users can find the same topic across the site and repo docs.

### 3. Generate SDKs from contracts
- Generate client libraries from the canonical API definitions where possible.
- Keep hand-written wrappers only where the generated output is not enough.
- Publish versioned releases per language.

### 4. Expose AI tools through MCP
- Keep MCP tool names stable.
- Separate public read-only tools from account-scoped write tools.
- Document both stdio and HTTP transports.

### 5. Publish platform updates separately
- Keep changelog, status, and roadmap in public repos.
- Avoid mixing release notes with aspirational marketing copy.

## Public repo policy

- Public repos should contain source, docs, examples, and reproducible build instructions.
- Private repos should remain the source for sensitive backend logic, secrets, and live operational configuration.
- Mirror workflows should publish approved subtrees and never leak `.env`, keys, or build artifacts.

## Repo groups

### Learn About Corridor
- Docs and integration guides in `docs`
- Docs website source in `docs-site`
- API contracts in `openapi` and `api-specs`
- AI-native financial automations in `mcp` and `mcp-tools`
- Quickstarts and starters in example repos

### Open Source Repositories
- SDKs: `sdk-js`, `sdk-python`, `sdk-go`, `sdk-rust`, `sdk-kotlin`, `sdk-swift`, `sdk-php`, `sdk-ruby`, `sdk-dotnet`, `sdk-dart`, `sdk-react-native`
- Plugins and tools: `chatgpt-plugin`, `claude-plugin`, `cursor-plugin`, `terraform-provider`, `postman`
- Platform updates: `changelog`, `status`, `roadmap`

## Documentation set

The open-source program should have one individual document per repo family:

- `docs-site.md`
- `contracts.md`
- `mcp.md`
- `sdks.md`
- `plugins-tools.md`
- `platform-updates.md`
- `starters.md`

## Contribution principle

Each public repo should answer three questions clearly:

1. What problem does this repo solve?
2. What is the canonical source it depends on?
3. How do contributors verify their changes?

