import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { useUser } from '../../context/UserContext'
import './concerts.css'

const statusLabel = { pending: 'Pending', accepted: 'Accepted', rejected: 'Rejected' }

const Concerts = () => {
  const { user } = useUser()
  const navigate = useNavigate()

  const defaultView = user?.profileType === 'artist' ? 'artist' : 'listener'
  const [profileType, setProfileType] = useState(defaultView)
  const [asListener, setAsListener] = useState([])
  const [asArtist, setAsArtist] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionLoading, setActionLoading] = useState(null)

  const fetchRequests = useCallback(() => {
    setLoading(true)
    setError('')
    axios
      .get('/api/concert-requests', { withCredentials: true })
      .then(res => {
        console.log("Fetched concert requests:", res.data)
        setAsListener(res.data.asListener)
        setAsArtist(res.data.asArtist)
      })
      .catch(() => setError('Failed to load concert requests.'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    fetchRequests()
  }, [fetchRequests])

  const handleStatus = async (id, status) => {
    setActionLoading(id + status)
    try {
      const res = await axios.patch(
        `/api/concert-requests/${id}/status`,
        { status },
        { withCredentials: true }
      )
      setAsArtist(prev => prev.map(r => r._id === id ? res.data.request : r))
    } catch {
      // keep current state on failure
    } finally {
      setActionLoading(null)
    }
  }

  const handleWithdraw = async (id) => {
    setActionLoading(id + 'withdraw')
    try {
      await axios.delete(`/api/concert-requests/${id}`, { withCredentials: true })
      setAsListener(prev => prev.filter(r => r._id !== id))
    } catch {
      // keep current state on failure
    } finally {
      setActionLoading(null)
    }
  }

  const rows = profileType === 'artist' ? asArtist : asListener

  return (
    <div id='concerts-container'>
      <div className='concerts-header'>
        <div className='concerts-header-left'>
          <h3 className='text-light-gray'>Upcoming</h3>
          <h2 className='primary-heading'>Concert Requests</h2>
        </div>

        <div className='concerts-header-right'>
          {profileType === 'listener' && (
            <button
              className='request-concert-btn'
              onClick={() => navigate('/artists')}
            >
              + Request New Concert
            </button>
          )}

          <div className='profile-toggle'>
            <button
              className={`toggle-opt ${profileType === 'artist' ? 'active' : ''}`}
              onClick={() => setProfileType('artist')}
            >
              Artist
            </button>
            <button
              className={`toggle-opt ${profileType === 'listener' ? 'active' : ''}`}
              onClick={() => setProfileType('listener')}
            >
              Listener
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <p className='concerts-status'>Loading…</p>
      ) : error ? (
        <p className='concerts-status concerts-error'>{error}</p>
      ) : rows.length === 0 ? (
        <p className='concerts-status'>No concert requests yet.</p>
      ) : (
        <table className='concerts-table'>
          <thead>
            <tr>
              <th>#</th>
              <th>{profileType === 'artist' ? 'Listener' : 'Artist'}</th>
              <th>Contact</th>
              <th>Date</th>
              <th>Message</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((req, index) => {
              const person = profileType === 'artist' ? req.userId : req.artistId
              const name = person?.artistName || person?.name || '—'
              const busy = actionLoading && actionLoading.startsWith(req._id)

              return (
                <tr key={req._id}>
                  <td>{String(index + 1).padStart(2, '0')}</td>
                  <td>{name}</td>
                  <td>{req.contactNo}</td>
                  <td>{req.date ? new Date(req.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}</td>
                  <td className='concerts-message'>{req.message || <span className='no-action'>—</span>}</td>
                  <td>
                    <span className={`status-badge status-${req.status}`}>
                      {statusLabel[req.status] ?? req.status}
                    </span>
                  </td>
                  <td>
                    {profileType === 'artist' ? (
                      req.status === 'pending' ? (
                        <div className='action-btns'>
                          <button
                            className='approve-btn'
                            disabled={!!busy}
                            onClick={() => handleStatus(req._id, 'accepted')}
                          >
                            Accept
                          </button>
                          <button
                            className='decline-btn'
                            disabled={!!busy}
                            onClick={() => handleStatus(req._id, 'rejected')}
                          >
                            Reject
                          </button>
                        </div>
                      ) : <span className='no-action'>—</span>
                    ) : (
                      req.status === 'pending' ? (
                        <button
                          className='withdraw-btn'
                          disabled={!!busy}
                          onClick={() => handleWithdraw(req._id)}
                        >
                          Withdraw
                        </button>
                      ) : <span className='no-action'>—</span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}
    </div>
  )
}

export default Concerts
