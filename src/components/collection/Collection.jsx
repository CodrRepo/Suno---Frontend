import React from 'react'
import './collection.css'
import History from '../history/History'
import Recommendation from '../recommendation/Recommendation'

const Collection = ({ isHistoryMenuOpen, setIsHistoryMenuOpen }) => {
  return (
    <>
      {isHistoryMenuOpen && (
        <div
          className="mobile-collection-backdrop"
          onClick={() => setIsHistoryMenuOpen(false)}
        />
      )}
      <div className={`panel collection ${isHistoryMenuOpen ? 'mobile-collection-open' : ''}`}>
        <Recommendation />
        <History />
      </div>
    </>
  )
}

export default Collection
