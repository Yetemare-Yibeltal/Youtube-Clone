import { Routes, Route } from 'react-router-dom'
import MainLayout from '../layouts/MainLayout'
import AuthLayout from '../layouts/AuthLayout'
import ProtectedRoute from './ProtectedRoute'
import HomePage from '../pages/HomePage'
import WatchPage from '../pages/WatchPage'
import ChannelPage from '../pages/ChannelPage'
import CreateChannelPage from '../pages/CreateChannelPage'
import SearchPage from '../pages/SearchPage'
import UploadPage from '../pages/UploadPage'
import HistoryPage from '../pages/HistoryPage'
import LikedVideosPage from '../pages/LikedVideosPage'
import NotificationsPage from '../pages/NotificationsPage'
import LoginPage from '../pages/LoginPage'
import RegisterPage from '../pages/RegisterPage'
import NotFoundPage from '../pages/NotFoundPage'

export default function AppRoutes () {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path='/' element={<HomePage />} />
        <Route path='/explore' element={<HomePage />} />
        <Route path='/watch/:videoId' element={<WatchPage />} />
        <Route path='/channel/:username' element={<ChannelPage />} />
        <Route path='/search' element={<SearchPage />} />

        <Route element={<ProtectedRoute />}>
          <Route path='/channel/create' element={<CreateChannelPage />} />
          <Route path='/upload' element={<UploadPage />} />
          <Route path='/history' element={<HistoryPage />} />
          <Route path='/liked-videos' element={<LikedVideosPage />} />
          <Route path='/notifications' element={<NotificationsPage />} />
        </Route>
      </Route>

      <Route element={<AuthLayout />}>
        <Route path='/login' element={<LoginPage />} />
        <Route path='/register' element={<RegisterPage />} />
      </Route>

      <Route path='*' element={<NotFoundPage />} />
    </Routes>
  )
}
