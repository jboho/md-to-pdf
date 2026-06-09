import type { ThemeName } from '../../../preload/types'

const themes: Record<ThemeName, string> = {
  github: `
.markdown-body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
  font-size: 16px;
  line-height: 1.6;
  color: #1f2328;
  max-width: 100%;
  padding: 2em;
}
.markdown-body h1, .markdown-body h2 {
  border-bottom: 1px solid #d1d9e0;
  padding-bottom: 0.3em;
}
.markdown-body h1 { font-size: 2em; margin: 0.67em 0; }
.markdown-body h2 { font-size: 1.5em; margin: 0.83em 0; }
.markdown-body h3 { font-size: 1.25em; margin: 1em 0; }
.markdown-body h4 { font-size: 1em; margin: 1.33em 0; }
.markdown-body p { margin: 1em 0; }
.markdown-body a { color: #0969da; text-decoration: none; }
.markdown-body a:hover { text-decoration: underline; }
.markdown-body code {
  background: #f6f8fa;
  border-radius: 6px;
  padding: 0.2em 0.4em;
  font-size: 85%;
  font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace;
}
.markdown-body pre {
  background: #f6f8fa;
  border-radius: 6px;
  padding: 16px;
  overflow: auto;
  line-height: 1.45;
}
.markdown-body pre code {
  background: transparent;
  padding: 0;
  font-size: 85%;
}
.markdown-body blockquote {
  border-left: 4px solid #d1d9e0;
  color: #656d76;
  margin: 1em 0;
  padding: 0 1em;
}
.markdown-body table {
  border-collapse: collapse;
  width: 100%;
  margin: 1em 0;
}
.markdown-body th, .markdown-body td {
  border: 1px solid #d1d9e0;
  padding: 6px 13px;
}
.markdown-body th {
  background: #f6f8fa;
  font-weight: 600;
}
.markdown-body tr:nth-child(even) { background: #f6f8fa; }
.markdown-body img { max-width: 100%; }
.markdown-body hr {
  border: none;
  border-top: 1px solid #d1d9e0;
  margin: 2em 0;
}
.markdown-body ul, .markdown-body ol { padding-left: 2em; margin: 1em 0; }
.markdown-body li { margin: 0.25em 0; }
`,

  academic: `
.markdown-body {
  font-family: "Times New Roman", Times, Georgia, serif;
  font-size: 12pt;
  line-height: 2;
  color: #000;
  max-width: 100%;
  padding: 2em;
}
.markdown-body h1 {
  font-size: 18pt;
  text-align: center;
  margin: 1em 0 0.5em;
  font-weight: bold;
}
.markdown-body h2 {
  font-size: 14pt;
  margin: 1.5em 0 0.5em;
  font-weight: bold;
}
.markdown-body h3 {
  font-size: 12pt;
  margin: 1.2em 0 0.5em;
  font-weight: bold;
  font-style: italic;
}
.markdown-body p {
  margin: 0;
  text-indent: 2em;
  text-align: justify;
}
.markdown-body p:first-of-type { text-indent: 0; }
.markdown-body a { color: #000; text-decoration: underline; }
.markdown-body code {
  font-family: "Courier New", Courier, monospace;
  font-size: 10pt;
}
.markdown-body pre {
  background: #f5f5f5;
  border: 1px solid #ccc;
  padding: 1em;
  margin: 1em 0;
  overflow: auto;
  line-height: 1.4;
}
.markdown-body pre code { font-size: 10pt; }
.markdown-body blockquote {
  margin: 1em 2em;
  font-style: italic;
}
.markdown-body table {
  border-collapse: collapse;
  width: 100%;
  margin: 1em 0;
  font-size: 11pt;
}
.markdown-body th, .markdown-body td {
  border: 1px solid #000;
  padding: 4px 8px;
}
.markdown-body th { font-weight: bold; text-align: center; }
.markdown-body img { max-width: 100%; }
.markdown-body hr { border: none; border-top: 1px solid #000; margin: 2em 0; }
.markdown-body ul, .markdown-body ol { padding-left: 2em; margin: 0.5em 0; }
`,

  minimal: `
.markdown-body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
  font-size: 15px;
  line-height: 1.8;
  color: #333;
  max-width: 100%;
  padding: 2em;
}
.markdown-body h1 { font-size: 1.8em; font-weight: 300; margin: 1.5em 0 0.5em; }
.markdown-body h2 { font-size: 1.4em; font-weight: 400; margin: 1.3em 0 0.4em; }
.markdown-body h3 { font-size: 1.1em; font-weight: 600; margin: 1.2em 0 0.4em; }
.markdown-body p { margin: 1em 0; }
.markdown-body a { color: #555; border-bottom: 1px solid #ccc; text-decoration: none; }
.markdown-body code {
  font-family: ui-monospace, SFMono-Regular, monospace;
  font-size: 90%;
  color: #555;
}
.markdown-body pre {
  padding: 1.2em;
  margin: 1.5em 0;
  overflow: auto;
  border-left: 3px solid #ddd;
  background: transparent;
}
.markdown-body pre code { font-size: 85%; color: #333; }
.markdown-body blockquote {
  border-left: 3px solid #ddd;
  color: #777;
  margin: 1.5em 0;
  padding: 0 1.2em;
  font-style: italic;
}
.markdown-body table { border-collapse: collapse; width: 100%; margin: 1.5em 0; }
.markdown-body th, .markdown-body td { padding: 8px 12px; text-align: left; }
.markdown-body th { border-bottom: 2px solid #ddd; font-weight: 600; }
.markdown-body td { border-bottom: 1px solid #eee; }
.markdown-body img { max-width: 100%; }
.markdown-body hr { border: none; border-top: 1px solid #eee; margin: 3em 0; }
.markdown-body ul, .markdown-body ol { padding-left: 1.5em; margin: 1em 0; }
.markdown-body li { margin: 0.4em 0; }
`,

  manuscript: `
.markdown-body {
  font-family: "Courier New", Courier, monospace;
  font-size: 12pt;
  line-height: 2;
  color: #000;
  max-width: 100%;
  padding: 2em;
}
.markdown-body h1 {
  font-size: 12pt;
  text-align: center;
  text-transform: uppercase;
  margin: 2em 0 1em;
  font-weight: bold;
}
.markdown-body h2 {
  font-size: 12pt;
  text-align: center;
  margin: 2em 0 1em;
  font-weight: bold;
}
.markdown-body h3 {
  font-size: 12pt;
  margin: 1.5em 0 1em;
  text-decoration: underline;
}
.markdown-body p {
  margin: 0;
  text-indent: 3em;
}
.markdown-body a { color: #000; text-decoration: underline; }
.markdown-body code { font-size: 12pt; }
.markdown-body pre {
  margin: 1em 2em;
  overflow: auto;
  line-height: 1.5;
}
.markdown-body blockquote {
  margin: 1em 2em;
  border: none;
  font-style: italic;
}
.markdown-body table {
  border-collapse: collapse;
  width: 100%;
  margin: 1em 0;
}
.markdown-body th, .markdown-body td {
  border: 1px solid #000;
  padding: 4px 8px;
}
.markdown-body img { max-width: 100%; }
.markdown-body hr {
  border: none;
  text-align: center;
  margin: 2em 0;
}
.markdown-body hr::after { content: "# # #"; }
.markdown-body ul, .markdown-body ol { padding-left: 3em; margin: 1em 0; }
`
}

export function getThemeCss(theme: ThemeName): string {
  return themes[theme] ?? themes.github
}

export function getThemeNames(): ThemeName[] {
  return Object.keys(themes) as ThemeName[]
}
