# Docs Site

The docs site is the public presentation layer for Corridor documentation. It should make the product understandable, searchable, and easy to navigate.

## Purpose

- Publish product docs, API references, and guides.
- Provide a stable place for developers, partners, and users to learn the platform.
- Mirror only approved content from the source docs tree.

## Core features

- MDX or markdown rendering with consistent typography.
- Search and section navigation.
- Dark and light mode support.
- Previous and next page navigation without page numbers.
- Copy actions for code and content blocks.
- Mobile-friendly sidebar and top navigation.

## Implementation scope

- Source content lives in the canonical docs repository.
- The docs site consumes mirrored markdown content for public pages.
- Open-source repos can publish docs fragments into the docs site when they are stable.
- Release notes and platform updates should link back to canonical docs.

## Content model

The docs site should have sections for:

- Getting started
- Business flows
- API reference
- Integrations
- MCP and AI tooling
- Open source ecosystem
- Security and trust

## What it is not

- It is not the backend.
- It is not a marketing landing page.
- It is not a place for unpublished internal implementation notes.

