import { describe, expect, it } from 'vitest'
import { buildHtml } from './html-builder'

describe('buildHtml', () => {
  it('renders markdown into an HTML document body', () => {
    const html = buildHtml('# Title\n\nA paragraph.', '', '')
    expect(html).toContain('<!DOCTYPE html>')
    expect(html).toContain('<h1>Title</h1>')
    expect(html).toContain('<p>A paragraph.</p>')
    expect(html).toContain('class="markdown-body"')
  })

  it('inlines theme and custom css into the style block', () => {
    const html = buildHtml('text', '.markdown-body { color: red; }', '.markdown-body { font-size: 12px; }')
    expect(html).toContain('color: red;')
    expect(html).toContain('font-size: 12px;')
  })

  it('renders GFM tables', () => {
    const md = '| A | B |\n|---|---|\n| 1 | 2 |'
    const html = buildHtml(md, '', '')
    expect(html).toContain('<table>')
    expect(html).toContain('<td>1</td>')
  })
})
