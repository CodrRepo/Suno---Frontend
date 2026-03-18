import React, { useEffect, useState } from 'react'
import axios from '../../utils/axios'
import { useNavigate } from 'react-router-dom'
import './songs.css'
import Card from '../../components/card/Card'
import { useUser } from '../../context/UserContext'
import { usePlayer } from '../../context/PlayerContext'

const Songs = () => {
  const navigate = useNavigate()
  const { user } = useUser()
  const { playQueue, togglePlay, currentSong } = usePlayer()
  const [songs, setSongs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const isArtist = user?.profileType === 'artist'

  useEffect(() => {
    if (!user) return
    console.log('Fetching songs from:', user)
    const url = isArtist
      ? `/api/songs/artist/${user._id}`
      : '/api/songs'

    axios.get(url, { withCredentials: true })
      .then(res => setSongs(res.data.songs))
      .catch(() => setError('Failed to load songs.'))
      .finally(() => setLoading(false))
  }, [user, isArtist])

  const emptyMessage = isArtist
    ? "You haven't uploaded any songs yet."
    : 'No songs available yet.'

  return (
    <div id='songs-container'>
      <div className='songs-header'>
        <h2 className='primary-heading'>{isArtist ? 'My Songs' : 'Songs'}</h2>
        {isArtist && (
          <button className='songs-new-btn' onClick={() => navigate('/songs/new')}>+ New Song</button>
        )}
      </div>

      {loading && <p className='songs-status'>Loading…</p>}
      {error && <p className='songs-status songs-error'>{error}</p>}

      {!loading && !error && songs.length === 0 && (
        <p className='songs-status'>{emptyMessage}</p>
      )}

      {!loading && !error && songs.length > 0 && (
        <div id='songs'>
          {songs.map(song => (
            <div key={song._id} className='song-card-wrap' onClick={() => navigate(`/songs/${song._id}`)}>
              <Card
                song={song}
                onPlay={() => {
                  const idx = songs.findIndex(s => s._id === song._id)
                  if (currentSong?._id === song._id) togglePlay()
                  else if (idx !== -1) playQueue(songs, idx)
                }}
                item={{
                  url: song.coverArtUrl || song.artistId?.profilePicture || '/images/default-cover.jpg',
                  name: song.title,
                  profile: song.artistName || song.artistId?.artistName || song.artistId?.name || 'Unknown Artist',
                }}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default Songs
