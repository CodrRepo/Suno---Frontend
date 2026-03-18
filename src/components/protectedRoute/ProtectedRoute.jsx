import { Navigate } from 'react-router-dom'
import { useUser } from '../../context/UserContext'
import './protectedRoute.css'

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useUser()

  if (loading) {
    return (
      <div className='protected-route-loader'>
        <span className='loader-ring' />
      </div>
    )
  }

  if (!user) {
    return <Navigate to='/login' replace />
  }

  return children
}

export default ProtectedRoute
