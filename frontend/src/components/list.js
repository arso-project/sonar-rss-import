import Teaser from './teaser'
import React from 'react'

export default function List (props) {
  const { posts } = props
  if (!posts) return null
  return (
    <div>
      {posts.map(post => (
        <Teaser key={post.lseq} post={post} />
      ))}
    </div>
  )
}
