import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import axios from '../../utils/axios';  // adjust path as needed
import { usePlayer } from '../../context/PlayerContext'
import { useUser } from '../../context/UserContext'
import './artistDetail.css'

const fmt = (secs) => {
  const s = Math.round(secs)
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

const ArtistDetail = () => {
  const { artistId } = useParams()
  const navigate = useNavigate()
  const { playQueue, togglePlay, currentSong, playing } = usePlayer()
  const { user, setUser } = useUser()

  const [artist, setArtist] = useState(null)
  const [songs, setSongs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isFollowing, setIsFollowing] = useState(false)
  const [followLoading, setFollowLoading] = useState(false)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError('')
    Promise.all([
      axios.get(`/api/users/artists/${artistId}`, { withCredentials: true }),
      axios.get(`/api/songs/artist/${artistId}`, { withCredentials: true }),
    ])
      .then(([artistRes, songsRes]) => {
        if (cancelled) return
        setArtist(artistRes.data.artist)
        setIsFollowing(artistRes.data.isFollowing)
        setSongs(songsRes.data.songs)
      })
      .catch(() => { if (!cancelled) setError('Failed to load artist.') })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [artistId])

  const isSelf = user?.id?.toString() === artistId || user?.id?.toString() === artistId

  const handleFollow = async () => {
    if (followLoading) return
    setFollowLoading(true)
    try {
      const res = await axios.post(`/api/users/artists/${artistId}/follow`, {}, { withCredentials: true })
      setIsFollowing(res.data.isFollowing)
      setArtist(prev => ({ ...prev, followers: res.data.artistFollowers }))
      setUser(prev => ({ ...prev, following: res.data.userFollowing }))
    } catch {
      // silent — button reverts naturally since state wasn't changed
    } finally {
      setFollowLoading(false)
    }
  }

  const handleRowClick = (song, index) => {
    if (currentSong?._id === song._id) togglePlay()
    else playQueue(songs, index)
  }

  if (loading) return <div className='ard-page'><p className='ard-status'>Loading…</p></div>
  if (error) return <div className='ard-page'><p className='ard-status ard-error'>{error}</p></div>
  if (!artist) return null

  const displayName = artist.artistName || artist.name

  return (
    <div className='ard-page'>
      <button className='ard-back' onClick={() => navigate('/artists')}>← Back</button>

      {/* Hero */}
      <div className='ard-hero'>
        <div className='ard-avatar-wrap'>
          {artist.profilePicture
            ? <img className='ard-avatar' src={artist.profilePicture} alt={displayName} />
            : <div className='ard-avatar-placeholder'>{displayName?.[0]?.toUpperCase() || '?'}</div>
          }
        </div>

        <div className='ard-meta'>
          <span className='ard-label'>Artist</span>
          <h1 className='ard-title'>{displayName}</h1>
          <div className='ard-tags'>
            <span className='ard-tag'>{songs.length} {songs.length === 1 ? 'song' : 'songs'}</span>
            <span className='ard-tag'>{artist.followers.toLocaleString()} {artist.followers === 1 ? 'follower' : 'followers'}</span>
          </div>
          {artist.bio && <p className='ard-desc'>{artist.bio}</p>}
          {!isSelf && (
            <div className='ard-action-row'>
              {user?._id !==artistId && <button
                className={`ard-follow-btn${isFollowing ? ' following' : ''}`}
                onClick={handleFollow}
                disabled={followLoading}
              >
                {followLoading ? '…' : isFollowing ? 'Following' : 'Follow'}
              </button>}
              {user?.profileType !== 'artist' && user?._id !== artistId && (
                <button
                  className='ard-concert-btn'
                  onClick={() => navigate(`/concert-request/${artistId}`)}
                >
                  Request Concert
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Song list */}
      {songs.length === 0
        ? <p className='ard-status'>No songs uploaded yet.</p>
        : (
          <div className='ard-list'>
            <div className='ard-list-header'>
              <span className='col-num'>#</span>
              <span className='col-title'>Title</span>
              <span className='col-duration'>Duration</span>
            </div>

            {songs.map((song, i) => {
              const isActive = currentSong?._id === song._id
              const isPlaying = isActive && playing

              return (
                <div
                  key={song._id}
                  className={`ard-song-row${isActive ? ' active' : ''}`}
                  onClick={() => handleRowClick(song, i)}
                >
                  <span className='col-num'>
                    {isPlaying
                      ? <svg className='playing-icon' viewBox='0 0 24 24' fill='currentColor'><path d='M6 19h4V5H6v14zm8-14v14h4V5h-4z' /></svg>
                      : isActive
                        ? <svg className='playing-icon' viewBox='0 0 24 24' fill='currentColor'><path d='M8 5v14l11-7z' /></svg>
                        : <span className='track-num'>{i + 1}</span>
                    }
                  </span>

                  <div className='col-title'>
                    <div className='ard-thumb-wrap'>
                      {song.coverArtUrl
                        ? <img className='ard-thumb' src={song.coverArtUrl} alt={song.title} />
                        : <div className='ard-thumb-fallback'>♪</div>
                      }
                    </div>
                    <div className='ard-song-info'>
                      <span className='ard-song-title'>{song.title}</span>
                      {song.genre && <span className='ard-song-genre'>{song.genre}</span>}
                    </div>
                  </div>

                  <span className='col-duration'>{fmt(song.duration)}</span>
                </div>
              )
            })}
          </div>
        )
      }
    </div>
  )
}

export default ArtistDetail
