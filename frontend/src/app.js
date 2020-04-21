import React from 'react'
import { HashRouter as Router } from 'react-router-dom'
import { hot } from 'react-hot-loader/root'

import Header from './components/header'
import Routes from './routes'

function App (props) {
  return (
    <Wrappers>
      <Header />
      <Routes />
    </Wrappers>
  )
}

export default hot(App)

function Wrappers (props) {
  return (
    <Router>
      {props.children}
    </Router>
  )
}
