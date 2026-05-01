# SDKs and Libraries

The SDK repos expose Corridor to application developers in their preferred language.

## Purpose

- Provide typed clients for the public API.
- Make auth, webhooks, retries, and pagination easier.
- Reduce integration time across languages and runtimes.

## Target repos

- `sdk-js`
- `sdk-python`
- `sdk-go`
- `sdk-rust`
- `sdk-kotlin`
- `sdk-swift`
- `sdk-php`
- `sdk-ruby`
- `sdk-dotnet`
- `sdk-dart`
- `sdk-react-native`

## Core features

- Generated request/response types.
- Consistent auth helpers.
- Retry and idempotency support.
- Webhook verification utilities.
- Versioned release tags.

## Implementation scope

- Keep the OpenAPI contract as the generation source where possible.
- Add language-specific ergonomics only where needed.
- Keep package docs short, direct, and example-driven.
- Publish each SDK with its own changelog and release notes.

## What each SDK doc should include

- Installation
- Authentication
- First request
- Error handling
- Pagination
- Webhook verification
- Example app

