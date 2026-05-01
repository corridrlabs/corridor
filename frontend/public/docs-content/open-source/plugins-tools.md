# Plugins and Tools

Plugins connect Corridor to the tools developers already use.

## Target repos

- `chatgpt-plugin`
- `claude-plugin`
- `cursor-plugin`
- `terraform-provider`
- `postman`

## Purpose

- Let users reach Corridor from chat, IDEs, infrastructure tooling, and API clients.
- Reduce friction between Corridor and existing workflows.
- Make the product feel native inside developer tools.

## Core features

- Tool manifests and permissions.
- Sample prompts and workflows.
- Environment variable setup.
- Official collections and examples.
- Provider resources for infrastructure automation.

## Implementation scope

- Chat and IDE plugins should wrap the MCP or API contract layer.
- Terraform should manage infrastructure and account configuration, not hidden payment logic.
- Postman assets should match the published API contract and examples.

## What each doc should cover

- Installation
- Authentication
- First successful action
- Permissions
- Troubleshooting
- Release/version compatibility

