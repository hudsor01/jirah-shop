import { describe, it, expect } from 'vitest'
import { sanitizeRichHTML, sanitizeText } from '@/lib/sanitize'

describe('sanitizeRichHTML', () => {
  it('preserves allowed structural tags', () => {
    const html = '<h1>Title</h1><p>Text</p><strong>Bold</strong><em>Italic</em>'
    const result = sanitizeRichHTML(html)
    expect(result).toContain('<h1>')
    expect(result).toContain('<p>')
    expect(result).toContain('<strong>')
    expect(result).toContain('<em>')
  })

  it('preserves allowed attributes on anchors and images', () => {
    const html = '<a href="https://example.com" target="_blank" rel="noopener">Link</a>'
    const result = sanitizeRichHTML(html)
    expect(result).toContain('href="https://example.com"')
    expect(result).toContain('target="_blank"')

    const imgHtml = '<img src="photo.jpg" alt="Photo" width="200" height="100">'
    const imgResult = sanitizeRichHTML(imgHtml)
    expect(imgResult).toContain('src="photo.jpg"')
    expect(imgResult).toContain('alt="Photo"')
  })

  it('strips script tags', () => {
    const html = '<script>alert("xss")</script>'
    expect(sanitizeRichHTML(html)).toBe('')
  })

  it('strips event handlers', () => {
    const html = '<div onclick="alert(\'xss\')">Content</div>'
    const result = sanitizeRichHTML(html)
    expect(result).toContain('Content')
    expect(result).not.toContain('onclick')
  })

  it('strips style attributes', () => {
    const html = '<p style="color:red">text</p>'
    const result = sanitizeRichHTML(html)
    expect(result).toContain('<p>')
    expect(result).toContain('text')
    expect(result).not.toContain('style')
  })

  it('strips iframe tags', () => {
    const html = '<iframe src="evil.com"></iframe>'
    expect(sanitizeRichHTML(html)).toBe('')
  })

  it('strips class and id attributes', () => {
    const html = '<div class="foo" id="bar">Content</div>'
    const result = sanitizeRichHTML(html)
    expect(result).not.toContain('class=')
    expect(result).not.toContain('id=')
    expect(result).toContain('Content')
  })

  it('handles nested dangerous content', () => {
    const html = '<p><script>xss</script>safe</p>'
    const result = sanitizeRichHTML(html)
    expect(result).toContain('safe')
    expect(result).not.toContain('script')
  })

  it('preserves complex valid HTML (tables, figures)', () => {
    const html = '<table><thead><tr><th>Header</th></tr></thead><tbody><tr><td>Cell</td></tr></tbody></table>'
    const result = sanitizeRichHTML(html)
    expect(result).toContain('<table>')
    expect(result).toContain('<thead>')
    expect(result).toContain('<th>')
    expect(result).toContain('<td>')

    const figureHtml = '<figure><img src="photo.jpg" alt="Test"><figcaption>Caption</figcaption></figure>'
    const figureResult = sanitizeRichHTML(figureHtml)
    expect(figureResult).toContain('<figure>')
    expect(figureResult).toContain('<figcaption>')
  })

  it('strips form tags but preserves content', () => {
    const html = '<form action="evil"><input>text</form>'
    const result = sanitizeRichHTML(html)
    expect(result).not.toContain('<form')
    expect(result).toContain('text')
  })

  it('handles empty input', () => {
    expect(sanitizeRichHTML('')).toBe('')
  })
})

describe('sanitizeText', () => {
  it('strips all HTML tags', () => {
    expect(sanitizeText('<p>hello</p>')).toBe('hello')
  })

  it('strips nested HTML', () => {
    expect(sanitizeText('<div><p><b>text</b></p></div>')).toBe('text')
  })

  it('preserves plain text', () => {
    expect(sanitizeText('hello world')).toBe('hello world')
  })

  it('strips script tags', () => {
    expect(sanitizeText('<script>alert("xss")</script>')).toBe('')
  })

  it('handles entities', () => {
    // DOMPurify preserves HTML entities in text-only mode
    const result = sanitizeText('<p>&amp;</p>')
    expect(result).toContain('&')
    expect(result).not.toContain('<p>')
  })

  it('handles empty input', () => {
    expect(sanitizeText('')).toBe('')
  })
})
