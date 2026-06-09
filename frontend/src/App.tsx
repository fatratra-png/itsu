import { useState } from 'react';
import Sidebar from './components/layout/Sidebar';

export default function App() {
  const [activeItem, setActiveItem] = useState('profile');

  return (
    <div className="flex min-h-screen bg-[#f1f5f9]">
      <Sidebar activeItem={activeItem} onNavigate={setActiveItem} />
      <main className="flex-1 lg:ml-72" />
    </div>
  );
}
