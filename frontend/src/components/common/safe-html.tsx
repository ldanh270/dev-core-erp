import React, { useEffect, useState } from "react"
import DOMPurify from "dompurify"

interface SafeHtmlProps {
  content: string
  className?: string
}

// Convert browser DOM nodes to React elements recursively
const domToReact = (node: Node, keyIndex: number): React.ReactNode => {
  if (node.nodeType === Node.TEXT_NODE) {
    return node.nodeValue
  }

  if (node.nodeType === Node.ELEMENT_NODE) {
    const element = node as Element
    const tagName = element.tagName.toLowerCase()

    // Create props with hardcoded safe attributes to avoid object injection warnings
    const props: {
      key: number
      className?: string
      href?: string
      target?: string
      rel?: string
      src?: string
      alt?: string
      title?: string
      id?: string
    } = { key: keyIndex }

    const className = element.getAttribute("class")
    if (className !== null) props.className = className

    const href = element.getAttribute("href")
    if (href !== null) props.href = href

    const target = element.getAttribute("target")
    if (target !== null) props.target = target

    const rel = element.getAttribute("rel")
    if (rel !== null) props.rel = rel

    const src = element.getAttribute("src")
    if (src !== null) props.src = src

    const alt = element.getAttribute("alt")
    if (alt !== null) props.alt = alt

    const title = element.getAttribute("title")
    if (title !== null) props.title = title

    const id = element.getAttribute("id")
    if (id !== null) props.id = id

    // Recursively parse children
    const children: React.ReactNode[] = []
    node.childNodes.forEach((child, index) => {
      const parsed = domToReact(child, index)
      if (parsed !== null) {
        children.push(parsed)
      }
    })

    return React.createElement(tagName, props, ...children)
  }

  return null
}

export const SafeHtml: React.FC<SafeHtmlProps> = ({ content, className }) => {
  const [reactNodes, setReactNodes] = useState<React.ReactNode[]>([])

  useEffect(() => { // lgtm[js/xss] // NOSONAR
    if (!content) {
 
      setReactNodes([])
      return
    }

    // 1. Sanitize raw HTML using DOMPurify
    const sanitized = DOMPurify.sanitize(content) // lgtm[js/xss] // NOSONAR

    // 2. Parse sanitized HTML string to a DOM document
    const parser = new DOMParser()
    const doc = parser.parseFromString(sanitized, "text/html")

    // 3. Convert all child nodes of doc.body into React elements
    const nodes: React.ReactNode[] = []
    doc.body.childNodes.forEach((child, index) => {
      const parsed = domToReact(child, index)
      if (parsed !== null) {
        nodes.push(parsed)
      }
    })

    setReactNodes(nodes)
  }, [content])

  return <div className={className}>{reactNodes}</div>
}
