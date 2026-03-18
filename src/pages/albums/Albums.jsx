import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from '../../utils/axios';  // adjust path as needed
import { useUser } from '../../context/UserContext'
import './albums.css'
import Card from '../../components/card/Card'

const Albums = () => {
  const navigate = useNavigate()
  const { user } = useUser()

  const [albums, setAlbums] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    setLoading(true)
    setError('')

    const endpoint = user?.profileType === 'artist' ? '/api/albums/my' : '/api/albums'

    axios
      .get(endpoint, { withCredentials: true })
      .then(res => {setAlbums(res.data.albums || []); console.log(res.data.albums)})
      .catch(() => setError('Failed to load albums.'))
      .finally(() => setLoading(false))
  }, [user?.profileType])

  return (
    <div id='albums-container'>
      <div className='albums-header'>
        <h2 className='primary-heading'>Albums</h2>
        {user?.profileType === 'artist' && (
          <button className='new-album-btn' onClick={() => navigate('/albums/new')}>+ New Album</button>
        )}
      </div>

      {loading && <p className='albums-status'>Loading…</p>}
      {error && <p className='albums-status albums-error'>{error}</p>}
      {!loading && !error && albums.length === 0 && (
        <p className='albums-status'>No albums yet.</p>
      )}

      <div id='albums'>
        {albums.map(album => (
          <div key={album._id} className='album-card-link' onClick={() => navigate(`/albums/${album._id}`)}>
            <Card item={{
              category: 'album',
              url: album.coverImage,
              name: album.name,
              profile: album.userId?.artistName || album.userId?.name || '',
              date: new Date(album.createdAt).toLocaleDateString()
            }} />
          </div>
        ))}
      </div>
    </div>
  )
}

export default Albums
