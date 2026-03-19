import React, { useRef, useState } from 'react'
import axios from '../../utils/axios';  // adjust path as needed
import './login.css'
import { Navigate, useNavigate } from 'react-router-dom'
import { useUser } from '../../context/UserContext'
import { clearAuthData } from '../../utils/clearAuth'

const Login = () => {
  const emailRef = useRef()
  const passwordRef = useRef()
  const [error, setError] = useState('')
  const { user, setUser, loading } = useUser()
  const navigate = useNavigate()

  if (loading) return null
  if (user) return <Navigate to='/' replace />

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    // Clear any old auth data first
    clearAuthData()

    try {
      const res = await axios.post(
        '/api/auth/login',
        { email: emailRef.current.value, password: passwordRef.current.value },
        { withCredentials: true }
      )

      // Store token in localStorage
      if (res.data.token) {
        localStorage.setItem('authToken', res.data.token)
      }

      setUser(res.data.user)
      navigate('/')
    } catch (err) {
      console.log('Login error:', err.response?.data?.message)
      setError(err.response?.data?.message || 'Login failed. Please try again.')
    }
  }

  return (
    <div className='login'>
      <img className="bg-img" src="/images/download3.jpg" alt="Login" />

      <div className="form-container">
        <img id='logo' src="/images/logo red.png" alt="suno" />
        <h1>Welcome back</h1>
        <p className="subtitle">Sign in to continue listening</p>

        <form onSubmit={handleSubmit}>
          <div className='message-container'>
            {error && <p className="error-msg">{error}</p>}
          </div>

          <label htmlFor="email">Email</label>
          <input type="email" id="email" ref={emailRef} placeholder='Enter your email' required />

          <label htmlFor="password">Password</label>
          <input type="password" id="password" ref={passwordRef} placeholder='Enter your password' required />

          <button type='submit'>Login</button>

          <p className='redirect'>Don't have an account? <a href="/register" className="register-link">Register</a></p>
        </form>
      </div>
    </div>
  )
}

export default Login
