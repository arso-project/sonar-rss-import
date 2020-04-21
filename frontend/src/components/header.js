import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

export default function Header (props) {
  return (
    <div>
      <h1>
        Hello
      </h1>
      <nav>
        <ul>
          <li>
            <Link to='/'>List</Link>
          </li>
          <li>
            <Link to='/search'>Search</Link>
          </li>
        </ul>
      </nav>
    </div>

  )
}
