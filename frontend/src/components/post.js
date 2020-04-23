import { Link } from 'react-router-dom'
import React, { useState, useEffect, useRef } from 'react'

export default function Post (props) {
  const { post } = props
  if (!post) return <em>Not found</em>
  return (
    <div>
      <h1>
        {post.value.title}
      </h1>
      <p>
        <em>{post.value.pubDate}</em>
      </p>
      <p>
        {post.value.description}
      </p>
      <Iframe html={post.value.content} />
    </div>
  )
}

function Iframe (props) {
  const { html } = props
  const ref = useRef()
  const style = {
    border: 'none',
    width: '100%',
    height: '100%'
  }
  useEffect(() => {
    if (!ref.current) return
    if (!ref.current.contentDocument) return
    let inner = '<base target="_blank">'
    inner += html
    ref.current.contentDocument.write(inner)
    ref.current.style.height = ref.current.contentWindow.document.body.scrollHeight + 'px'
  }, [html, ref.current, ref.current ? ref.current.contentDocument : null])
  if (!html) return null
  return (
    <iframe sandbox='allow-same-origin' src='about:blank' style={style} ref={ref} />
  )
}
