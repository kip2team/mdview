---
mdview: 1
title: mdview HTTP API · v1
description: REST endpoints for programmatic Markdown rendering and short link management.
theme: github
toc: true
toc.position: right
toc.depth: 2
extensions:
  - mdv:callout
  - mdv:kbd
canonical: https://api.mdview.sh/docs
---

# mdview HTTP API · v1

> [!note] Base URL
> All endpoints listed here are relative to `https://api.mdview.sh/v1`.

## Authentication

Pass your fine-grained token in the `Authorization` header:

```http
GET /render
Authorization: Bearer mdv_pat_xxxxxxxxxx
Content-Type: application/json
```

Tokens are issued from <https://mdview.sh/account/tokens>. Scope is per-token:
choose `render:readwrite` for the rendering endpoints, `link:readwrite` for
short-link management.

> [!warning] Rate limits
> Anonymous: 60 requests/hour per IP.
> Authenticated: 1000 requests/hour per token.

## Endpoints

### `POST /render`

Render a Markdown source to HTML using the mdview engine.

**Request body**

```json
{
  "markdown": "# Hello\n\nworld",
  "theme": "medium",
  "extensions": ["mdv:color", "mdv:callout"]
}
```

**Response 200**

```json
{
  "html": "<h1 id=\"hello\">Hello</h1>\n<p>world</p>\n",
  "meta": { "title": "Hello", "theme": "medium" },
  "headings": [{ "level": 1, "id": "hello", "text": "Hello" }]
}
```

**Errors**

| Code | Reason |
|---|---|
| 400 | Missing or invalid `markdown` field |
| 401 | Token missing or invalid |
| 413 | Markdown over 1 MB |
| 429 | Rate limit |

### `POST /export`

Export Markdown to a self-rendering `.mdv.html`.

**Request body**

```json
{
  "markdown": "...",
  "form": "progressive",
  "theme": "default"
}
```

**Response 200** — body is the raw `.mdv.html` content with `Content-Type: text/html`.

### `POST /links`

Create a short link to a Markdown URL.

**Request body**

```json
{ "url": "https://raw.githubusercontent.com/.../README.md", "theme": "github" }
```

**Response 200**

```json
{ "slug": "AbC123", "shortUrl": "https://mdview.sh/AbC123" }
```

### `GET /links/:slug`

Resolve a short link.

**Response 200**

```json
{
  "slug": "AbC123",
  "url": "https://raw.githubusercontent.com/...",
  "theme": "github",
  "createdAt": 1730000000000,
  "lastAccessedAt": 1730050000000,
  "hits": 42
}
```

## Versioning

The API uses URL versioning (`/v1`). Breaking changes ship as a new major
(`/v2`) with v1 supported for at least 12 months alongside.

## SDKs

| Language | Package | Repo |
|---|---|---|
| Node / TypeScript | `@mdview/sdk` | [npm](https://www.npmjs.com/package/@mdview/sdk) |
| Python | `mdview-py` | (planned) |
| Go | `mdview-go` | (planned) |

## Quick start

```bash
curl -X POST https://api.mdview.sh/v1/render \
  -H "Authorization: Bearer $MDVIEW_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"markdown": "# Hello\n\nworld", "theme": "medium"}'
```

Press [[Ctrl+C]] to abort.
