import { Navigate, Outlet, useLocation } from 'react-router-dom'
import useAuth from '../hooks/useAuth'
import Spinner from '../components/common/Spinner'

export default function ProtectedRoute () {
  const { isAuthenticated, initialized } = useAuth()
  const location = useLocation()

  if (!initialized) {
    return (
      <div className='flex min-h-[60vh] items-center justify-center'>
        <Spinner size='lg' />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to='/login' replace state={{ from: location }} />
  }

  return <Outlet />
}
