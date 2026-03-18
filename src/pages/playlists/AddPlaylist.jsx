import React, { useState, useRef } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import '../songs/addSong.css'
import '../albums/addAlbum.css'

const AddPlaylist = () => {
  const navigate = useNavigate()

  const [form, setForm] = useState({ name: '', description: '' })
  const [coverPreview, setCoverPreview] = useState(null)
  const [coverFile, setCoverFile] = useState(null)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const coverPreviewRef = useRef(null)

  const handleChange = (e) => {
    const { name, value } = e.target
    setError('')
    setForm((f) => ({ ...f, [name]: value }))
  }

  const handleCoverChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setError('')
    setCoverFile(file)
    if (coverPreviewRef.current) URL.revokeObjectURL(coverPreviewRef.current)
    const url = URL.createObjectURL(file)
    coverPreviewRef.current = url
    setCoverPreview(url)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!form.name.trim()) {
      setError('Playlist name is required.')
      return
    }

    setSubmitting(true)
    setError('')

    const data = new FormData()
    data.append('name', form.name.trim())
    if (form.description.trim()) data.append('description', form.description.trim())
    if (coverFile) data.append('coverImage', coverFile)

    try {
      await axios.post('/api/playlists', data, { withCredentials: true })
      navigate('/playlists')
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create playlist.')
      setSubmitting(false)
    }
  }

  return (
    <div className='add-song-page'>

      <div className='add-song-page-header'>
        <button className='add-song-back-btn' onClick={() => navigate('/playlists')}>
          ← Back
        </button>
        <h1 className='primary-heading'>New Playlist</h1>
      </div>

      <div className='add-song-card'>
        <form className='add-song-form' onSubmit={handleSubmit}>
          {error && <p className='add-song-error'>{error}</p>}

          <div className='add-song-layout'>

            <label className='cover-art-picker' title='Choose cover art'>
              <input
                type='file'
                accept='image/jpeg,image/png,image/webp'
                onChange={handleCoverChange}
              />
              {coverPreview ? (
                <img src={coverPreview} alt='Cover preview' className='cover-art-preview' />
              ) : (
                <div className='cover-art-placeholder'>
                  <span className='cover-art-icon'>🎵</span>
                  <span className='cover-art-hint'>Cover Art</span>
                </div>
              )}
              <div className='cover-art-overlay'>Change</div>
            </label>

            <div className='add-song-grid'>

              <div className='add-song-field full-span'>
                <label>
                  Playlist Name <span className='add-song-required'>*</span>
                </label>
                <input
                  name='name'
                  value={form.name}
                  onChange={handleChange}
                  placeholder='My Playlist'
                />
              </div>

              <div className='add-song-field full-span'>
                <label>Description</label>
                <textarea
                  name='description'
                  value={form.description}
                  onChange={handleChange}
                  placeholder='What is this playlist about?'
                  rows={4}
                />
              </div>

            </div>
          </div>

          <div className='add-song-actions'>
            <button
              type='button'
              className='add-song-btn-cancel'
              onClick={() => navigate('/playlists')}
            >
              Cancel
            </button>
            <button
              type='submit'
              className='add-song-btn-submit'
              disabled={submitting}
            >
              {submitting ? 'Creating…' : 'Create Playlist'}
            </button>
          </div>
        </form>
      </div>

    </div>
  )
}

export default AddPlaylist
