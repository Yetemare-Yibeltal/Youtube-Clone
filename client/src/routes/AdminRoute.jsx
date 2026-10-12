import { Navigate, Outlet } from 'react-router-dom'
import useAuth from '../hooks/useAuth'
import Spinner from '../components/common/Spinner'

export default function AdminRoute () {
  const { user, initialized } = useAuth()

  if (!initialized) {
    return (
      <div className='flex min-h-[60vh] items-center justify-center'>
        <Spinner size='lg' />
      </div>
    )
  }

  if (!user || user.role !== 'admin') {
    return <Navigate to='/' replace />
  }

  return <Outlet />
}
