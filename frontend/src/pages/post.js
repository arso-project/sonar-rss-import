import React, { useState, useEffect } from 'react'
import Post from '../components/post'
import { useParams } from 'react-router-dom'
import { getPost } from '../api/api'

export default function PostPage (props) {
  const { id } = useParams()
  const post = usePost(id)
  return (
    <div>
      {post && <Post post={post} />}
    </div>
  )
}

function usePost (id) {
  const [post, setPost] = useState(null)
  useEffect(() => {
    getPost(id).then(setPost)
  }, [id])
  return post
}
