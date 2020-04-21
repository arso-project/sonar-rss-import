import React, { useState, useEffect } from 'react'
import client from '../api/client'
import List from '../components/list'

export default function SearchPage () {
  const [results, setSearch] = useSearchResults()
  return (
    <div>
      <h2>Search</h2>
      <input type='text' onChange={e => setSearch(e.target.value)} placeholder='type here to search' />
      {results && (
        <List posts={results} />
      )}
    </div>
  )
}

function useSearchResults () {
  const [results, setResults] = useState(null)
  function setSearch (value) {
    client.search(value)
      .then(res => setResults(res))
  }
  return [results, setSearch]
}
