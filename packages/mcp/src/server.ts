#!/usr/bin/env node
// mdview MCP server —— 通过 stdio 把 mdview 渲染能力暴露给 Claude / 其他 MCP 客户端
//
// 提供的 tool：
//   - render(markdown, theme?, extensions?)        → { html, meta, headings }
//   - export_mdv_html(markdown, form, theme?)      → { html, suggestedFilename }
//   - convert_form(html, to)                       → { html }
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { render } from '@mdview/core';
import { themeDefaults, BUILT_IN_THEMES } from '@mdview/themes';
import { toMdvHtml, convertForm, type MdvForm } from '@mdview/format';

const server = new Server(
  { name: 'mdview', version: '0.0.1' },
  { capabilities: { tools: {} } },
);

// ── Tool 描述 ──────────────────────────────────────────────────
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: 'render',
      description:
        'Render Markdown to HTML using the mdview engine. Returns the rendered HTML body, parsed metadata (front matter merged with theme defaults), and the heading tree.',
      inputSchema: {
        type: 'object',
        properties: {
          markdown: {
            type: 'string',
            description: 'The Markdown source. May include YAML front matter.',
          },
          theme: {
            type: 'string',
            description: `Theme id. One of: ${BUILT_IN_THEMES.map((t) => t.id).join(' | ')}.`,
            default: 'default',
          },
          extensions: {
            type: 'array',
            items: { type: 'string' },
            description:
              'Extension IDs to enable. Built-in: mdv:color, mdv:callout, mdv:math, mdv:mermaid.',
          },
        },
        required: ['markdown'],
      },
    },
    {
      name: 'export_mdv_html',
      description:
        'Serialize Markdown into a self-rendering .mdv.html file (Minimal / Progressive / Standalone form). Progressive form is recommended for general sharing.',
      inputSchema: {
        type: 'object',
        properties: {
          markdown: { type: 'string' },
          form: {
            type: 'string',
            enum: ['minimal', 'progressive', 'standalone'],
            default: 'progressive',
          },
          theme: { type: 'string', default: 'default' },
        },
        required: ['markdown'],
      },
    },
    {
      name: 'convert_form',
      description:
        'Convert an existing .mdv.html between Minimal / Progressive / Standalone forms while preserving the embedded markdown source.',
      inputSchema: {
        type: 'object',
        properties: {
          html: { type: 'string', description: 'Existing .mdv.html content.' },
          to: { type: 'string', enum: ['minimal', 'progressive', 'standalone'] },
        },
        required: ['html', 'to'],
      },
    },
    {
      name: 'list_themes',
      description: 'List built-in mdview themes.',
      inputSchema: { type: 'object', properties: {} },
    },
  ],
}));

// ── Tool 实现 ─────────────────────────────────────────────────
server.setRequestHandler(CallToolRequestSchema, async (req) => {
  const { name, arguments: args } = req.params;

  switch (name) {
    case 'render': {
      const a = args as { markdown: string; theme?: string; extensions?: string[] };
      const result = render(a.markdown, {
        themeDefaults: themeDefaults(a.theme ?? 'default'),
        extensions: a.extensions,
      });
      return jsonResult({
        html: result.html,
        meta: result.meta,
        headings: result.headings,
      });
    }

    case 'export_mdv_html': {
      const a = args as { markdown: string; form?: MdvForm; theme?: string };
      const form = a.form ?? 'progressive';
      const themeId = a.theme ?? 'default';
      const prerendered =
        form === 'progressive' || form === 'standalone'
          ? render(a.markdown, { themeDefaults: themeDefaults(themeId) }).html
          : undefined;

      const html = toMdvHtml(a.markdown, {
        form,
        engine: { url: 'https://cdn.mdview.sh/r/v1.js' },
        theme: { id: themeId, url: `https://cdn.mdview.sh/themes/${themeId}.css` },
        prerenderedHtml: prerendered,
      });
      return jsonResult({
        html,
        suggestedFilename: `document.${form === 'progressive' ? '' : form + '.'}mdv.html`,
      });
    }

    case 'convert_form': {
      const a = args as { html: string; to: MdvForm };
      const out = convertForm(a.html, a.to);
      return jsonResult({ html: out });
    }

    case 'list_themes': {
      return jsonResult({ themes: BUILT_IN_THEMES });
    }

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
});

function jsonResult(payload: unknown) {
  return {
    content: [
      {
        type: 'text' as const,
        text: JSON.stringify(payload, null, 2),
      },
    ],
  };
}

// ── 启动 ──────────────────────────────────────────────────────
const transport = new StdioServerTransport();
await server.connect(transport);
// 不要 console.log（会污染 stdio 协议），用 stderr
console.error('[mdview-mcp] ready on stdio');
