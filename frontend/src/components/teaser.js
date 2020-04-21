import { Link } from 'react-router-dom'
import React, { useState, useEffect } from 'react'

export default function Teaser (props) {
  const { post } = props
  const slug = post.id
  return (
    <div>
      <h2>
        <Link to={`/posts/${slug}`}>
          {post.value.title}
        </Link>
      </h2>
      <p>
        <em>{post.value.pubDate}</em>
      </p>
    </div>
  )
}
