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
      <IFrame html={post.value.content} />
      <p
        dangerouslySetInnerHTML={{
          __html: post.value.content
        }}
      />
    </div>
  )
}

function IFrame (props) {
  const { html, useRef } = props
  const ref = useRef()
  useEffect(() => {
    ref.current.write(html)
  }, [html])
  return (
    <iframe ref={ref} />
  )
}
