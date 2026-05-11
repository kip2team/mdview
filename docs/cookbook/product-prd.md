---
mdview: 1
title: PRD · Inline Comments v2
description: Product requirements doc for the second iteration of inline comments.
theme: default
toc: true
toc.position: right
extensions:
  - mdv:callout
  - mdv:kbd
author:
  name: Product Team
created: 2026-05-10
---

# PRD · Inline Comments v2

> [!warning] Status: Draft · Reviewer: @king
> This is a working document. Sign off in the table at the bottom before kickoff.

## TL;DR

Re-design the inline-comments feature so users can drop a thread on any
sentence in a document, get notifications when their thread is replied to,
and resolve threads inline.

## Problem

Today, a user wanting to comment on someone's doc has to:

1. Copy the relevant text
2. Switch to chat
3. Paste + comment + ping

This breaks flow. Average time-to-respond on questions is 2.4 days because
they're scattered across Slack threads instead of pinned to the doc.

## Goals (v2)

- **G1.** Users can select any text and start a thread.
- **G2.** Replies thread under the original anchor.
- **G3.** Notifications fire on reply / resolve.
- **G4.** Resolved threads collapse but stay accessible.

## Non-goals

- Not solving "comment on a Figma frame" (out of scope, owned by Design)
- Not building moderation tooling (post-v2)
- Not adding emoji reactions (v3)

## User flows

### Starting a thread

1. User selects text (highlight)
2. Floating action: [[Cmd+Shift+M]] or right-click → "Comment"
3. Inline composer appears anchored to the selection
4. Submits, anchor turns yellow

### Resolving

1. Click thread → "Resolve" button
2. Thread collapses, anchor color goes to gray
3. [[Cmd+Z]] within 5s undoes resolve

## Edge cases

> [!danger] Anchor drift
> If the underlying text changes after a thread is created, the anchor must
> stay attached. Implementation should snapshot a fuzzy match on the surrounding
> 50 chars and reattach if the exact match disappears.

## Metrics

| Metric                        | Today    | Target              |
| ----------------------------- | -------- | ------------------- |
| Median time-to-first-reply    | 2.4 days | < 4 hours           |
| % docs with at least 1 thread | 12%      | > 35%               |
| Thread resolution rate        | n/a      | > 80% within 1 week |

## Open questions

1. Anonymous comments allowed? (legal say no by default)
2. Email digest for unread replies — daily or instant?
3. Should `@channel`-style mention notify everyone, or only authors of replies?

## Sign-off

| Stakeholder | Name | Status |
| ----------- | ---- | ------ |
| Eng lead    | \_   | \_     |
| Design lead | \_   | \_     |
| Legal       | \_   | \_     |
| PM          | \_   | \_     |
