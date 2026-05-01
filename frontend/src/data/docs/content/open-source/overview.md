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
- Public hub: `corridor`
- Releases and updates: `changelog`, `status`, `roadmap`
- Examples and starters: `starters`, `examples`, `webhooks-examples`
- Developer tools: `devtools`, `sdk-generator`, `sdk-cli`
- SDKs: `sdk-js`, `sdk-python`, `sdk-go`, `sdk-rust`, `sdk-kotlin`, `sdk-swift`, `sdk-php`, `sdk-ruby`, `sdk-dotnet`, `sdk-dart`, `sdk-react-native`
- Plugins and tools: `chatgpt-plugin`, `claude-plugin`, `cursor-plugin`, `terraform-provider`, `postman`
- Design system: `design-system`

## Publishing inventory

The sync workflow only updates repos that have a mapped source tree today.

| Target repo | Source path | Status |
| --- | --- | --- |
| `corridrlabs/corridor` | `corridor` | active |
| `corridrlabs/docs` | `docs` | active |
| `corridrlabs/openapi` | `docs/api` | active |
| `corridrlabs/docs-site` | `frontend/docs-site` | active |
| `corridrlabs/mcp` | `mcp` | active |
| `corridrlabs/mcp-tools` | `mcp-tools` | active |
| `corridrlabs/changelog` | `changelog` | active |
| `corridrlabs/status` | `status` | active |
| `corridrlabs/roadmap` | `roadmap` | active |
| `corridrlabs/starters` | `starters` | active |
| `corridrlabs/examples` | `examples` | active |
| `corridrlabs/devtools` | `devtools` | active |
| `corridrlabs/webhooks-examples` | `webhooks-examples` | active |
| `corridrlabs/design-system` | `design-system` | active |
| `corridrlabs/api-specs` | `api-specs` | active |
| `corridrlabs/sdk-generator` | `sdk/generator` | active |
| `corridrlabs/sdk-cli` | `sdk/cli` | active |
| `corridrlabs/sdk-js` | `sdk/javascript` | active |
| `corridrlabs/sdk-python` | `sdk/python` | active |
| `corridrlabs/sdk-react-native` | `sdk/react-native` | active |
| `corridrlabs/sdk-dart` | `sdk/dart` | active |
| `corridrlabs/sdk-go` | `sdk/go` | active |
| `corridrlabs/sdk-rust` | `sdk/rust` | active |
| `corridrlabs/sdk-kotlin` | `sdk/kotlin` | active |
| `corridrlabs/sdk-swift` | `sdk/swift` | active |
| `corridrlabs/sdk-php` | `sdk/php` | active |
| `corridrlabs/sdk-ruby` | `sdk/ruby` | active |
| `corridrlabs/sdk-dotnet` | `sdk/dotnet` | active |
| `corridrlabs/chatgpt-plugin` | `chatgpt-plugin` | active |
| `corridrlabs/claude-plugin` | `claude-plugin` | active |
| `corridrlabs/cursor-plugin` | `cursor-plugin` | active |
| `corridrlabs/terraform-provider` | `terraform-provider` | active |
| `corridrlabs/postman` | `postman` | active |

## Documentation set

The open-source program should have one individual document per repo family:

- `corridor.md`
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
