import { marked } from 'marked'

export function buildHtml(
  markdownContent: string,
  themeCss: string,
  customCss: string
): string {
  const htmlBody = marked.parse(markdownContent, { async: false }) as string

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    /* Reset */
    * { margin: 0; padding: 0; box-sizing: border-box; }

    /* Theme styles */
    ${themeCss}

    /* User custom CSS */
    ${customCss}
  </style>
</head>
<body>
  <div class="markdown-body">
    ${htmlBody}
  </div>
</body>
</html>`
}
