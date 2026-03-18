import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import './artists.css'
import Card from '../../components/card/Card'

const Artists = () => {
  const navigate = useNavigate()
  const [artists, setArtists] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    axios.get('/api/users/artists', { withCredentials: true })
      .then(res => {setArtists(res.data.artists); console.log('Fetched artists:', res.data.artists)})
      .catch(() => setError('Failed to load artists.'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div id='artists-container'>
      <h2 style={{ marginLeft: '0.8rem' }} className='primary-heading'>Top Artists</h2>

      {loading && <p className='artists-status'>Loading…</p>}
      {error && <p className='artists-status artists-error'>{error}</p>}

      {!loading && !error && artists.length === 0 && (
        <p className='artists-status'>No artists yet.</p>
      )}

      {!loading && !error && artists.length > 0 && (
        <div id='artists'>
          {artists.map(artist => (
            <div key={artist._id} className='artist-card-link' onClick={() => navigate(`/artists/${artist._id}`)}>
              <Card
                fallbackLetter={artist.artistName?.[0] || artist.name?.[0] || '?'}
                item={{
                  url: artist.profilePicture || '',
                  name: artist.artistName || artist.name,
                  profile: 'Artist',
                }}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default Artists
