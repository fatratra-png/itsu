import { motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';

interface NavItemProps {
  icon: LucideIcon;
  label: string;
  isActive?: boolean;
  onClick?: () => void;
}

export default function NavItem({ icon: Icon, label, isActive, onClick }: NavItemProps) {
  return (
    <motion.button
      onClick={onClick}
      className={`
        relative flex items-center gap-3 w-full px-4 py-3 rounded-xl cursor-pointer
        font-nunito text-sm text-left
        transition-colors duration-200 select-none
        ${isActive ? 'text-white font-bold text-base' : 'text-white/45 hover:text-white/75 font-medium text-sm'}
      `}
      whileHover={!isActive ? { x: 2 } : undefined}
      whileTap={{ scale: 0.97 }}
    >
      {isActive && (
        <motion.div
          layoutId="nav-active-bg"
          className="absolute inset-0 rounded-xl bg-white/10"
          transition={{ type: 'spring', stiffness: 350, damping: 30 }}
        />
      )}

      <div className="relative z-10 flex items-center justify-center w-6 h-6 shrink-0">
        <Icon
          size={isActive ? 22 : 20}
          strokeWidth={isActive ? 2.5 : 1.5}
          className="transition-all duration-200"
          color="#ffffff"
        />
      </div>
      <span className="relative z-10 truncate">{label}</span>
    </motion.button>
  );
}
