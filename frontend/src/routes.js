import React from 'react'
import { Switch, Route } from 'react-router-dom'

import Start from './pages/start'
import Search from './pages/search'
import Post from './pages/post'

export default function Pageroutes () {
  return (
    <Switch>
      <Route exact path='/'><Start /></Route>
      <Route path='/page/:id'><Start /></Route>
      <Route path='/search'><Search /></Route>
      <Route path='/posts/:id'><Post /></Route>
    </Switch>
  )
}
