import React, { useState, useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'

import List from '../components/list'
import { listRecentPosts } from '../api/api'

export default function Home (props) {
  let { id = 0 } = useParams()
  id = parseInt(id)
  const posts = usePosts(id)
  return (
    <div>
      <main>
        <List posts={posts} />
        <Link to={`/page/${id + 1}`}>Next</Link>
      </main>
    </div>
  )
}

function usePosts (page) {
  const [posts, setPosts] = useState(null)
  useEffect(() => {
    listRecentPosts({ page }).then(setPosts)
  }, [page])
  return posts
}
