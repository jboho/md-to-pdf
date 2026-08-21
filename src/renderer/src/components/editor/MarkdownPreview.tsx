import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import rehypeRaw from 'rehype-raw'
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize'

// Extend the default sanitize schema so highlighted code blocks (rehype-highlight
// adds hljs-* classes) still render, while raw HTML from untrusted markdown files
// (event handlers, <script>, javascript: URLs, etc.) is stripped.
const sanitizeSchema = {
  ...defaultSchema,
  attributes: {
    ...defaultSchema.attributes,
    code: [...(defaultSchema.attributes?.code ?? []), ['className', /^hljs-/, /^language-/]],
    span: [...(defaultSchema.attributes?.span ?? []), ['className', /^hljs-/]]
  }
}

interface Props {
  content: string
  customCss?: string
  pdfPreview?: boolean
}

export default function MarkdownPreview({ content, customCss, pdfPreview }: Props): React.ReactElement {
  return (
    <div
      className="h-full overflow-auto"
      style={pdfPreview ? { background: '#fff', color: '#1f2328' } : undefined}
    >
      {customCss && <style>{customCss}</style>}
      <div className="markdown-body p-6">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeHighlight, rehypeRaw, [rehypeSanitize, sanitizeSchema]]}
        >
          {content}
        </ReactMarkdown>
      </div>
    </div>
  )
}
