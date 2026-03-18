import React, { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import axios from '../../utils/axios'
import { usePlayer } from '../../context/PlayerContext'
import { useUser } from '../../context/UserContext'
import './playlistDetail.css'
import '../playlists/playlists.css'

const fmt = (secs) => {
  const s = Math.round(secs)
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

const PlaylistDetail = () => {
  const { playlistId } = useParams()
  const navigate = useNavigate()
  const { playQueue, togglePlay, currentSong, playing } = usePlayer()
  const { user } = useUser()

  const [playlist, setPlaylist] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Edit modal
  const [showEdit, setShowEdit] = useState(false)
  const [editForm, setEditForm] = useState({ name: '', description: ''})
  const [editError, setEditError] = useState('')
  const [saving, setSaving] = useState(false)

  // Add Songs modal
  const [showAddSongs, setShowAddSongs] = useState(false)
  const [allSongs, setAllSongs] = useState([])
  const [songsLoading, setSongsLoading] = useState(false)
  const [selected, setSelected] = useState(new Set())
  const [searchQuery, setSearchQuery] = useState('')
  const [addingError, setAddingError] = useState('')
  const [addingInProgress, setAddingInProgress] = useState(false)

  const fetchPlaylist = useCallback(() => {
    setLoading(true)
    axios
      .get(`/api/playlists/${playlistId}`, { withCredentials: true })
      .then((res) => setPlaylist(res.data.playlist))
      .catch(() => setError('Failed to load playlist.'))
      .finally(() => setLoading(false))
  }, [playlistId])

  useEffect(() => {
    fetchPlaylist()
  }, [fetchPlaylist])

  const isOwner =
    user && playlist
      ? user._id?.toString() === playlist.userId._id.toString()
      : false

  const handleRowClick = (song, index) => {
    if (currentSong?._id === song._id) togglePlay()
    else playQueue(playlist.songs, index)
  }

  const handleRemoveSong = async (e, songId) => {
    e.stopPropagation()
    try {
      await axios.delete(`/api/playlists/${playlistId}/songs/${songId}`, {
        withCredentials: true,
      })
      setPlaylist((prev) => ({
        ...prev,
        songs: prev.songs.filter((s) => s._id !== songId),
      }))
    } catch {
      // silent — row stays, user can retry
    }
  }

  const handleDelete = async () => {
    if (!window.confirm('Delete this playlist? This cannot be undone.')) return
    try {
      await axios.delete(`/api/playlists/${playlistId}`, { withCredentials: true })
      navigate('/playlists')
    } catch {
      alert('Failed to delete playlist.')
    }
  }

  const openEdit = () => {
    setEditForm({
      name: playlist.name,
      description: playlist.description,
    })
    setEditError('')
    setShowEdit(true)
  }

  const handleEdit = async (e) => {
    e.preventDefault()
    if (!editForm.name.trim()) {
      setEditError('Name is required.')
      return
    }
    setSaving(true)
    setEditError('')
    try {
      const res = await axios.patch(`/api/playlists/${playlistId}`, editForm, {
        withCredentials: true,
      })
      setPlaylist((prev) => ({
        ...prev,
        name: res.data.playlist.name,
        description: res.data.playlist.description,
        isPublic: res.data.playlist.isPublic,
      }))
      setShowEdit(false)
    } catch (err) {
      setEditError(err.response?.data?.message || 'Failed to save changes.')
    } finally {
      setSaving(false)
    }
  }

  const openAddSongs = () => {
    setSelected(new Set())
    setSearchQuery('')
    setAddingError('')
    setShowAddSongs(true)
    setSongsLoading(true)
    axios
      .get('/api/songs', { withCredentials: true })
      .then((res) => {
        const existing = new Set(playlist.songs.map((s) => s._id))
        setAllSongs(res.data.songs.filter((s) => !existing.has(s._id)))
      })
      .catch(() => setAddingError('Failed to load songs.'))
      .finally(() => setSongsLoading(false))
  }

  const toggleSelect = (songId) => {
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(songId) ? next.delete(songId) : next.add(songId)
      return next
    })
  }

  const handleAddSongs = async () => {
    if (selected.size === 0) return
    setAddingInProgress(true)
    setAddingError('')
    try {
      await Promise.all(
        [...selected].map((songId) =>
          axios.post(
            `/api/playlists/${playlistId}/songs`,
            { songId },
            { withCredentials: true }
          )
        )
      )
      setShowAddSongs(false)
      fetchPlaylist()
    } catch {
      setAddingError('Some songs could not be added. Please try again.')
    } finally {
      setAddingInProgress(false)
    }
  }

  const filteredSongs = allSongs.filter((s) =>
    `${s.title} ${s.artistName}`.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // ── Render ──────────────────────────────────────────────

  if (loading)
    return (
      <div className='pd-page'>
        <p className='pd-status'>Loading…</p>
      </div>
    )

  if (error)
    return (
      <div className='pd-page'>
        <p className='pd-status pd-error'>{error}</p>
      </div>
    )

  if (!playlist) return null

  const ownerLabel = playlist.userId?.artistName || playlist.userId?.name || ''

  return (
    <div className='pd-page'>
      <button className='pd-back' onClick={() => navigate('/playlists')}>
        ← Back
      </button>

      {/* Hero */}
      <div className='pd-hero'>
        <div className='pd-cover-wrap'>
          {playlist.coverImage ? (
            <img className='pd-cover' src={playlist.coverImage} alt={playlist.name} />
          ) : (
            <div className='pd-cover-placeholder'>♫</div>
          )}
        </div>
        <div className='pd-meta'>
          <span className='pd-label'>Playlist</span>
          <h1 className='pd-title'>{playlist.name}</h1>
          {ownerLabel && <p className='pd-owner'>{ownerLabel}</p>}
          <div className='pd-tags'>
            <span className='pd-tag'>
              {playlist.songs.length} {playlist.songs.length === 1 ? 'song' : 'songs'}
            </span>
            {playlist.isFavorites && (
              <span className='pd-tag pd-tag-favorites'>♥ Favorites</span>
            )}
          </div>
          {playlist.description && <p className='pd-desc'>{playlist.description}</p>}

          {isOwner && (
            <div className='pd-actions'>
              <button className='pl-btn pl-btn-ghost' onClick={openEdit}>
                Edit
              </button>
              <button className='pl-btn pl-btn-ghost' onClick={openAddSongs}>
                + Add Songs
              </button>
              {!playlist.isFavorites && (
                <button className='pl-btn pl-btn-danger' onClick={handleDelete}>
                  Delete
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Song list */}
      {playlist.songs.length === 0 ? (
        <p className='pd-status'>
          No songs yet.{isOwner ? ' Click "+ Add Songs" to get started.' : ''}
        </p>
      ) : (
        <div className='pd-list'>
          <div className={`pd-list-header${isOwner ? ' with-actions' : ''}`}>
            <span className='col-num'>#</span>
            <span className='col-title'>Title</span>
            <span className='col-duration'>Duration</span>
            {isOwner && <span />}
          </div>

          {playlist.songs.map((song, i) => {
            const isActive = currentSong?._id === song._id
            const isPlaying = isActive && playing

            return (
              <div
                key={song._id}
                className={`pd-song-row${isActive ? ' active' : ''}${isOwner ? ' with-actions' : ''}`}
                onClick={() => handleRowClick(song, i)}
              >
                <span className='col-num'>
                  {isPlaying ? (
                    <svg className='playing-icon' viewBox='0 0 24 24' fill='currentColor'>
                      <path d='M6 19h4V5H6v14zm8-14v14h4V5h-4z' />
                    </svg>
                  ) : isActive ? (
                    <svg className='playing-icon' viewBox='0 0 24 24' fill='currentColor'>
                      <path d='M8 5v14l11-7z' />
                    </svg>
                  ) : (
                    <span className='track-num'>{i + 1}</span>
                  )}
                </span>

                <div className='col-title'>
                  <div className='pd-thumb-wrap'>
                    {song.coverArtUrl ? (
                      <img className='pd-thumb' src={song.coverArtUrl} alt={song.title} />
                    ) : (
                      <div className='pd-thumb-fallback'>♪</div>
                    )}
                  </div>
                  <div className='pd-song-info'>
                    <span className='pd-song-title'>{song.title}</span>
                    <span className='pd-song-artist'>{song.artistName}</span>
                  </div>
                </div>

                <span className='col-duration'>{fmt(song.duration)}</span>

                {isOwner && (
                  <button
                    className='pd-remove-btn'
                    onClick={(e) => handleRemoveSong(e, song._id)}
                    title='Remove from playlist'
                  >
                    ✕
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Edit Modal */}
      {showEdit && (
        <div className='pl-modal-backdrop' onClick={() => setShowEdit(false)}>
          <div className='pl-modal' onClick={(e) => e.stopPropagation()}>
            <h3 className='pl-modal-title'>Edit Playlist</h3>
            <form onSubmit={handleEdit} className='pl-modal-form'>
              <div className='pl-field'>
                <label className='pl-label'>Name</label>
                <input
                  className='pl-input'
                  type='text'
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                />
              </div>
              <div className='pl-field'>
                <label className='pl-label'>Description</label>
                <textarea
                  className='pl-input pl-textarea'
                  rows={3}
                  value={editForm.description}
                  onChange={(e) =>
                    setEditForm({ ...editForm, description: e.target.value })
                  }
                />
              </div>
              {editError && <p className='pl-form-error'>{editError}</p>}
              <div className='pl-modal-actions'>
                <button
                  type='button'
                  className='pl-btn pl-btn-ghost'
                  onClick={() => setShowEdit(false)}
                >
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

      {/* Add Songs Modal */}
      {showAddSongs && (
        <div className='pl-modal-backdrop' onClick={() => setShowAddSongs(false)}>
          <div className='pl-modal pd-add-modal' onClick={(e) => e.stopPropagation()}>
            <h3 className='pl-modal-title'>Add Songs</h3>

            <input
              className='pl-input pd-search'
              type='text'
              placeholder='Search by title or artist…'
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />

            {songsLoading && <p className='pd-status'>Loading songs…</p>}

            {!songsLoading && !addingError && filteredSongs.length === 0 && (
              <p className='pd-status'>
                {allSongs.length === 0
                  ? 'All songs are already in this playlist.'
                  : 'No matching songs.'}
              </p>
            )}

            {!songsLoading && filteredSongs.length > 0 && (
              <div className='pd-song-picker'>
                {filteredSongs.map((song) => (
                  <label key={song._id} className='pd-pick-row'>
                    <input
                      type='checkbox'
                      checked={selected.has(song._id)}
                      onChange={() => toggleSelect(song._id)}
                      className='pd-pick-check'
                    />
                    <div className='pd-thumb-wrap'>
                      {song.coverArtUrl ? (
                        <img className='pd-thumb' src={song.coverArtUrl} alt={song.title} />
                      ) : (
                        <div className='pd-thumb-fallback'>♪</div>
                      )}
                    </div>
                    <div className='pd-song-info'>
                      <span className='pd-song-title'>{song.title}</span>
                      <span className='pd-song-artist'>{song.artistName}</span>
                    </div>
                    <span className='col-duration'>{fmt(song.duration)}</span>
                  </label>
                ))}
              </div>
            )}

            {addingError && <p className='pl-form-error'>{addingError}</p>}

            <div className='pl-modal-actions'>
              <button
                type='button'
                className='pl-btn pl-btn-ghost'
                onClick={() => setShowAddSongs(false)}
              >
                Cancel
              </button>
              <button
                type='button'
                className='pl-btn pl-btn-primary'
                disabled={selected.size === 0 || addingInProgress}
                onClick={handleAddSongs}
              >
                {addingInProgress
                  ? 'Adding…'
                  : `Add ${selected.size > 0 ? selected.size + ' ' : ''}Song${selected.size !== 1 ? 's' : ''}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PlaylistDetail
