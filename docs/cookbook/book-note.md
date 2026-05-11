---
mdview: 1
title: Notes on "The Mythical Man-Month"
description: Reading notes on Fred Brooks' classic, distilled into 3 ideas worth carrying forward.
theme: medium
font: charter
fontSize: 19px
maxWidth: 680px
toc: true
readingTime: true
extensions:
  - mdv:callout
author:
  name: Reader
created: 2026-05-10
---

# Notes on "The Mythical Man-Month"

These are personal reading notes — what stuck, why, and what I want to revisit.
Substitute your own book and your own takeaways.

## The three ideas worth keeping

### 1. Adding people to a late project makes it later

Brooks' Law. The intuition: each new person needs ramp-up time, and they pull
existing people away from work to onboard them. The _coordination cost_ grows
faster than linearly with team size — every pair of people is a potential
communication channel, so adding one person to a team of N adds N new channels.

> [!quote] Brooks
> Adding manpower to a late software project makes it later.

This is famously misquoted as "always". It's not always — the law applies when
the work isn't perfectly partitionable. Most software work isn't.

### 2. The second-system effect

A designer's first system is small and disciplined; their second is grand and
over-engineered, because they finally have the experience to imagine all the
ways their constraints could be relaxed. The second system is where you build
"everything you wanted to build the first time and didn't know how."

The cure: explicit budget. Not "what could we add?" but "what's the smallest
useful version?"

### 3. Conceptual integrity

> [!quote] Brooks
> Conceptual integrity is the most important consideration in system design.

Better to have a coherent system designed by one person, even if it has flaws,
than a feature-complete one by committee. mdview's "engine-first" architecture
is partly an attempt at this — one core, many shells.

## What I want to revisit

- The chapter on "the surgical team" — I read it years ago and it's been
  rattling around. The idea: software development should be organized like a
  surgical team, with one chief programmer and supporting roles, not a cell of
  generalists.
- The afterword in the 20th-anniversary edition. He revisits which of his
  predictions held up. (Brooks was honest about being wrong.)

## Connections to other books

- Brooks → Conway → "any organization that designs a system will produce a
  design whose structure is a copy of its organization's communication
  structure"
- Brooks → DeMarco/Lister "Peopleware" → environment matters more than tooling
