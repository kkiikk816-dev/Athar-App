import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Clock, BookOpen, Heart, Settings } from 'lucide-react';

export default function BottomNav() {
  const navItems = [
    { path: '/', label: 'الرئيسية', icon: Home },
    { path: '/prayers', label: 'الصلوات', icon: Clock },
    { path: '/library', label: 'المكتبة', icon: BookOpen },
    { path: '/favorites', label: 'المفضلات', icon: Heart },
    { path: '/settings', label: 'الإعدادات', icon: Settings },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] pb-safe z-50">
      <div className="flex justify-around items-center h-16">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${
                  isActive ? 'text-blue-600' : 'text-gray-500 hover:text-gray-900'
                }`
              }
            >
              <Icon size={24} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </NavLink>
          );
        })}
      </div>
    </div>
  );
}
