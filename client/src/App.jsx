
import { BrowserRouter, Routes, Route } from 'react-router-dom';

import { AuthProvider } from './context/AuthContext';
import MainLayout from './layouts/MainLayout';
import AuthLayout from './layouts/AuthLayout';
import ProtectedRoute from './components/ProtectedRoute';

import Home from './pages/Home';
import BrowseStudents from './pages/BrowseStudents';
import StudentProfile from './pages/StudentProfile';
import MyRequests from './pages/MyRequests';
import EditProfile from './pages/EditProfile';
import SignIn from './pages/SignIn';
import SignUp from './pages/SignUp';
import NotFound from './pages/NotFound';

export default function App() {
  return (
    <BrowserRouter>
      {/* AuthProvider wraps everything so any component can call useAuth() */}
      <AuthProvider>
        <Routes>

          {/* Auth pages — minimal layout (no navbar/footer clutter) */}
          <Route element={<AuthLayout />}>
            <Route path="/sign-in" element={<SignIn />} />
            <Route path="/sign-up" element={<SignUp />} />
          </Route>

          {/* Main app layout with Navbar + Footer */}
          <Route element={<MainLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/students" element={<BrowseStudents />} />
            <Route path="/students/:id" element={<StudentProfile />} />

            {/* Protected — must be signed in */}
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <EditProfile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/requests"
              element={
                <ProtectedRoute>
                  <MyRequests />
                </ProtectedRoute>
              }
            />

            <Route path="*" element={<NotFound />} />
          </Route>

        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
