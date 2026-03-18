import React from 'react'
import './collection.css'
import History from '../history/History'
import Recommendation from '../recommendation/Recommendation'

const Collection = () => {
  return (
    <div className='panel collection'>
      <Recommendation />
      <History />
    </div>
  )
}

export default Collection
