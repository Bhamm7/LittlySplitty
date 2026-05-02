import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar.js';

export default function AppLayout() {
  const { pathname } = useLocation();
  const contentWidthClass = pathname === '/stats' ? 'max-w-[1600px]' : 'max-w-7xl';

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <div className={`${contentWidthClass} mx-auto px-6 py-6`}>
          <Outlet />
        </div>
      </main>
    </div>
  );
}
