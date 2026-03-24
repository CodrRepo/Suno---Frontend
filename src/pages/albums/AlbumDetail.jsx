import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import axios from '../../utils/axios';  // adjust path as needed
import { usePlayer } from '../../context/PlayerContext'
import { useUser } from '../../context/UserContext'
import '../playlists/playlists.css'
import './albumDetail.css'
import BackBtn from '../../components/BackBtn/BackBtn'

const fmt = (secs) => {
  const s = Math.round(secs)
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

const GENRES = ['Pop', 'Rock', 'Hip-Hop', 'R&B', 'Jazz', 'Classical', 'Electronic', 'Country', 'Metal', 'Folk', 'Other']

const AlbumDetail = () => {
  const { albumId } = useParams()
  const navigate = useNavigate()
  const { playQueue, togglePlay, currentSong, playing } = usePlayer()
  const { user } = useUser()

  const [album, setAlbum] = useState(null)
  const [songs, setSongs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [showEdit, setShowEdit] = useState(false)
  const [editForm, setEditForm] = useState({ name: '', description: '', genre: 'Other' })
  const [editCover, setEditCover] = useState(null)
  const [editPreview, setEditPreview] = useState(null)
  const [editError, setEditError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError('')
    Promise.all([
      axios.get(`/api/albums/${albumId}`, { withCredentials: true }),
      axios.get(`/api/songs/album/${albumId}`, { withCredentials: true }),
    ])
      .then(([albumRes, songsRes]) => {
        if (cancelled) return
        setAlbum(albumRes.data.album)
        setSongs(songsRes.data.songs)
      })
      .catch(() => { if (!cancelled) setError('Failed to load album.') })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [albumId])

  const isOwner = !!(user && user.profileType === 'artist' && album && (
    user._id?.toString() === album?.userId?._id?.toString() ||
    user._id?.toString() === album?.userId?.toString()
  ))

    console.log(album)

  const handleRowClick = (song, index) => {
    if (currentSong?._id === song._id) togglePlay()
    else playQueue(songs, index)
  }

  const openEdit = () => {
    setEditForm({ name: album.name, description: album.description || '', genre: album.genre || 'Other' })
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
    if (!editForm.name.trim()) { setEditError('Name is required.'); return }
    if (!editForm.description.trim()) { setEditError('Description is required.'); return }
    setSaving(true)
    setEditError('')
    try {
      const fd = new FormData()
      fd.append('name', editForm.name.trim())
      fd.append('description', editForm.description.trim())
      fd.append('genre', editForm.genre)
      if (editCover) fd.append('coverImage', editCover)
      await axios.patch(`/api/albums/${albumId}`, fd, {
        withCredentials: true,
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      // Reload album data to get populated userId
      const albumRes = await axios.get(`/api/albums/${albumId}`, { withCredentials: true })
      setAlbum(albumRes.data.album)
      setShowEdit(false)
      console.log(isOwner, user, album)
    } catch (err) {
      setEditError(err.response?.data?.message || 'Failed to save.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!window.confirm('Delete this album? This cannot be undone.')) return
    try {
      await axios.delete(`/api/albums/${albumId}`, { withCredentials: true })
      navigate('/albums')
    } catch {
      alert('Failed to delete album.')
    }
  }

  if (loading) return <div className='album-detail-page'><p className='album-detail-status'>Loading…</p></div>
  if (error) return <div className='album-detail-page'><p className='album-detail-status album-detail-error'>{error}</p></div>
  if (!album) return null

  const artistLabel = album.userId?.artistName || album.userId?.name || ''

  return (
    <div className='album-detail-page'>

      {/* <button className='album-detail-back' onClick={() => navigate('/albums')}>← Back</button> */}
      <BackBtn />

      {/* Hero */}
      <div className='album-detail-hero'>
        <div className='album-detail-cover-wrap'>
          {album.coverImage
            ? <img className='album-detail-cover' src={album.coverImage} alt={album.name} />
            : <div className='album-detail-cover-placeholder'>💿</div>
          }
        </div>
        <div className='album-detail-meta'>
          <span className='album-detail-label'>Album</span>
          <h1 className='album-detail-title'>{album.name}</h1>
          {artistLabel && <p className='album-detail-artist'>{artistLabel}</p>}
          <div className='album-detail-tags'>
            {album.genre && <span className='album-detail-tag'>{album.genre}</span>}
            <span className='album-detail-tag'>{songs.length} {songs.length === 1 ? 'song' : 'songs'}</span>
            {album.createdAt && (
              <span className='album-detail-tag'>
                Released {new Date(album.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
              </span>
            )}
          </div>
          {album.description && <p className='album-detail-desc'>{album.description}</p>}
          {isOwner && (
            <div className='album-detail-actions'>
              <button className='pl-btn pl-btn-ghost' onClick={openEdit}>Edit</button>
              <button className='pl-btn pl-btn-danger' onClick={handleDelete}>Delete</button>
            </div>
          )}
        </div>
      </div>

      {/* Song list */}
      {songs.length === 0
        ? <p className='album-detail-status'>No songs in this album yet.</p>
        : (
          <div className='album-detail-list'>
            <div className='album-detail-list-header'>
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
                  className={`album-song-row${isActive ? ' active' : ''}`}
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
                    <div className='album-song-thumb-wrap'>
                      {song.coverArtUrl
                        ? <img className='album-song-thumb' src={song.coverArtUrl} alt={song.title} />
                        : <div className='album-song-thumb-fallback'>♪</div>
                      }
                    </div>
                    <div className='album-song-info'>
                      <span className='album-song-title'>{song.title}</span>
                      <span className='album-song-artist'>{song.artistName}</span>
                    </div>
                  </div>

                  <span className='col-duration'>{fmt(song.duration)}</span>
                </div>
              )
            })}
          </div>
        )
      }

      {/* Edit Modal */}
      {showEdit && (
        <div className='pl-modal-backdrop' onClick={() => setShowEdit(false)}>
          <div className='pl-modal' onClick={e => e.stopPropagation()}>
            <p className='pl-modal-title'>Edit Album</p>

            <form className='pl-modal-form' onSubmit={handleEdit}>
              <div className='ad-edit-cover-row'>
                <div className='ad-edit-cover-thumb'>
                  {editPreview || album.coverImage
                    ? <img src={editPreview || album.coverImage} alt='cover' />
                    : <span>💿</span>
                  }
                </div>
                <label className='ad-edit-cover-label'>
                  Change cover
                  <input type='file' accept='image/*' onChange={handleCoverChange} hidden />
                </label>
              </div>

              <div className='pl-field'>
                <label className='pl-label'>Name *</label>
                <input
                  className='pl-input'
                  value={editForm.name}
                  onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                  placeholder='Album name'
                />
              </div>

              <div className='pl-field'>
                <label className='pl-label'>Description *</label>
                <textarea
                  className='pl-input ad-textarea'
                  value={editForm.description}
                  onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))}
                  placeholder='Album description'
                  rows={3}
                />
              </div>

              <div className='pl-field'>
                <label className='pl-label'>Genre</label>
                <select
                  className='pl-input'
                  value={editForm.genre}
                  onChange={e => setEditForm(f => ({ ...f, genre: e.target.value }))}
                >
                  {GENRES.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
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

export default AlbumDetail
