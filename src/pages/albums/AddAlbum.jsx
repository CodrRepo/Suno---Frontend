import React, { useState, useRef, useEffect } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import { useUser } from '../../context/UserContext'
import '../songs/addSong.css'
import './addAlbum.css'

const GENRES = ['Pop', 'Rock', 'Hip-Hop', 'R&B', 'Jazz', 'Classical', 'Electronic', 'Country', 'Metal', 'Folk', 'Other']

const AddAlbum = () => {
  const navigate = useNavigate()
  const { user, loading } = useUser()

  const [form, setForm] = useState({ name: '', description: '', genre: '' })
  const [coverPreview, setCoverPreview] = useState(null)
  const [coverFile, setCoverFile] = useState(null)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const coverPreviewRef = useRef(null)

  useEffect(() => {
    if (!loading && user && user.profileType !== 'artist') {
      navigate('/albums')
    }
  }, [user, loading, navigate])

  const handleChange = (e) => {
    const { name, value } = e.target
    setError('')
    setForm(f => ({ ...f, [name]: value }))
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
      setError('Album name is required.')
      return
    }

    if (!form.description.trim()) {
      setError('Description is required.')
      return
    }

    setSubmitting(true)
    setError('')

    const data = new FormData()
    data.append('name', form.name.trim())
    data.append('description', form.description.trim())
    data.append('genre', form.genre || 'Other')
    if (coverFile) data.append('coverImage', coverFile)

    try {
      await axios.post('/api/albums', data, { withCredentials: true })
      navigate('/albums')
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create album.')
      setSubmitting(false)
    }
  }

  if (loading || !user) return null

  return (
    <div className='add-song-page'>

      <div className='add-song-page-header'>
        <button className='add-song-back-btn' onClick={() => navigate('/albums')}>← Back</button>
        <h1 className='primary-heading'>New Album</h1>
      </div>

      <div className='add-song-card'>
        <form className='add-song-form' onSubmit={handleSubmit}>
          {error && <p className='add-song-error'>{error}</p>}

          <div className='add-song-layout'>

            <label className='cover-art-picker' title='Choose cover image'>
              <input type='file' accept='image/jpeg,image/png,image/webp' onChange={handleCoverChange} />
              {coverPreview
                ? <img src={coverPreview} alt='Cover preview' className='cover-art-preview' />
                : (
                  <div className='cover-art-placeholder'>
                    <span className='cover-art-icon'>💿</span>
                    <span className='cover-art-hint'>Cover Image</span>
                  </div>
                )
              }
              <div className='cover-art-overlay'>Change</div>
            </label>

            <div className='add-song-grid'>

              <div className='add-song-field full-span'>
                <label>Album Name <span className='add-song-required'>*</span></label>
                <input
                  name='name'
                  value={form.name}
                  onChange={handleChange}
                  placeholder='Album name'
                  required
                />
              </div>

              <div className='add-song-field full-span'>
                <label>Description <span className='add-song-required'>*</span></label>
                <textarea
                  name='description'
                  value={form.description}
                  onChange={handleChange}
                  placeholder='Tell listeners about this album…'
                  rows={4}
                  required
                />
              </div>

              <div className='add-song-field'>
                <label>Genre</label>
                <select name='genre' value={form.genre} onChange={handleChange}>
                  <option value=''>Other</option>
                  {GENRES.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>

            </div>
          </div>

          <div className='add-song-actions'>
            <button type='button' className='add-song-btn-cancel' onClick={() => navigate('/albums')}>
              Cancel
            </button>
            <button type='submit' className='add-song-btn-submit' disabled={submitting}>
              {submitting ? 'Creating…' : 'Create Album'}
            </button>
          </div>
        </form>
      </div>

    </div>
  )
}

export default AddAlbum
