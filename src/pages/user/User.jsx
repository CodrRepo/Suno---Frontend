import React, { useState, useEffect, useRef } from 'react'
import axios from '../../utils/axios'
import { useNavigate } from 'react-router-dom'
import { useUser } from '../../context/UserContext'
import { clearAuthData } from '../../utils/clearAuth'
import './user.css'
import { usePlayer } from '../../context/PlayerContext'
import BackBtn from '../../components/backBtn/BackBtn'

function compressImage(file, maxPx = 400, quality = 0.82) {
  return new Promise((resolve) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      const ratio = Math.min(1, maxPx / Math.max(img.width, img.height))
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(img.width * ratio)
      canvas.height = Math.round(img.height * ratio)
      const ctx = canvas.getContext('2d')

      // If compression cannot be performed, fallback to original file upload.
      if (!ctx) {
        resolve(file)
        return
      }

      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      canvas.toBlob((blob) => resolve(blob || file), 'image/jpeg', quality)
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      resolve(file)
    }
    img.src = url
  })
}

const User = () => {
  const { user, setUser } = useUser()
  const navigate = useNavigate()

  const [form, setForm] = useState({
    name: '',
    artistName: '',
    bio: '',
    profilePicture: '',
    currentPassword: '',
    newPassword: '',
  })

  const [updateError, setUpdateError] = useState('')
  const [updateSuccess, setUpdateSuccess] = useState('')
  const [updateLoading, setUpdateLoading] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [toggleLoading, setToggleLoading] = useState(false)
  const [showArtistPrompt, setShowArtistPrompt] = useState(false)
  const [artistNameInput, setArtistNameInput] = useState('')
  const [artistNameError, setArtistNameError] = useState('')
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [avatarError, setAvatarError] = useState('')
  const avatarInputRef = useRef(null)
  const {pause} = usePlayer();

  useEffect(() => {
    if (user) {
      setForm(f => ({
        ...f,
        name: user.name || '',
        artistName: user.artistName || '',
        bio: user.bio || '',
        profilePicture: user.profilePicture || '',
      }))
    }
  }, [user])

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
    setUpdateError('')
    setUpdateSuccess('')
  }

  const handleUpdate = async (e) => {
    e.preventDefault()
    setUpdateError('')
    setUpdateSuccess('')
    setUpdateLoading(true)
    try {
      const payload = {
        name: form.name,
        bio: form.bio,
      }
      if (user.profileType === 'artist') payload.artistName = form.artistName
      if (form.newPassword) {
        payload.currentPassword = form.currentPassword
        payload.newPassword = form.newPassword
      }
      const res = await axios.patch('/api/users/me', payload, { withCredentials: true })
      setUser(res.data.user)
      setUpdateSuccess('Profile updated successfully.')
      setForm(f => ({ ...f, currentPassword: '', newPassword: '' }))
    } catch (err) {
      setUpdateError(err.response?.data?.message || 'Failed to update profile.')
    } finally {
      setUpdateLoading(false)
    }
  }

  const handleDelete = async () => {
    setDeleteLoading(true)
    try {
      await axios.delete('/api/users/me', { withCredentials: true })
      setUser(null)
      navigate('/login')
    } catch {
      setDeleteLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      await axios.post('/api/auth/logout', {}, { withCredentials: true })
    } catch {
      // proceed regardless
    }
    // Clear all auth data (localStorage + cookies)
    pause();
    clearAuthData()
    setUser(null)
    navigate('/login')
  }

  const handleProfileTypeToggle = async (type) => {
    if (type === user?.profileType || toggleLoading) return
    if (type === 'artist' && (!user?.artistName || !user?.profilePicture)) {
      setArtistNameInput(user?.artistName || '')
      setArtistNameError('')
      setShowArtistPrompt(true)
      return
    }
    setToggleLoading(true)
    try {
      const res = await axios.patch('/api/users/me/profile-type', { profileType: type }, { withCredentials: true })
      setUser(res.data.user)
    } catch {
      // silently ignore — badge in header still reflects current state
    } finally {
      setToggleLoading(false)
    }
  }

  const handleArtistNameConfirm = async () => {
    const hasProfilePhoto = Boolean(user?.profilePicture || form.profilePicture)

    if (!hasProfilePhoto) {
      setArtistNameError('Please upload a profile photo first.')
      return
    }
    if (!user?.artistName && !artistNameInput.trim()) {
      setArtistNameError('Artist name is required.')
      return
    }
    setToggleLoading(true)
    setArtistNameError('')
    try {
      await axios.patch('/api/users/me/profile-type', { profileType: 'artist' }, { withCredentials: true })
      if (!user?.artistName && artistNameInput.trim()) {
        const res = await axios.patch('/api/users/me', { artistName: artistNameInput.trim() }, { withCredentials: true })
        setUser(res.data.user)
      }
      setShowArtistPrompt(false)
    } catch (err) {
      setArtistNameError(err.response?.data?.message || 'Failed to switch profile.')
    } finally {
      setToggleLoading(false)
    }
  }

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setAvatarUploading(true)
    setAvatarError('')
    try {
      const blobOrFile = await compressImage(file)
      const data = new FormData()
      if (blobOrFile instanceof File) {
        data.append('avatar', blobOrFile, blobOrFile.name || 'avatar.jpg')
      } else {
        data.append('avatar', blobOrFile, 'avatar.jpg')
      }

      const res = await axios.patch('/api/users/me/avatar', data, { withCredentials: true })
      setUser(res.data.user)
      setForm(f => ({ ...f, profilePicture: res.data.user.profilePicture }))
    } catch (err) {
      setAvatarError(err.response?.data?.message || 'Failed to upload photo. Please try again.')
    } finally {
      setAvatarUploading(false)
      e.target.value = ''
    }
  }

  const avatarLetter = user?.name?.[0]?.toUpperCase() || '?'
  const joinDate = user?.createDate
    ? new Date(user.createDate).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : ''

  return (
    <div className='user-page'>
      <BackBtn />
      {/* ── Header banner ── */}
      <div className='user-header'>
        <div className='user-avatar-col'>
          <div
            className={`user-avatar${avatarUploading ? ' user-avatar--uploading' : ''}`}
            onClick={() => !avatarUploading && avatarInputRef.current?.click()}
            title='Change photo'
          >
          {user?.profilePicture
            ? <img src={user.profilePicture} alt={user.name} />
            : <span>{avatarLetter}</span>
          }
          <div className='user-avatar-overlay'>
            {avatarUploading
              ? <span>Uploading…</span>
              : <>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="18" height="18" fill="currentColor"><path d="M149.1 64.8L138.7 96 64 96C28.7 96 0 124.7 0 160L0 416c0 35.3 28.7 64 64 64l384 0c35.3 0 64-28.7 64-64l0-256c0-35.3-28.7-64-64-64l-74.7 0L362.9 64.8C356.4 45.2 338.1 32 317.4 32L194.6 32c-20.7 0-39 13.2-45.5 32.8zM256 192a96 96 0 1 1 0 192 96 96 0 1 1 0-192z"/></svg>
                  <span>Add Photo</span>
                </>
            }
          </div>
          <input
            ref={avatarInputRef}
            type='file'
            accept='image/*'
            style={{ display: 'none' }}
            onChange={handleAvatarChange}
          />
        </div>
        {avatarError && <p className='user-avatar-error'>{avatarError}</p>}
        </div>

        <div className='user-header-info'>
          <div className='user-header-top'>
            <h1>{user?.name}</h1>
            <span className='user-badge'>{user?.profileType}</span>
          </div>
          <p className='user-email'>{user?.email}</p>
          {joinDate && <p className='user-joined'>Member since {joinDate}</p>}
        </div>

        <div className='user-stats'>
          <div className='stat'>
            <span className='stat-value'>{user?.followers ?? 0}</span>
            <span className='stat-label'>Followers</span>
          </div>
          <div className='stat-divider' />
          <div className='stat'>
            <span className='stat-value'>{user?.following ?? 0}</span>
            <span className='stat-label'>Following</span>
          </div>
        </div>
      </div>

      {/* ── Profile type toggle ── */}
      {user?.profileType !== 'admin' && (
        <div className='user-card profile-type-card'>
          <h2 className='user-card-title'>Account Type</h2>
          <p className='profile-type-desc'>Switch between listener and artist mode. Artist accounts can upload songs and albums.</p>
          <div className='profile-type-toggle'>
            <button
              className={`profile-type-btn${user?.profileType === 'listener' ? ' active' : ''}`}
              onClick={() => handleProfileTypeToggle('listener')}
              disabled={toggleLoading}
            >
              Listener
            </button>
            <button
              className={`profile-type-btn${user?.profileType === 'artist' ? ' active' : ''}`}
              onClick={() => handleProfileTypeToggle('artist')}
              disabled={toggleLoading}
            >
              Artist
            </button>
          </div>

          {showArtistPrompt && (
            <div className='artist-name-prompt'>
              <p className='artist-name-prompt-label'>Complete your artist profile to continue</p>

              {/* Photo upload — only shown when missing */}
              {!user?.profilePicture && (
                <div className='artist-prompt-photo'>
                  <div
                    className={`artist-prompt-avatar${avatarUploading ? ' user-avatar--uploading' : ''}`}
                    onClick={() => !avatarUploading && avatarInputRef.current?.click()}
                  >
                    {user?.profilePicture
                      ? <img src={user.profilePicture} alt='avatar' />
                      : <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="22" height="22" fill="currentColor"><path d="M149.1 64.8L138.7 96 64 96C28.7 96 0 124.7 0 160L0 416c0 35.3 28.7 64 64 64l384 0c35.3 0 64-28.7 64-64l0-256c0-35.3-28.7-64-64-64l-74.7 0L362.9 64.8C356.4 45.2 338.1 32 317.4 32L194.6 32c-20.7 0-39 13.2-45.5 32.8zM256 192a96 96 0 1 1 0 192 96 96 0 1 1 0-192z"/></svg>
                    }
                    <div className='user-avatar-overlay'>
                      <span>{avatarUploading ? 'Uploading…' : (user?.profilePicture ? 'Change' : 'Upload')}</span>
                    </div>
                  </div>
                  <div>
                    <p className='artist-prompt-photo-label'>
                      Profile photo <span className='add-song-required'>*</span>
                    </p>
                    <p className='artist-prompt-photo-hint'>Required for artist accounts</p>
                  </div>
                </div>
              )}

              {/* Artist name — only shown when missing */}
              {!user?.artistName && (
                <div className='artist-name-prompt-row'>
                  <input
                    className={`artist-name-input${artistNameError && !user?.profilePicture ? '' : artistNameError ? ' input-error' : ''}`}
                    value={artistNameInput}
                    onChange={e => { setArtistNameInput(e.target.value); setArtistNameError('') }}
                    placeholder='Artist name'
                    onKeyDown={e => e.key === 'Enter' && handleArtistNameConfirm()}
                  />
                </div>
              )}

              <div className='artist-name-prompt-row'>
                <button className='btn-confirm-artist' onClick={handleArtistNameConfirm} disabled={toggleLoading || avatarUploading}>
                  {toggleLoading ? 'Saving…' : 'Confirm'}
                </button>
                <button className='btn-cancel-artist' onClick={() => setShowArtistPrompt(false)} disabled={toggleLoading}>
                  Cancel
                </button>
              </div>

              {artistNameError && <p className='artist-name-error'>{artistNameError}</p>}
            </div>
          )}
        </div>
      )}

      {/* ── Edit form ── */}
      <div className='user-card'>
        <h2 className='user-card-title'>Edit Profile</h2>

        <form onSubmit={handleUpdate} className='user-form'>
          {updateError && <p className='user-msg user-msg--error'>{updateError}</p>}
          {updateSuccess && <p className='user-msg user-msg--success'>{updateSuccess}</p>}

          <div className='user-form-grid'>
            <div className='form-field'>
              <label>Name</label>
              <input name='name' value={form.name} onChange={handleChange} placeholder='Your name' required />
            </div>

            {user?.profileType === 'artist' && (
              <div className='form-field'>
                <label>Artist Name</label>
                <input name='artistName' value={form.artistName} onChange={handleChange} placeholder='Your artist name' />
              </div>
            )}

            <div className='form-field full-span'>
              <label>Bio</label>
              <textarea name='bio' value={form.bio} onChange={handleChange} placeholder='Tell us about yourself...' rows={3} />
            </div>
          </div>

          <div className='form-divider'><span>Change Password</span></div>

          <div className='user-form-grid'>
            <div className='form-field'>
              <label>Current Password</label>
              <input type='password' name='currentPassword' value={form.currentPassword} onChange={handleChange} placeholder='Enter current password' />
            </div>
            <div className='form-field'>
              <label>New Password</label>
              <input type='password' name='newPassword' value={form.newPassword} onChange={handleChange} placeholder='Enter new password' />
            </div>
          </div>

          <button type='submit' className='btn-save' disabled={updateLoading}>
            {updateLoading ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>

      {/* ── Logout ── */}
      <div className='user-card logout-card'>
        <h2 className='user-card-title'>Sign Out</h2>
        <p className='logout-desc'>Sign out of your account on this device.</p>
        <button className='btn-logout' onClick={handleLogout}>Log Out</button>
      </div>

      {/* ── Danger zone ── */}
      <div className='user-card danger-zone'>
        <h2 className='user-card-title'>Danger Zone</h2>
        <p className='danger-desc'>
          Permanently delete your account and all associated data. This action cannot be undone.
        </p>

        {!confirmDelete ? (
          <button className='btn-delete' onClick={() => setConfirmDelete(true)}>
            Delete Account
          </button>
        ) : (
          <div className='delete-confirm'>
            <p>Are you sure? This cannot be undone.</p>
            <div className='delete-confirm-actions'>
              <button className='btn-delete' onClick={handleDelete} disabled={deleteLoading}>
                {deleteLoading ? 'Deleting...' : 'Yes, Delete'}
              </button>
              <button className='btn-cancel' onClick={() => setConfirmDelete(false)}>
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

    </div>
  )
}

export default User
