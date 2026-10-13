import { Outlet } from 'react-router-dom'
import { useSelector } from 'react-redux'
import Header from '../components/layout/Header'
import Sidebar from '../components/layout/Sidebar'
import { selectIsSidebarOpen } from '../features/ui/uiSlice'

export default function MainLayout () {
  const isSidebarOpen = useSelector(selectIsSidebarOpen)

  return (
    <div className='min-h-screen bg-surface-light dark:bg-surface-dark'>
      <Header />
      <Sidebar />
      <main
        className={`min-h-[calc(100vh-56px)] pt-14 transition-all duration-200 ${
          isSidebarOpen ? 'sm:pl-60' : 'sm:pl-20'
        }`}
      >
        <div className='p-4 sm:p-6'>
          <Outlet />
        </div>
      </main>
    </div>
  )
}
