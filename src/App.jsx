import { useState } from 'react'
import './App.css'
import Navbar from './Components/Navbar/Navbar'
import Home from './pages/Home/Home'

function App () {
  const [sidebar, setSidebar] = useState(true)

  return (
    <>
      <Navbar setSidebar={setSidebar} />
      <Home sidebar={sidebar} />
    </>
  )
}

export default App
