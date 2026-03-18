import React, { useState, useEffect, useCallback } from 'react'
import axios from 'axios'
import { usePlayer } from '../../context/PlayerContext'
import './history.css'

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

const History = () => {
  const { playQueue, togglePlay, currentSong, playing } = usePlayer()
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const validHistory = history.filter(entry => entry.songId)
  const historySongs = validHistory.map(entry => entry.songId)

  const fetchHistory = useCallback(() => {
    setLoading(true)
    axios.get('/api/history?limit=20', { withCredentials: true })
      .then(res => setHistory(res.data.history || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    fetchHistory()
    const handler = () => fetchHistory()
    window.addEventListener('history:added', handler)
    return () => window.removeEventListener('history:added', handler)
  }, [fetchHistory])

  return (
    <div className='collection__section'>
      <div className='collection__header'>
        <h2 className='collection__title'>History</h2>
      </div>
      <div className='collection__list'>
        {loading && <p className='hist-status'>Loading...</p>}
        {!loading && history.length === 0 && (
          <p className='hist-status'>No history yet</p>
        )}
        {!loading && validHistory.map((entry, i) => {
          const song = entry.songId
          return (
            <div
              key={entry._id}
              className={`hist-item${currentSong?._id === song._id ? ' hist-item--active' : ''}`}
              onClick={() => currentSong?._id === song._id ? togglePlay() : playQueue(historySongs, i)}
            >
              <div className='hist-thumb-wrap'>
                {song.coverArtUrl
                  ? <img className='hist-thumb' src={song.coverArtUrl} alt={song.title} />
                  : <div className='hist-thumb hist-thumb--empty' />
                }
                <div className='hist-play-icon'>
                  {currentSong?._id === song._id && playing
                    ? <svg viewBox='0 0 24 24' fill='currentColor'><path d='M6 5h4v14H6zm8 0h4v14h-4z' /></svg>
                    : <svg viewBox='0 0 24 24' fill='currentColor'><path d='M8 5v14l11-7z' /></svg>
                  }
                </div>
              </div>
              <div className='hist-info'>
                <span className='hist-title'>{song.title}</span>
                <span className='hist-artist'>{song.artistName || 'Unknown Artist'}</span>
              </div>
              <span className='hist-time'>{timeAgo(entry.playedAt)}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default History
