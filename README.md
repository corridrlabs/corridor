# Corridor

<div align="center">
  <a href="https://corridor-flax.vercel.app" target="_blank" rel="noopener noreferrer">
    <img src="docs/assets/corridor-banner.svg" alt="Corridor banner" width="100%" />
  </a>

  **Corridor, the developers' financial cloud:** an open-source platform for global payments, treasury, payroll rails, and programmable money workflows. Build faster with SDKs, API specs, MCP tooling, and production-ready integration guides.

  [![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
  [![Go](https://img.shields.io/badge/Go-1.24-blue.svg)](backend/go.mod)
  [![React](https://img.shields.io/badge/React-18-blue.svg)](frontend/package.json)
</div>

## Learn About Corridor 🧑‍💻
- Read platform and API documentation in the [Corridor docs repo](https://github.com/corridrlabs/docs).
- Explore docs-site source in [docs-site](https://github.com/corridrlabs/docs-site).
- Use API contracts in [openapi](https://github.com/corridrlabs/openapi) and [api-specs](https://github.com/corridrlabs/api-specs).
- Build agent-native flows with [mcp](https://github.com/corridrlabs/mcp) and [mcp-tools](https://github.com/corridrlabs/mcp-tools).
- Start quickly from [examples](https://github.com/corridrlabs/examples) and [starters](https://github.com/corridrlabs/starters).

## Open Ecosystem 🌍
- SDKs: [sdk-js](https://github.com/corridrlabs/sdk-js), [sdk-python](https://github.com/corridrlabs/sdk-python), [sdk-go](https://github.com/corridrlabs/sdk-go), [sdk-rust](https://github.com/corridrlabs/sdk-rust), [sdk-kotlin](https://github.com/corridrlabs/sdk-kotlin), [sdk-swift](https://github.com/corridrlabs/sdk-swift), [sdk-php](https://github.com/corridrlabs/sdk-php), [sdk-ruby](https://github.com/corridrlabs/sdk-ruby), [sdk-dotnet](https://github.com/corridrlabs/sdk-dotnet), [sdk-dart](https://github.com/corridrlabs/sdk-dart), [sdk-react-native](https://github.com/corridrlabs/sdk-react-native).
- Plugins and tooling: [chatgpt-plugin](https://github.com/corridrlabs/chatgpt-plugin), [claude-plugin](https://github.com/corridrlabs/claude-plugin), [cursor-plugin](https://github.com/corridrlabs/cursor-plugin), [terraform-provider](https://github.com/corridrlabs/terraform-provider), [postman](https://github.com/corridrlabs/postman).
- Platform updates: [changelog](https://github.com/corridrlabs/changelog), [status](https://github.com/corridrlabs/status), [roadmap](https://github.com/corridrlabs/roadmap).

## Connect With Us 🫂
- Follow the organization: [corridrlabs on GitHub](https://github.com/corridrlabs).
- Star the core product repo: [corridrlabs/corridor](https://github.com/corridrlabs/corridor).
- Browse docs and product surface: [corridor-flax.vercel.app](https://corridor-flax.vercel.app/).
- Contact support: [jamesthaura51@gmail.com](mailto:jamesthaura51@gmail.com).

## Local Development ⚙️
### Prerequisites ✅
- Go 1.24+
- Node.js 18+
- PostgreSQL
- Redis

### Run Backend 🚀
```bash
cd backend
go run ./cmd/api
```

### Run Frontend 🖥️
```bash
cd frontend
npm install
npm run dev
```

### Test 🧪
```bash
cd backend && go test ./...
cd frontend && npm run build
```
