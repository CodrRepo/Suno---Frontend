import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import axios from '../../utils/axios'
import { usePlayer } from '../../context/PlayerContext'
import { useUser } from '../../context/UserContext'
import Card from '../../components/card/Card'
import '../playlists/playlists.css'
import '../albums/albumDetail.css'
import './songDetail.css'
import BackBtn from '../../components/backBtn/BackBtn'

const fmt = (secs) => {
  const s = Math.round(secs)
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

const SongDetail = () => {
  const { songId } = useParams()
  const navigate = useNavigate()
  const { playQueue, togglePlay, currentSong, playing } = usePlayer()
  const { user } = useUser()

  const [song, setSong] = useState(null)
  const [relatedSongs, setRelatedSongs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [showEdit, setShowEdit] = useState(false)
  const [editForm, setEditForm] = useState({ title: '', genre: '', artistName: '' })
  const [editCover, setEditCover] = useState(null)
  const [editPreview, setEditPreview] = useState(null)
  const [editError, setEditError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setLoading(true)
    setError('')
    axios.get(`/api/songs/${songId}`, { withCredentials: true })
      .then(res => {
        setSong(res.data.song)
        console.log(res.data.song, user)
        return axios.get(`/api/songs/genre/${encodeURIComponent(res.data.song.genre)}`, { withCredentials: true })
      })
      .then(res => setRelatedSongs(res.data.songs.filter(s => s._id !== songId)))
      .catch(() => setError('Failed to load song.'))
      .finally(() => setLoading(false))
  }, [songId, user])

  const isOwner = !!(user && song && user.profileType.toLowerCase() === 'artist' && song.artistId.toString() === user._id?.toString())
  console.log('isOwner:', user.profileType, song?.artistId, user?._id)
  const isActive = currentSong?._id === song?._id
  const isPlaying = isActive && playing

  const handlePlay = () => {
    if (!song) return
    if (isActive) {
      togglePlay()
      return
    }
    const queue = [song, ...relatedSongs]
    playQueue(queue, 0)
  }

  const openEdit = () => {
    setEditForm({ title: song.title, genre: song.genre || '', artistName: song.artistName })
    setEditCover(null)
    setEditPreview(null)
    setEditError('')
    setShowEdit(true)
  }

  const handleCoverChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setEditCover(file)
    setEditPreview(URL.createObjectURL(file))
  }

  const handleEdit = async (e) => {
    e.preventDefault()
    if (!editForm.title.trim()) { setEditError('Title is required.'); return }
    setSaving(true)
    setEditError('')
    try {
      const fd = new FormData()
      fd.append('title', editForm.title.trim())
      fd.append('genre', editForm.genre.trim())
      fd.append('artistName', editForm.artistName.trim())
      if (editCover) fd.append('coverArt', editCover)
      const res = await axios.patch(`/api/songs/${songId}`, fd, {
        withCredentials: true,
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setSong(res.data.song)
      setShowEdit(false)
    } catch (err) {
      setEditError(err.response?.data?.message || 'Failed to save.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!window.confirm('Delete this song? This cannot be undone.')) return
    try {
      await axios.delete(`/api/songs/${songId}`, { withCredentials: true })
      navigate('/songs')
    } catch {
      alert('Failed to delete song.')
    }
  }

  const handleRelatedRowClick = (s, index) => {
    if (currentSong?._id === s._id) togglePlay()
    else playQueue(relatedSongs, index)
  }

  // Unique artists from related songs
  const relatedArtists = (() => {
    const seen = new Set()
    return relatedSongs
      .filter(s => {
        const id = s.artistId?._id?.toString() || s.artistId?.toString()
        if (!id || seen.has(id)) return false
        seen.add(id)
        return true
      })
      .map(s => ({
        _id: s.artistId?._id || s.artistId,
        artistName: s.artistName,
        profilePicture: s.artistId?.profilePicture || '',
      }))
  })()

  if (loading) return <div className='sd-page'><p className='sd-status'>Loading…</p></div>
  if (error) return <div className='sd-page'><p className='sd-status sd-error'>{error}</p></div>
  if (!song) return null

  return (
    <div className='sd-page'>
      <BackBtn />

      {/* Hero */}
      <div className='sd-hero'>
        <div className='sd-cover-wrap'>
          {song.coverArtUrl
            ? <img className='sd-cover' src={song.coverArtUrl} alt={song.title} />
            : <div className='sd-cover-placeholder'>♪</div>
          }
          <button id='sd-media-btn' className='play-btn sd-play-btn' onClick={handlePlay}>
            {isPlaying
              ? <svg style={{'width': '1.5rem'}} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><path d="M176 96C149.5 96 128 117.5 128 144L128 496C128 522.5 149.5 544 176 544L240 544C266.5 544 288 522.5 288 496L288 144C288 117.5 266.5 96 240 96L176 96zM400 96C373.5 96 352 117.5 352 144L352 496C352 522.5 373.5 544 400 544L464 544C490.5 544 512 522.5 512 496L512 144C512 117.5 490.5 96 464 96L400 96z" /></svg>
              : <svg style={{'width': '1.5rem'}} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><path d="M187.2 100.9C174.8 94.1 159.8 94.4 147.6 101.6C135.4 108.8 128 121.9 128 136L128 504C128 518.1 135.5 531.2 147.6 538.4C159.7 545.6 174.8 545.9 187.2 539.1L523.2 355.1C536 348.1 544 334.6 544 320C544 305.4 536 291.9 523.2 284.9L187.2 100.9z" /></svg>
            }
          </button>
        </div>

        <div className='sd-meta'>
          <span className='album-detail-label'>Song</span>
          <h1 className='sd-title'>{song.title}</h1>
          <p className='album-detail-artist'>
            {song.artistName || song.artistId?.artistName || song.artistId?.name}
          </p>
          <div className='album-detail-tags'>
            {song.genre && <span className='album-detail-tag'>{song.genre}</span>}
            <span className='album-detail-tag'>{fmt(song.duration)}</span>
            {song.uploadDate && (
              <span className='album-detail-tag'>
                {new Date(song.uploadDate).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
              </span>
            )}
          </div>
          {isOwner && (
            <div className='sd-actions'>
              <button className='pl-btn pl-btn-ghost' onClick={openEdit}>Edit</button>
              <button className='pl-btn pl-btn-danger' onClick={handleDelete}>Delete</button>
            </div>
          )}
        </div>
      </div>

      {/* Related Songs */}
      {relatedSongs.length > 0 && (
        <>
          <h2 className='sd-section-title'>More in {song.genre}</h2>
          <div className='album-detail-list'>
            <div className='album-detail-list-header'>
              <span className='col-num'>#</span>
              <span className='col-title'>Title</span>
              <span className='col-duration'>Duration</span>
            </div>
            {relatedSongs.map((s, i) => {
              const rowActive = currentSong?._id === s._id
              const rowPlaying = rowActive && playing
              return (
                <div
                  key={s._id}
                  className={`album-song-row${rowActive ? ' active' : ''}`}
                  onClick={() => handleRelatedRowClick(s, i)}
                >
                  <span className='col-num'>
                    {rowPlaying
                      ? <svg className='playing-icon' viewBox='0 0 24 24' fill='currentColor'><path d='M6 19h4V5H6v14zm8-14v14h4V5h-4z' /></svg>
                      : rowActive
                        ? <svg className='playing-icon' viewBox='0 0 24 24' fill='currentColor'><path d='M8 5v14l11-7z' /></svg>
                        : <span className='track-num'>{i + 1}</span>
                    }
                  </span>
                  <div className='col-title'>
                    <div className='album-song-thumb-wrap'>
                      {s.coverArtUrl
                        ? <img className='album-song-thumb' src={s.coverArtUrl} alt={s.title} />
                        : <div className='album-song-thumb-fallback'>♪</div>
                      }
                    </div>
                    <div className='album-song-info'>
                      <span className='album-song-title'>{s.title}</span>
                      <span className='album-song-artist'>{s.artistName}</span>
                    </div>
                  </div>
                  <span className='col-duration'>{fmt(s.duration)}</span>
                </div>
              )
            })}
          </div>
        </>
      )}

      {/* Related Artists */}
      {relatedArtists.length > 0 && (
        <>
          <h2 className='sd-section-title'>Artists in {song.genre}</h2>
          <div className='sd-artists-grid'>
            {relatedArtists.map(a => (
              <Card
                key={a._id?.toString()}
                fallbackLetter={a.artistName?.[0] || '?'}
                item={{ url: a.profilePicture || '', name: a.artistName, profile: 'Artist' }}
              />
            ))}
          </div>
        </>
      )}

      {/* Edit Modal */}
      {showEdit && (
        <div className='pl-modal-backdrop' onClick={() => setShowEdit(false)}>
          <div className='pl-modal' onClick={e => e.stopPropagation()}>
            <p className='pl-modal-title'>Edit Song</p>

            <form className='pl-modal-form' onSubmit={handleEdit}>
              {/* Cover preview */}
              <div className='sd-edit-cover-row'>
                <div className='sd-edit-cover-thumb'>
                  {editPreview || song.coverArtUrl
                    ? <img src={editPreview || song.coverArtUrl} alt='cover' />
                    : <span>♪</span>
                  }
                </div>
                <label className='sd-edit-cover-label'>
                  Change cover
                  <input type='file' accept='image/*' onChange={handleCoverChange} hidden />
                </label>
              </div>

              <div className='pl-field'>
                <label className='pl-label'>Title *</label>
                <input
                  className='pl-input'
                  value={editForm.title}
                  onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))}
                  placeholder='Song title'
                />
              </div>

              <div className='pl-field'>
                <label className='pl-label'>Genre</label>
                <input
                  className='pl-input'
                  value={editForm.genre}
                  onChange={e => setEditForm(f => ({ ...f, genre: e.target.value }))}
                  placeholder='e.g. Pop, Rock'
                />
              </div>

              <div className='pl-field'>
                <label className='pl-label'>Artist Name</label>
                <input
                  className='pl-input'
                  value={editForm.artistName}
                  onChange={e => setEditForm(f => ({ ...f, artistName: e.target.value }))}
                  placeholder='Artist name'
                />
              </div>

              {editError && <p className='pl-form-error'>{editError}</p>}

              <div className='pl-modal-actions'>
                <button type='button' className='pl-btn pl-btn-ghost' onClick={() => setShowEdit(false)}>
                  Cancel
                </button>
                <button type='submit' className='pl-btn pl-btn-primary' disabled={saving}>
                  {saving ? 'Saving…' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default SongDetail
