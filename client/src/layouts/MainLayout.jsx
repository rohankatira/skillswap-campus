
import { Outlet } from 'react-router-dom';

import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import SkillBot from '../components/SkillBot';

export default function MainLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-gray-50 text-gray-900 transition-colors duration-300 dark:bg-gray-950 dark:text-white">
      {/* Navigation bar */}
      <Navbar />

      {/* Current page renders here */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <Footer />

      {/* Floating chatbot */}
      <SkillBot />
    </div>
  );
}
