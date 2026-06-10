import { motion } from 'framer-motion';
import {
  User, Smile, MessageCircle, Bell, Palette, Settings,
} from 'lucide-react';
import NavItem from './NavItem';
import ITSU_LOGO from '../../assets/logo.png';

interface SidebarProps {
  activeItem?: string;
  onNavigate?: (item: string) => void;
}

const NAV_ITEMS = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'mood', label: 'Mood', icon: Smile },
  { id: 'chat', label: 'Chat', icon: MessageCircle },
  { id: 'spam', label: 'Spam', icon: Bell },
  { id: 'drawdate', label: 'DrawDate', icon: Palette },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export default function Sidebar({ activeItem = 'profile', onNavigate }: SidebarProps) {
  return (
    <aside className="hidden lg:flex h-screen w-72 flex-col shrink-0 fixed left-0 top-0">
      <div
        className="flex flex-col h-full mx-3 my-3 rounded-2xl shadow-[0_0_40px_rgba(0,0,0,0.15)] overflow-hidden"
        style={{
          background: 'linear-gradient(180deg, #d1101b 0%, #b82848 50%, #9a2a52 100%)',
        }}
      >
        <div className="px-6 pt-8 pb-7">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3"
          >
            <img
              src={ITSU_LOGO}
              alt="Itsu"
              className="h-9 w-auto object-contain"
            />
            <h1 className="font-fredoka text-3xl text-white font-bold tracking-tight">
              Itsu
            </h1>
          </motion.div>
        </div>

        <nav className="flex-1 overflow-y-auto sidebar-scroll px-2 pb-4 space-y-0.5">
          {NAV_ITEMS.map((item) => (
            <NavItem
              key={item.id}
              icon={item.icon}
              label={item.label}
              isActive={activeItem === item.id}
              onClick={() => onNavigate?.(item.id)}
            />
          ))}
        </nav>
      </div>
    </aside>
  );
}
