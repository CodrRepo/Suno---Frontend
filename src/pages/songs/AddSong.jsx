import React, { useState, useRef, useEffect } from 'react'
import axios from '../../utils/axios'
import { useNavigate } from 'react-router-dom'
import { useUser } from '../../context/UserContext'
import './addSong.css'

const GENRES = ['Pop', 'Rock', 'Hip-Hop', 'R&B', 'Jazz', 'Classical', 'Electronic', 'Country', 'Metal', 'Folk', 'Other']

const emptyForm = {
  title: '',
  artistName: '',
  minutes: '',
  seconds: '',
  genre: '',
  albumId: '',
  audioFile: null,
  coverArtFile: null,
}

const AddSong = () => {
  const navigate = useNavigate()
  const { user } = useUser()

  const [form, setForm] = useState(emptyForm)
  const [coverPreview, setCoverPreview] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [detecting, setDetecting] = useState(false)
  const [albums, setAlbums] = useState([])

  useEffect(() => {
    if (user?.profileType === 'artist') {
      axios
        .get('/api/albums/my', { withCredentials: true })
        .then(res => setAlbums(res.data.albums))
        .catch(() => {})
    }
  }, [user])

  const audioRef = useRef(null)
  const coverPreviewRef = useRef(null)

  const handleAudioChange = (e) => {
    const file = e.target.files[0]
    if (!file) return

    setError('')
    setForm(f => ({ ...f, audioFile: file, minutes: '', seconds: '' }))

    if (audioRef.current) {
      audioRef.current.src = ''
      audioRef.current = null
    }

    setDetecting(true)
    const objectUrl = URL.createObjectURL(file)
    const audio = new Audio()
    audioRef.current = audio

    audio.addEventListener('loadedmetadata', () => {
      const total = Math.round(audio.duration)
      setForm(f => ({
        ...f,
        minutes: String(Math.floor(total / 60)),
        seconds: String(total % 60).padStart(2, '0'),
      }))
      setDetecting(false)
      URL.revokeObjectURL(objectUrl)
    })

    audio.addEventListener('error', () => {
      setDetecting(false)
      URL.revokeObjectURL(objectUrl)
    })

    audio.src = objectUrl
  }

  const handleCoverChange = (e) => {
    const file = e.target.files[0]
    if (!file) return

    setError('')
    setForm(f => ({ ...f, coverArtFile: file }))

    if (coverPreviewRef.current) {
      URL.revokeObjectURL(coverPreviewRef.current)
    }
    const url = URL.createObjectURL(file)
    coverPreviewRef.current = url
    setCoverPreview(url)
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setError('')
    setForm(f => ({ ...f, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    const artistName = (form.artistName || user?.artistName || '').trim()

    if (!form.audioFile) {
      setError('Please choose an audio file.')
      return
    }

    if (!artistName) {
      setError('Artist name is required.')
      return
    }

    const mins = parseInt(form.minutes) || 0
    const secs = parseInt(form.seconds) || 0
    const duration = mins * 60 + secs

    if (duration <= 0) {
      setError('Please enter a valid duration.')
      return
    }

    setLoading(true)
    setError('')

    const data = new FormData()
    data.append('title', form.title)
    data.append('artistName', artistName)
    data.append('duration', duration)
    data.append('genre', form.genre || 'Unknown')
    if (form.albumId) data.append('albumId', form.albumId)
    data.append('audio', form.audioFile)
    if (form.coverArtFile) {
      data.append('coverArt', form.coverArtFile)
    }

    try {
      await axios.post('/api/songs/upload', data, { withCredentials: true })
      navigate('/songs')
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to upload song.')
      setLoading(false)
    }
  }

  const durationDetected = !detecting && (form.minutes !== '' || form.seconds !== '')

  return (
    <div className='add-song-page'>

      <div className='add-song-page-header'>
        <button className='add-song-back-btn' onClick={() => navigate('/songs')}>← Back</button>
        <h1 className='primary-heading'>Add New Song</h1>
      </div>

      <div className='add-song-card'>
        <form className='add-song-form' onSubmit={handleSubmit}>
          {error && <p className='add-song-error'>{error}</p>}

          <div className='add-song-layout'>

            {/* Cover art picker */}
            <label className='cover-art-picker' title='Choose cover art'>
              <input
                type='file'
                accept='image/jpeg,image/png,image/webp'
                onChange={handleCoverChange}
              />
              {coverPreview
                ? <img src={coverPreview} alt='Cover preview' className='cover-art-preview' />
                : (
                  <div className='cover-art-placeholder'>
                    <span className='cover-art-icon'>🎵</span>
                    <span className='cover-art-hint'>Cover Art</span>
                  </div>
                )
              }
              <div className='cover-art-overlay'>Change</div>
            </label>

            {/* Fields */}
            <div className='add-song-grid'>

              <div className='add-song-field full-span'>
                <label>Title <span className='add-song-required'>*</span></label>
                <input
                  name='title'
                  value={form.title}
                  onChange={handleChange}
                  placeholder='Song title'
                  required
                />
              </div>

              <div className='add-song-field full-span'>
                <label>Artist Name <span className='add-song-required'>*</span></label>
                <input
                  name='artistName'
                  value={form.artistName || user?.artistName || ''}
                  onChange={handleChange}
                  placeholder='Artist name'
                  required
                />
              </div>

              <div className='add-song-field full-span'>
                <label>
                  Audio File <span className='add-song-required'>*</span>
                  {detecting && <span className='detecting-badge'>Detecting duration…</span>}
                </label>
                <label className='file-picker'>
                  <input
                    type='file'
                    accept='audio/mpeg,audio/wav,audio/flac,audio/aac,audio/ogg'
                    onChange={handleAudioChange}
                  />
                  <span className='file-picker-btn'>Choose File</span>
                  <span className='file-picker-name'>
                    {form.audioFile ? form.audioFile.name : 'No file chosen'}
                  </span>
                </label>
              </div>

              {durationDetected ? (
                <div className='add-song-field'>
                  <label>Duration</label>
                  <div className='duration-detected'>
                    <span className='duration-detected-value'>{form.minutes}:{form.seconds}</span>
                    <span className='duration-detected-label'>auto-detected</span>
                    <button
                      type='button'
                      className='duration-edit-btn'
                      onClick={() => setForm(f => ({ ...f, minutes: '', seconds: '' }))}
                    >
                      edit
                    </button>
                  </div>
                </div>
              ) : !detecting && (
                <div className='add-song-field'>
                  <label>Duration <span className='add-song-required'>*</span></label>
                  <div className='add-song-duration'>
                    <input
                      type='number'
                      name='minutes'
                      value={form.minutes}
                      onChange={handleChange}
                      placeholder='mm'
                      min='0'
                      max='99'
                    />
                    <span className='add-song-duration-sep'>:</span>
                    <input
                      type='number'
                      name='seconds'
                      value={form.seconds}
                      onChange={handleChange}
                      placeholder='ss'
                      min='0'
                      max='59'
                    />
                  </div>
                </div>
              )}

              <div className='add-song-field'>
                <label>Genre</label>
                <select name='genre' value={form.genre} onChange={handleChange}>
                  <option value=''>Unknown</option>
                  {GENRES.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>

              {user?.profileType === 'artist' && (
                <div className='add-song-field'>
                  <label>Album</label>
                  <select name='albumId' value={form.albumId} onChange={handleChange}>
                    <option value=''>No Album</option>
                    {albums.map(a => (
                      <option key={a._id} value={a._id}>{a.name}</option>
                    ))}
                  </select>
                </div>
              )}

            </div>
          </div>

          <div className='add-song-actions'>
            <button type='button' className='add-song-btn-cancel' onClick={() => navigate('/songs')}>
              Cancel
            </button>
            <button type='submit' className='add-song-btn-submit' disabled={loading || detecting}>
              {loading ? 'Uploading…' : 'Upload Song'}
            </button>
          </div>
        </form>
      </div>

    </div>
  )
}

export default AddSong
