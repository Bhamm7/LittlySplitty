import { NavLink } from 'react-router-dom';
import {
  Home,
  List,
  Upload,
  Landmark,
  FolderOpen,
  Tag,
  Wand2,
  Receipt,
  BarChart3,
} from 'lucide-react';
import clsx from 'clsx';

const navItems = [
  { to: '/', label: 'Home', icon: Home },
  { to: '/transactions', label: 'Transactions', icon: List },
  { to: '/import', label: 'Import', icon: Upload },
  { to: '/accounts', label: 'Accounts', icon: Landmark },
  { to: '/categories', label: 'Categories', icon: FolderOpen },
  { to: '/tags', label: 'Tags', icon: Tag },
  { to: '/rules', label: 'Rules', icon: Wand2 },
  { to: '/tax', label: 'Tax', icon: Receipt },
  { to: '/stats', label: 'Stats', icon: BarChart3 },
];

export default function Sidebar() {
  return (
    <aside className="w-56 bg-white border-r border-gray-200 flex flex-col min-h-screen">
      <div className="px-5 py-5 border-b border-gray-200">
        <h1 className="text-xl font-bold text-gray-900">LittySplitty</h1>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              )
            }
          >
            <item.icon className="w-5 h-5" />
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
