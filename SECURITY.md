# Security Policy

## Reporting a Vulnerability

If you discover a security issue in mdview — engine, themes, format, CLI, web app, browser extension, VS Code extension, or MCP server — please report it **privately** so we can fix it before public disclosure.

### How to report

**Email**: support@kip2.com

If the issue is sensitive, encrypt your report with PGP. Public key fingerprint is published at <https://mdview.sh/.well-known/security.txt> (when available).

**Please include**:

- A description of the vulnerability
- Steps to reproduce, ideally with a minimal repro
- Affected version(s) and surface (engine / desktop / web / etc.)
- Your impact assessment (read-only / data leakage / RCE / etc.)
- Whether you've published / disclosed elsewhere

**Please don't**:

- File a public GitHub issue or discussion for security bugs
- Tweet / post about it before we've coordinated disclosure

## Response timeline

| Stage                                 | SLA                                                          |
| ------------------------------------- | ------------------------------------------------------------ |
| Acknowledge receipt                   | Within 48 hours                                              |
| Initial triage (severity assessment)  | Within 5 business days                                       |
| Patch released for confirmed issues   | Within 30 days for high/critical, best-effort for medium/low |
| Public advisory (CVE / security note) | Coordinated with reporter                                    |

## Scope

### In scope

- mdview engine (`@mdview/core`) — XSS via crafted markdown, sanitize bypass, prototype pollution
- Format serialization (`@mdview/format`) — script injection through `.mdv.html` parsing
- Browser extension — privilege escalation, content-script injection issues
- mdview.sh — SSRF in URL preview, short-link abuse, KV data leakage
- MCP server — command injection, path traversal in render input
- CLI — argument injection, path traversal

### Out of scope

- Issues only reproducible with disabled DOMPurify or in custom forks
- Self-XSS (user pasting malicious code into their own browser console)
- Social engineering attacks
- Theoretical attacks without a working PoC
- Vulnerabilities in upstream dependencies (markdown-it, mermaid, KaTeX, DOMPurify) — please report those upstream first; we'll coordinate

## Acknowledgments

We don't currently have a bug bounty program. We will publicly acknowledge security researchers who report responsibly (with permission) in:

- Release notes
- The `SECURITY.md` "Hall of fame" section (below)
- A line in the patched commit message

## Hall of fame

<!-- Reporters who responsibly disclosed will be listed here. -->

_None yet._

## Past advisories

<!-- CVE / GHSA links, when issued. -->

_None yet._
