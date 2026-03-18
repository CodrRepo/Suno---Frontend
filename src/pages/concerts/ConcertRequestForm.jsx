import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import axios from '../../utils/axios';  // adjust path as needed
import './concertRequestForm.css'

const today = new Date().toISOString().split('T')[0]

const ConcertRequestForm = () => {
  const { artistId } = useParams()
  const navigate = useNavigate()

  const [artist, setArtist] = useState(null)
  const [contactNo, setContactNo] = useState('')
  const [message, setMessage] = useState('')
  const [date, setDate] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    axios
      .get(`/api/users/artists/${artistId}`, { withCredentials: true })
      .then(res => setArtist(res.data.artist))
      .catch(() => setError('Failed to load artist info.'))
  }, [artistId])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      await axios.post(
        '/api/concert-requests',
        { artistId, contactNo, message, date },
        { withCredentials: true }
      )
      navigate('/concerts')
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send request.')
    } finally {
      setSubmitting(false)
    }
  }

  const displayName = artist ? (artist.artistName || artist.name) : '…'

  return (
    <div className='crf-page'>
      <button className='crf-back' onClick={() => navigate(-1)}>← Back</button>

      <div className='crf-card'>
        <div className='crf-heading'>
          <h2 className='crf-title'>Request a Concert</h2>
          {artist && (
            <p className='crf-subtitle'>
              Sending request to <span className='crf-artist-name'>{displayName}</span>
            </p>
          )}
        </div>

        {error && <p className='crf-error'>{error}</p>}

        <form className='crf-form' onSubmit={handleSubmit}>
          <div className='crf-field'>
            <label className='crf-label'>Contact Number</label>
            <input
              className='crf-input'
              type='tel'
              placeholder='+911234567890'
              value={contactNo}
              onChange={e => setContactNo(e.target.value)}
              pattern='^\+\d{11,14}$'
              title='Enter country code followed by 10-digit number (e.g. +911234567890)'
              required
            />
            <span className='crf-hint'>Format: +&lt;country code&gt;&lt;10-digit number&gt; — e.g. +911234567890</span>
          </div>

          <div className='crf-field'>
            <label className='crf-label'>Concert Date</label>
            <input
              className='crf-input'
              type='date'
              value={date}
              onChange={e => setDate(e.target.value)}
              min={today}
              required
            />
          </div>

          <div className='crf-field'>
            <label className='crf-label'>
              Message
              <span className='crf-optional'> — max 300 chars</span>
            </label>
            <textarea
              className='crf-textarea'
              placeholder='Tell the artist about your event idea…'
              value={message}
              onChange={e => setMessage(e.target.value)}
              maxLength={300}
              rows={4}
              required
            />
            <span className='crf-char-count'>{message.length} / 300</span>
          </div>

          <button className='crf-submit' type='submit' disabled={submitting}>
            {submitting ? 'Sending…' : 'Send Request'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default ConcertRequestForm
