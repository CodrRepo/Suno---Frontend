import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from '../../utils/axios'
import './playlists.css'
import Card from '../../components/card/Card'

const Playlists = () => {
  const navigate = useNavigate()

  const [playlists, setPlaylists] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    axios
      .get('/api/playlists/my', { withCredentials: true })
      .then((res) => setPlaylists(res.data.playlists))
      .catch(() => setError('Failed to load playlists.'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div id='playlists-container'>
      <div className='playlists-header'>
        <h2 className='primary-heading'>Playlists</h2>
        <button className='new-playlist-btn' onClick={() => navigate('/playlists/new')}>
          + New Playlist
        </button>
      </div>

      {loading && <p className='playlists-status'>Loading…</p>}
      {error && <p className='playlists-status playlists-error'>{error}</p>}

      {!loading && !error && playlists.length === 0 && (
        <p className='playlists-status'>No playlists yet. Create one!</p>
      )}

      <div id='playlists'>
        {playlists.map((pl) => (
          <div
            key={pl._id}
            className='playlist-card-wrap'
            onClick={() => navigate(`/playlists/${pl._id}`)}
          >
            <Card
              item={{
                category: 'playlist',
                url: pl.coverImage || '',
                name: pl.name,
              }}
            />
          </div>
        ))}
      </div>
    </div>
  )
}

export default Playlists
