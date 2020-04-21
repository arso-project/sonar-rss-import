import client from './client'

const SCHEMA = 'sonar/wordpress-import'

export async function listRecentPosts (opts = {}) {
  let { page, limit = 10, offset = 0 } = opts
  if (page) offset = offset + (limit * page)
  const posts = await client.query('index', {
    schema: SCHEMA,
    prop: 'pubDate',
    limit,
    offset,
    reverse: true
  })
  return posts
}

export async function getPost (id) {
  const posts = await client.get({ id })
  if (!posts.length) return null
  return posts[0]
}

export async function getAllPostIds () {
  const posts = await client.query('records', {
    schema: SCHEMA
  })
  return posts.map(post => post.id)
}
