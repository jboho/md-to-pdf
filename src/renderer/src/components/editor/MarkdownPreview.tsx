import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import rehypeRaw from 'rehype-raw'

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
          rehypePlugins={[rehypeHighlight, rehypeRaw]}
        >
          {content}
        </ReactMarkdown>
      </div>
    </div>
  )
}
