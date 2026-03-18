import React, { useState, useEffect } from 'react'
import axios from '../../utils/axios';  // adjust path as needed
import { usePlayer } from '../../context/PlayerContext'
import './home.css'

const fmt = (s) => {
  if (!s && s !== 0) return '—'
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${m}:${sec.toString().padStart(2, '0')}`
}

const HomeView = () => {
  const [topSong, setTopSong] = useState(null)
  const [favSongs, setFavSongs] = useState([])
  const [loading, setLoading] = useState(true)
  const { playSong, playQueue, togglePlay, currentSong, playing } = usePlayer()

  useEffect(() => {
    const fetchData = async () => {
      const [topRes, favRes] = await Promise.allSettled([
        axios.get('/api/playlists/favorites/top-song', { withCredentials: true }),
        axios.get('/api/playlists/favorites', { withCredentials: true }),
      ])
      setTopSong(topRes.status === 'fulfilled' ? topRes.value.data.song || null : null)
      setFavSongs(favRes.status === 'fulfilled' ? favRes.value.data.playlist?.songs || [] : [])
      setLoading(false)
    }
    fetchData()
    const refresh = () => fetchData()
    window.addEventListener('favorites:updated', refresh)
    return () => window.removeEventListener('favorites:updated', refresh)
  }, [])

  const topIsPlaying = currentSong?._id === topSong?._id && playing

  return (
    <div className='home-content'>
        <h3 className='text-light-gray'>What's hot</h3>
        <h2 className='primary-heading home-content-heading'>Trending</h2>

        {loading ? (
          <div className='card'><p className='hv-status'>Loading...</p></div>
        ) : topSong ? (
          <div
            className='card'
          >
            <div className='card-header'>
              <h4>Artist</h4>
              <div className='listeners'>
                <h4>Total Favorites</h4>
                <p>{topSong.totalAdds ?? '—'}</p>
              </div>
            </div>
            <h2 className='card-song'>{topSong.title}</h2>
            <p className='card-artist-name'>{topSong.artistName || 'Unknown Artist'}</p>
            <div className='card-footer'>
              <button onClick={() => topIsPlaying ? togglePlay() : playSong(topSong)}>
                {topIsPlaying
                  ? <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path d="M48 64C21.5 64 0 85.5 0 112L0 400c0 26.5 21.5 48 48 48l32 0c26.5 0 48-21.5 48-48l0-288c0-26.5-21.5-48-48-48L48 64zm192 0c-26.5 0-48 21.5-48 48l0 288c0 26.5 21.5 48 48 48l32 0c26.5 0 48-21.5 48-48l0-288c0-26.5-21.5-48-48-48l-32 0z"/></svg>
                  : <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path d="M91.2 36.9c-12.4-6.8-27.4-6.5-39.6 .7S32 57.9 32 72l0 368c0 14.1 7.5 27.2 19.6 34.4s27.2 7.5 39.6 .7l336-184c12.8-7 20.8-20.5 20.8-35.1s-8-28.1-20.8-35.1l-336-184z"/></svg>
                }
                <span>{topIsPlaying ? 'Pause' : 'Play'}</span>
              </button>
            </div>
          </div>
        ) : (
          <div className='card'>
            <p className='hv-status'>No trending song yet. Start adding favorites!</p>
          </div>
        )}

        <div className='playlist-section'>
          <div className='playlist-header'>
            <h2 className='primary-heading'>Favorite Songs</h2>
          </div>

          {loading ? (
            <p className='hv-status'>Loading...</p>
          ) : favSongs.length === 0 ? (
            <p className='hv-status'>No favorite songs yet.</p>
          ) : (
            <table className='playlist-table'>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Title</th>
                  <th>Artist</th>
                  <th>Time</th>
                </tr>
              </thead>
              <tbody>
                {favSongs.map((song, i) => {
                  const isActive = currentSong?._id === song._id
                  const isPlaying = isActive && playing
                  return (
                    <tr key={song._id} className={isActive ? 'playing' : ''} onClick={() => isActive ? togglePlay() : playQueue(favSongs, i)}>
                      <td>
                        {isPlaying
                          ? <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><path d="M176 96C149.5 96 128 117.5 128 144L128 496C128 522.5 149.5 544 176 544L240 544C266.5 544 288 522.5 288 496L288 144C288 117.5 266.5 96 240 96L176 96zM400 96C373.5 96 352 117.5 352 144L352 496C352 522.5 373.5 544 400 544L464 544C490.5 544 512 522.5 512 496L512 144C512 117.5 490.5 96 464 96L400 96z"/></svg>
                          : String(i + 1).padStart(2, '0')
                        }
                      </td>
                      <td>{song.title}</td>
                      <td>{song.artistName || '—'}</td>
                      <td>{fmt(song.duration)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
    </div>
  )
}

export default HomeView
