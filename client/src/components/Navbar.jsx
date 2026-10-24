
import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Menu, X, GraduationCap, LogIn, LogOut, UserCircle2 } from 'lucide-react';
import ThemeToggle from './ThemeToggle';
import { useAuth } from '../context/AuthContext';
import { signOut } from '../lib/authClient';

const navLinks = [
  { label: 'Home', to: '/' },
  { label: 'Browse Students', to: '/students' },
  { label: 'My Requests', to: '/requests' },
];

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, isAuthenticated, isPending, hasProfile, profileLoading } = useAuth();
  const needsProfile = isAuthenticated && !profileLoading && !hasProfile;
  const navigate = useNavigate();

  const linkClass = ({ isActive }) =>
    `rounded-lg px-3 py-2 text-sm font-medium transition ${
      isActive
        ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300'
        : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
    }`;

  async function handleSignOut() {
    await signOut({
      fetchOptions: {
        onSuccess: () => {
          navigate('/', { replace: true });
          setMenuOpen(false);
        },
      },
    });
  }

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/90 backdrop-blur dark:border-gray-800 dark:bg-gray-950/90">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <Link
          to="/"
          className="flex items-center gap-2 text-xl font-bold text-indigo-600 dark:text-indigo-400"
          onClick={() => setMenuOpen(false)}
        >
          <GraduationCap size={28} />
          <span>SkillSwap Campus</span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden items-center gap-2 md:flex">
          {navLinks.map((link) => (
            <NavLink key={link.to} to={link.to} className={linkClass}>
              {link.label}
            </NavLink>
          ))}

          <ThemeToggle />

          {/* Auth buttons / user info */}
          {!isPending && (
            isAuthenticated ? (
              <div className="flex items-center gap-2 border-l border-gray-200 pl-3 dark:border-gray-700">
                <Link
                  id="navbar-profile-link"
                  to="/profile"
                  title={needsProfile ? 'Complete your profile' : 'Edit profile'}
                  className="flex items-center gap-2 rounded-lg px-2 py-1.5 transition hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <UserCircle2 size={20} className="shrink-0 text-indigo-500" />
                  <span className="max-w-[120px] truncate text-sm font-medium text-gray-800 dark:text-gray-200">
                    {user?.name ?? user?.email}
                  </span>
                  {needsProfile && (
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                      Complete profile
                    </span>
                  )}
                </Link>
                <button
                  id="navbar-signout-btn"
                  type="button"
                  onClick={handleSignOut}
                  className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                >
                  <LogOut size={16} />
                  Sign out
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 border-l border-gray-200 pl-3 dark:border-gray-700">
                <NavLink
                  to="/sign-in"
                  className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                >
                  <LogIn size={16} />
                  Sign in
                </NavLink>
                <NavLink
                  to="/sign-up"
                  className="rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-indigo-700"
                >
                  Sign up
                </NavLink>
              </div>
            )
          )}
        </div>

        {/* Mobile controls */}
        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggle />
          <button
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={menuOpen}
            className="rounded-lg p-2 text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800"
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </nav>

      {/* Mobile drawer */}
      {menuOpen && (
        <div className="border-t border-gray-200 px-4 py-3 dark:border-gray-800 md:hidden">
          <div className="mx-auto flex max-w-7xl flex-col gap-2">
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={linkClass}
                onClick={() => setMenuOpen(false)}
              >
                {link.label}
              </NavLink>
            ))}

            <div className="my-1 border-t border-gray-100 dark:border-gray-800" />

            {!isPending && (
              isAuthenticated ? (
                <>
                  <Link
                    to="/profile"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2 rounded-lg px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    <UserCircle2 size={18} className="shrink-0 text-indigo-500" />
                    <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                      {user?.name ?? user?.email}
                    </span>
                    {needsProfile && (
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                        Complete profile
                      </span>
                    )}
                  </Link>
                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                  >
                    <LogOut size={16} />
                    Sign out
                  </button>
                </>
              ) : (
                <>
                  <NavLink
                    to="/sign-in"
                    className={linkClass}
                    onClick={() => setMenuOpen(false)}
                  >
                    Sign in
                  </NavLink>
                  <NavLink
                    to="/sign-up"
                    onClick={() => setMenuOpen(false)}
                    className="rounded-lg bg-indigo-600 px-3 py-2 text-center text-sm font-medium text-white hover:bg-indigo-700"
                  >
                    Sign up
                  </NavLink>
                </>
              )
            )}
          </div>
        </div>
      )}
    </header>
  );
}
