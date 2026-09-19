import React from 'react'
import './Video.css'
import PlayVideo from '../../Components/PlayVideo/PlayVideo'
import Recomended from '../../Components/Recomended/Recomended'
const Viddeo = () => {
  return (
    <div className='play-container'>
      <PlayVideo/>
      <Recomended/>
    </div>
  )
}

export default Viddeo
