import React from 'react'
import './songCard.css'

const SongCard = ({ song }) => {
  return (
    <div className='song-card'>
      <div className='song-card__thumbnail-wrap'>
        <img className='song-card__thumbnail' src={song.url} alt={song.name} />
        <button className='song-card__play-btn'>
          <svg viewBox='0 0 24 24' fill='currentColor'>
            <path d='M8 5v14l11-7z' />
          </svg>
        </button>
      </div>
      <div className='song-card__info'>
        <span className='song-card__name'>{song.name}</span>
        <span className='song-card__artist'>{song.artist}</span>
      </div>
      <span className='song-card__duration'>{song.duration}</span>
    </div>
  )
}

export default SongCard
