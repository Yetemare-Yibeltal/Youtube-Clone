import { useEffect } from 'react'
import { useSelector } from 'react-redux'
import AppRoutes from './routes/AppRoutes'
import useAuth from './hooks/useAuth'
import useSocket from './hooks/useSocket'
import { selectThemeMode } from './features/theme/themeSlice'

export default function App () {
  const themeMode = useSelector(selectThemeMode)
  useAuth()
  useSocket()

  useEffect(() => {
    document.documentElement.classList.toggle('dark', themeMode === 'dark')
  }, [themeMode])

  return <AppRoutes />
}
