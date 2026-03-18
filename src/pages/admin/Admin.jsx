import React, { useCallback, useEffect, useMemo, useState } from 'react'
import axios from '../../utils/axios';  // adjust path as needed
import { useUser } from '../../context/UserContext'
import './admin.css'

const fmtDate = (d) => {
  if (!d) return '—'
  return new Date(d).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

const Admin = () => {
  const { user } = useUser()
  const [tab, setTab] = useState('users')
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState('')
  const [error, setError] = useState('')

  const [users, setUsers] = useState([])
  const [songs, setSongs] = useState([])

  const isAdmin = user?.profileType === 'admin'

  const fetchData = useCallback(async () => {
    if (!isAdmin) return
    setLoading(true)
    setError('')
    try {
      const [usersRes, songsRes] = await Promise.all([
        axios.get('/api/admin/users', { withCredentials: true }),
        axios.get('/api/admin/songs', { withCredentials: true }),
      ])
      setUsers(usersRes.data.users || [])
      setSongs(songsRes.data.songs || [])
    } catch {
      setError('Failed to load admin data.')
    } finally {
      setLoading(false)
    }
  }, [isAdmin])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const sortedUsers = useMemo(() => {
    return [...users].sort((a, b) => new Date(b.createDate || 0) - new Date(a.createDate || 0))
  }, [users])

  const sortedSongs = useMemo(() => {
    return [...songs].sort((a, b) => new Date(b.uploadDate || 0) - new Date(a.uploadDate || 0))
  }, [songs])

  const deleteUser = async (userId) => {
    if (!window.confirm('Delete this user and all related data (songs, uploads, playlists)?')) return
    setBusyId(userId)
    try {
      await axios.delete(`/api/admin/users/${userId}`, { withCredentials: true })
      setUsers((prev) => prev.filter((u) => u._id !== userId))
      setSongs((prev) => prev.filter((s) => (s.artistId?._id || s.artistId) !== userId))
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete user.')
    } finally {
      setBusyId('')
    }
  }

  const deleteSong = async (songId) => {
    if (!window.confirm('Delete this song and its Cloudinary assets?')) return
    setBusyId(songId)
    try {
      await axios.delete(`/api/admin/songs/${songId}`, { withCredentials: true })
      setSongs((prev) => prev.filter((s) => s._id !== songId))
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete song.')
    } finally {
      setBusyId('')
    }
  }

  if (!isAdmin) {
    return <div className='admin-page'><p className='admin-status'>Admin access only.</p></div>
  }

  return (
    <div className='admin-page'>
      <h3 className='text-light-gray'>Control Center</h3>
      <h2 className='primary-heading'>Admin</h2>

      <div className='admin-tabs'>
        <button className={tab === 'users' ? 'active' : ''} onClick={() => setTab('users')}>Users</button>
        <button className={tab === 'songs' ? 'active' : ''} onClick={() => setTab('songs')}>Songs</button>
      </div>

      {loading && <p className='admin-status'>Loading...</p>}
      {error && !loading && <p className='admin-status admin-error'>{error}</p>}

      {!loading && !error && tab === 'users' && (
        <div className='admin-table-wrap'>
          <table className='admin-table'>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Type</th>
                <th>Created</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {sortedUsers.map((u) => (
                <tr key={u._id}>
                  <td>{u.artistName || u.name || '—'}</td>
                  <td>{u.email}</td>
                  <td>{u.profileType}</td>
                  <td>{fmtDate(u.createDate)}</td>
                  <td>
                    <button
                      className='admin-danger-btn'
                      onClick={() => deleteUser(u._id)}
                      disabled={busyId === u._id || u.profileType === 'admin'}
                      title={u.profileType === 'admin' ? 'Cannot delete admin from here' : 'Delete user'}
                    >
                      {busyId === u._id ? 'Deleting...' : 'Delete'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!sortedUsers.length && <p className='admin-status'>No users found.</p>}
        </div>
      )}

      {!loading && !error && tab === 'songs' && (
        <div className='admin-table-wrap'>
          <table className='admin-table'>
            <thead>
              <tr>
                <th>Title</th>
                <th>Artist</th>
                <th>Genre</th>
                <th>Uploaded</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {sortedSongs.map((s) => (
                <tr key={s._id}>
                  <td>{s.title}</td>
                  <td>{s.artistName || s.artistId?.artistName || s.artistId?.name || 'Unknown Artist'}</td>
                  <td>{s.genre || 'Unknown'}</td>
                  <td>{fmtDate(s.uploadDate)}</td>
                  <td>
                    <button
                      className='admin-danger-btn'
                      onClick={() => deleteSong(s._id)}
                      disabled={busyId === s._id}
                    >
                      {busyId === s._id ? 'Deleting...' : 'Delete'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!sortedSongs.length && <p className='admin-status'>No songs found.</p>}
        </div>
      )}
    </div>
  )
}

export default Admin
