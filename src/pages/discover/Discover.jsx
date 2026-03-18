import React, { useEffect, useMemo, useRef, useState } from 'react'
import axios from 'axios'
import { useLocation } from 'react-router-dom'
import './discover.css'
import Card from '../../components/card/Card'
import { usePlayer } from '../../context/PlayerContext'

const Discover = () => {
  const scrollRefs = useRef({})
  const location = useLocation()
  const { playQueue, togglePlay, currentSong } = usePlayer()
  const [songs, setSongs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    axios.get('/api/songs', { withCredentials: true })
      .then((res) => setSongs(res.data.songs || []))
      .catch(() => setError('Failed to load songs.'))
      .finally(() => setLoading(false))
  }, [])

  const genres = useMemo(() => {
    const grouped = songs.reduce((acc, song) => {
      const key = song.genre?.trim() || 'Unknown'

      if (!acc[key]) {
        acc[key] = {
          name: key,
          songs: [],
        }
      }

      acc[key].songs.push(song)
      return acc
    }, {})

    return Object.values(grouped).sort((a, b) => a.name.localeCompare(b.name))
  }, [songs])

  const selectedGenre = useMemo(() => {
    const genreParam = new URLSearchParams(location.search).get('genre')
    return genreParam?.trim().toLowerCase() || ''
  }, [location.search])

  const visibleGenres = useMemo(() => {
    if (!selectedGenre) return genres
    return genres.filter((g) => g.name.toLowerCase() === selectedGenre)
  }, [genres, selectedGenre])

  const scroll = (name, direction) => {
    const container = scrollRefs.current[name]
    if (container) {
      const cardWidth = container.querySelector('.card')?.offsetWidth || 0
      container.scrollBy({ left: direction === 'next' ? cardWidth * 3 : -(cardWidth * 3), behavior: 'smooth' })
    }
  }

  return (
    <div id='discover-container'>
      <h3 className='text-light-gray'>Browse</h3>
      <h2 className='primary-heading discover-heading'>Discover</h2>

      {loading && <p className='discover-status'>Loading songs...</p>}
      {error && !loading && <p className='discover-status discover-error'>{error}</p>}
      {!loading && !error && genres.length === 0 && (
        <p className='discover-status'>No songs found yet.</p>
      )}

      {!loading && !error && genres.length > 0 && selectedGenre && visibleGenres.length === 0 && (
        <p className='discover-status'>No songs found in this genre.</p>
      )}

      {!loading && !error && visibleGenres.map((genre) => (
        <section key={genre.name} className='genre-section'>
          <div className='genre-header'>
            <h2 className='genre-title'>{genre.name}</h2>
            <span className='show-all'>{genre.songs.length} songs</span>
          </div>

          <div className='genre-slider-wrapper'>
            <button className='slider-btn prev-btn' onClick={() => scroll(genre.name, 'prev')}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512">
                <path d="M9.4 233.4c-12.5 12.5-12.5 32.8 0 45.3l192 192c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L77.3 256 246.6 86.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0l-192 192z" />
              </svg>
            </button>

            <div
              className='genre-cards'
              ref={(el) => (scrollRefs.current[genre.name] = el)}
            >
              {genre.songs.map((song, i) => (
                <Card
                  key={song._id}
                  song={song}
                  onPlay={() => {
                    if (currentSong?._id === song._id) togglePlay()
                    else playQueue(genre.songs, i)
                  }}
                  item={{
                    url: song.coverArtUrl || song.artistId?.profilePicture || '/images/default-cover.jpg',
                    name: song.title,
                    profile: song.artistName || song.artistId?.artistName || song.artistId?.name || 'Unknown Artist',
                  }}
                />
              ))}
            </div>

            <button className='slider-btn next-btn' onClick={() => scroll(genre.name, 'next')}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512">
                <path d="M310.6 233.4c12.5 12.5 12.5 32.8 0 45.3l-192 192c-12.5 12.5-32.8 12.5-45.3 0s-12.5-32.8 0-45.3L242.7 256 73.4 86.6c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0l192 192z" />
              </svg>
            </button>
          </div>
        </section>
      ))}
    </div>
  )
}

export default Discover
