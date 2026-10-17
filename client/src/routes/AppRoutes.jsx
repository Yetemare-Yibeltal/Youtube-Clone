import { Routes, Route } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import AuthLayout from '../layouts/AuthLayout';
import ProtectedRoute from './ProtectedRoute';
import AdminRoute from './AdminRoute';
import HomePage from '../pages/HomePage';
import TrendingPage from '../pages/TrendingPage';
import WatchPage from '../pages/WatchPage';
import ShortsPage from '../pages/ShortsPage';
import ChannelPage from '../pages/ChannelPage';
import CreateChannelPage from '../pages/CreateChannelPage';
import SearchPage from '../pages/SearchPage';
import UploadPage from '../pages/UploadPage';
import HistoryPage from '../pages/HistoryPage';
import LikedVideosPage from '../pages/LikedVideosPage';
import PlaylistsPage from '../pages/PlaylistsPage';
import PlaylistDetailPage from '../pages/PlaylistDetailPage';
import SubscriptionsPage from '../pages/SubscriptionsPage';
import NotificationsPage from '../pages/NotificationsPage';
import StudioDashboardPage from '../pages/StudioDashboardPage';
import SettingsPage from '../pages/SettingsPage';
import AdminDashboardPage from '../pages/AdminDashboardPage';
import LoginPage from '../pages/LoginPage';
import RegisterPage from '../pages/RegisterPage';
import ForgotPasswordPage from '../pages/ForgotPasswordPage';
import ResetPasswordPage from '../pages/ResetPasswordPage';
import VerifyEmailPage from '../pages/VerifyEmailPage';
import NotFoundPage from '../pages/NotFoundPage';

export default function AppRoutes () {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path='/' element={<HomePage />} />
        <Route path='/trending' element={<TrendingPage />} />
        <Route path='/explore' element={<TrendingPage />} />
        <Route path='/shorts' element={<ShortsPage />} />
        <Route path='/watch/:videoId' element={<WatchPage />} />
        <Route path='/channel/:username' element={<ChannelPage />} />
        <Route path='/playlists/:playlistId' element={<PlaylistDetailPage />} />
        <Route path='/search' element={<SearchPage />} />

        <Route element={<ProtectedRoute />}>
          <Route path='/channel/create' element={<CreateChannelPage />} />
          <Route path='/upload' element={<UploadPage />} />
          <Route path='/subscriptions' element={<SubscriptionsPage />} />
          <Route path='/history' element={<HistoryPage />} />
          <Route path='/liked-videos' element={<LikedVideosPage />} />
          <Route path='/playlists' element={<PlaylistsPage />} />
          <Route path='/notifications' element={<NotificationsPage />} />
          <Route path='/studio' element={<StudioDashboardPage />} />
          <Route path='/settings' element={<SettingsPage />} />

          <Route element={<AdminRoute />}>
            <Route path='/admin' element={<AdminDashboardPage />} />
          </Route>
        </Route>
      </Route>

      <Route element={<AuthLayout />}>
        <Route path='/login' element={<LoginPage />} />
        <Route path='/register' element={<RegisterPage />} />
        <Route path='/forgot-password' element={<ForgotPasswordPage />} />
        <Route path='/reset-password' element={<ResetPasswordPage />} />
        <Route path='/verify-email' element={<VerifyEmailPage />} />
      </Route>

      <Route path='*' element={<NotFoundPage />} />
    </Routes>
  );
}
