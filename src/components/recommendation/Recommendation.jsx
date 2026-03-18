import React, { useState, useEffect, useCallback } from 'react'
import axios from '../../utils/axios'
import { usePlayer } from '../../context/PlayerContext'
import './recommendation.css'

const Recommendation = () => {
  const [songs, setSongs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const { playQueue, togglePlay, currentSong, playing } = usePlayer()

  const fetchRecs = useCallback(() => {
    setLoading(true)
    setError(null)
    axios.get('/api/history/recommendations', { withCredentials: true })
      .then(res => setSongs(res.data.songs || []))
      .catch(err => setError(err.response?.data?.message || 'Failed to load recommendations'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    fetchRecs()
    const handler = () => fetchRecs()
    window.addEventListener('history:added', handler)
    return () => window.removeEventListener('history:added', handler)
  }, [fetchRecs])

  return (
    <div className='collection__section'>
      <div className='collection__header'>
        <h2 className='collection__title'>Best Picks</h2>
      </div>
      <div className='collection__list'>
        {loading && <p className='rec-status'>Loading...</p>}
        {!loading && error && <p className='rec-status rec-status--error'>{error}</p>}
        {!loading && !error && songs.length === 0 && (
          <p className='rec-status'>No recommendations yet</p>
        )}
        {!loading && songs.map((song, i) => {
          const isActive = currentSong?._id === song._id
          const isPlaying = isActive && playing
          return (
            <div
              key={song._id}
              className={`rec-item${isActive ? ' rec-item--active' : ''}`}
              onClick={() => isActive ? togglePlay() : playQueue(songs, i)}
            >
              <div className='rec-thumb-wrap'>
                {song.coverArtUrl
                  ? <img className='rec-thumb' src={song.coverArtUrl} alt={song.title} />
                  : <div className='rec-thumb rec-thumb--empty' />
                }
                <div className='rec-play-icon'>
                  {isPlaying
                    ? <svg viewBox='0 0 24 24' fill='currentColor'><path d='M6 5h4v14H6zm8 0h4v14h-4z' /></svg>
                    : <svg viewBox='0 0 24 24' fill='currentColor'><path d='M8 5v14l11-7z' /></svg>
                  }
                </div>
              </div>
              <div className='rec-info'>
                <span className='rec-title'>{song.title}</span>
                <span className='rec-artist'>{song.artistName || 'Unknown Artist'}</span>
              </div>
              {song.genre && <span className='rec-genre'>{song.genre}</span>}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default Recommendation
