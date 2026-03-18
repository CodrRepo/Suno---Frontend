import React, { useState } from 'react'
import axios from '../../utils/axios'
import { Navigate, useNavigate } from 'react-router-dom'
import { useUser } from '../../context/UserContext'
import { clearAuthData } from '../../utils/clearAuth'
import './register.css'

const Register = () => {
  const [formData, setFormData] = useState({ name: '', email: '', password: '' })
  const [error, setError] = useState('')
  const { user, setUser, loading } = useUser()
  const navigate = useNavigate()

  if (loading) return null
  if (user) return <Navigate to='/' replace />

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    // Clear any old auth data first
    clearAuthData()

    try {
      const res = await axios.post('/api/auth/register', formData, { withCredentials: true })

      // Store token in localStorage
      if (res.data.token) {
        localStorage.setItem('authToken', res.data.token)
      }

      setUser(res.data.user)
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.')
    }
  }

  return (
    <div className='register'>
      <img className="bg-img" src="/images/download3.jpg" alt="Register" />

      <div className="form-container">
        <img id='logo' src="/images/logo red.png" alt="suno" />
        <h1>Create account</h1>
        <p className="subtitle">Join and start listening today</p>

        <form onSubmit={handleSubmit}>
          <div className='message-container'>
            {error && <p className="error-msg">{error}</p>}
          </div>

          <label htmlFor="name">Name</label>
          <input type="text" id="name" name="name" placeholder='Enter your name' value={formData.name} onChange={handleChange} required />

          <label htmlFor="email">Email</label>
          <input type="email" id="email" name="email" placeholder='Enter your email' value={formData.email} onChange={handleChange} required />

          <label htmlFor="password">Password</label>
          <input type="password" id="password" name="password" placeholder='Enter your password' value={formData.password} onChange={handleChange} required />

          <button type='submit'>Register</button>

          <p className='redirect'>Already have an account? <a href="/login" className="login-link">Login</a></p>
        </form>
      </div>
    </div>
  )
}

export default Register
