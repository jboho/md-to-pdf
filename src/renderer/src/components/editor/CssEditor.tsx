import { useEffect, useRef } from 'react'
import { EditorView, keymap, lineNumbers, highlightActiveLine } from '@codemirror/view'
import { EditorState } from '@codemirror/state'
import { css } from '@codemirror/lang-css'
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands'
import {
  syntaxHighlighting,
  defaultHighlightStyle,
  bracketMatching
} from '@codemirror/language'
import { oneDark } from '@codemirror/theme-one-dark'

interface Props {
  value: string
  onChange: (value: string) => void
  darkMode?: boolean
  minHeight?: string
}

export default function CssEditor({
  value,
  onChange,
  darkMode = false,
  minHeight = '12rem'
}: Props): React.ReactElement {
  const containerRef = useRef<HTMLDivElement>(null)
  const viewRef = useRef<EditorView | null>(null)
  const onChangeRef = useRef(onChange)

  // Keep callback ref current without recreating editor
  useEffect(() => {
    onChangeRef.current = onChange
  }, [onChange])

  useEffect(() => {
    if (!containerRef.current) return

    const extensions = [
      lineNumbers(),
      highlightActiveLine(),
      history(),
      bracketMatching(),
      syntaxHighlighting(defaultHighlightStyle),
      css(),
      keymap.of([...defaultKeymap, ...historyKeymap]),
      EditorView.updateListener.of((update) => {
        if (update.docChanged) {
          onChangeRef.current(update.state.doc.toString())
        }
      }),
      EditorView.theme({
        '&': {
          minHeight,
          fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace',
          fontSize: '13px'
        },
        '.cm-scroller': { overflow: 'auto' },
        '.cm-content': { padding: '8px 0' }
      }),
      EditorView.lineWrapping
    ]

    if (darkMode) {
      extensions.push(oneDark)
    }

    const state = EditorState.create({
      doc: value,
      extensions
    })

    const view = new EditorView({
      state,
      parent: containerRef.current
    })

    viewRef.current = view

    return () => {
      view.destroy()
      viewRef.current = null
    }
    // Only create editor once on mount (or when darkMode/minHeight change)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [darkMode, minHeight])

  // Update content if value changes externally (e.g. loading a preset)
  useEffect(() => {
    const view = viewRef.current
    if (!view) return
    const currentContent = view.state.doc.toString()
    if (currentContent !== value) {
      view.dispatch({
        changes: {
          from: 0,
          to: currentContent.length,
          insert: value
        }
      })
    }
  }, [value])

  return (
    <div
      ref={containerRef}
      className="rounded-md border border-input shadow-sm focus-within:ring-1 focus-within:ring-ring overflow-hidden"
    />
  )
}
