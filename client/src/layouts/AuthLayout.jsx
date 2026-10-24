
import { Outlet } from 'react-router-dom';
import Navbar from '../components/Navbar';

/**
 * AuthLayout — a stripped-down layout used by /sign-in and /sign-up.
 *
 * Renders only the Navbar (for branding/navigation) and the page content.
 * No Footer or SkillBot chatbot to keep auth pages clean and focused.
 */
export default function AuthLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-gray-50 text-gray-900 transition-colors duration-300 dark:bg-gray-950 dark:text-white">
      {/* Keep the Navbar so users can navigate back */}
      <Navbar />

      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}
