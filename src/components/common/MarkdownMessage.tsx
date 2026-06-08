import { useMemo, type ReactNode } from 'react'

function render_inline(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g)
  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={index}>{part.slice(2, -2)}</strong>
    }
    return part
  })
}

export default function MarkdownMessage({ content }: { content: string }) {
  const blocks = useMemo(() => {
    const lines = content.split('\n')
    const rendered: ReactNode[] = []
    let listItems: string[] = []
    let orderedItems: string[] = []
    let codeLines: string[] = []
    let inCode = false

    const flush_list = () => {
      if (listItems.length > 0) {
        rendered.push(
          <ul key={`ul-${rendered.length}`}>
            {listItems.map((item) => <li key={item}>{render_inline(item)}</li>)}
          </ul>,
        )
        listItems = []
      }

      if (orderedItems.length > 0) {
        rendered.push(
          <ol key={`ol-${rendered.length}`}>
            {orderedItems.map((item) => <li key={item}>{render_inline(item.replace(/^\d+\.\s*/, ''))}</li>)}
          </ol>,
        )
        orderedItems = []
      }
    }

    lines.forEach((line) => {
      if (line.startsWith('```')) {
        if (inCode) {
          rendered.push(<pre key={`code-${rendered.length}`}><code>{codeLines.join('\n')}</code></pre>)
          codeLines = []
        } else {
          flush_list()
        }
        inCode = !inCode
        return
      }

      if (inCode) {
        codeLines.push(line)
        return
      }

      if (!line.trim()) {
        flush_list()
        return
      }

      if (line.startsWith('### ')) {
        flush_list()
        rendered.push(<h3 key={`h3-${rendered.length}`}>{render_inline(line.slice(4))}</h3>)
        return
      }

      if (line.startsWith('## ')) {
        flush_list()
        rendered.push(<h2 key={`h2-${rendered.length}`}>{render_inline(line.slice(3))}</h2>)
        return
      }

      if (line.startsWith('# ')) {
        flush_list()
        rendered.push(<h1 key={`h1-${rendered.length}`}>{render_inline(line.slice(2))}</h1>)
        return
      }

      if (line.startsWith('- ')) {
        listItems.push(line.slice(2))
        return
      }

      if (/^\d+\.\s/.test(line)) {
        orderedItems.push(line)
        return
      }

      flush_list()
      rendered.push(<p key={`p-${rendered.length}`}>{render_inline(line)}</p>)
    })

    flush_list()

    if (codeLines.length > 0) {
      rendered.push(<pre key={`code-${rendered.length}`}><code>{codeLines.join('\n')}</code></pre>)
    }

    return rendered
  }, [content])

  return <div className="markdown-message">{blocks}</div>
}
