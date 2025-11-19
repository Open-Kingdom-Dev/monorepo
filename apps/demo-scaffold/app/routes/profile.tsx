import { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  useAuthControllerLoginMutation,
  useAuthControllerGetProfileQuery,
  selectIsAuthenticated,
  setToken,
  logout,
} from '@open-kingdom/shared-frontend-data-access-api-client';

const Profile = () => {
  const dispatch = useDispatch();
  const isLoggedIn = useSelector(selectIsAuthenticated);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [login, { isLoading: isLoggingIn, error: loginError }] =
    useAuthControllerLoginMutation();
  const {
    data: profile,
    isLoading: isLoadingProfile,
    error: profileError,
  } = useAuthControllerGetProfileQuery(undefined, {
    skip: !isLoggedIn,
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const result = await login({
        loginDto: { email, password },
      }).unwrap();
      if (result.access_token) {
        dispatch(setToken(result.access_token));
      }
    } catch {
      // Error handled by loginError
    }
  };

  const handleLogout = () => {
    dispatch(logout());
  };

  if (!isLoggedIn) {
    return (
      <div className="max-w-md mx-auto mt-8 p-6 bg-white dark:bg-neutral-800 rounded-lg shadow-lg">
        <h1 className="text-2xl font-bold mb-4 text-neutral-800 dark:text-neutral-200">
          Login
        </h1>
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@gmail.com"
              required
              className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100"
            />
          </div>
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="admin"
              className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100"
            />
          </div>
          {loginError && (
            <div className="text-error-600 dark:text-error-400 text-sm">
              Invalid credentials
            </div>
          )}
          <button
            type="submit"
            disabled={isLoggingIn}
            className="w-full px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-md transition-colors disabled:opacity-50"
          >
            {isLoggingIn ? 'Logging in...' : 'Login'}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto mt-8 p-6 bg-white dark:bg-neutral-800 rounded-lg shadow-lg">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-neutral-800 dark:text-neutral-200">
          Profile
        </h1>
        <button
          onClick={handleLogout}
          className="px-4 py-2 bg-error-500 hover:bg-error-600 text-white rounded-md transition-colors text-sm"
        >
          Logout
        </button>
      </div>
      {isLoadingProfile ? (
        <p className="text-neutral-600 dark:text-neutral-300">Loading...</p>
      ) : profileError ? (
        <p className="text-error-600 dark:text-error-400">
          Error loading profile
        </p>
      ) : profile ? (
        <div className="space-y-3">
          <div>
            <span className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
              ID:
            </span>
            <span className="ml-2 text-neutral-800 dark:text-neutral-200">
              {profile.id}
            </span>
          </div>
          <div>
            <span className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
              Email:
            </span>
            <span className="ml-2 text-neutral-800 dark:text-neutral-200">
              {profile.email}
            </span>
          </div>
          <div>
            <span className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
              First Name:
            </span>
            <span className="ml-2 text-neutral-800 dark:text-neutral-200">
              {profile.firstName || 'N/A'}
            </span>
          </div>
          <div>
            <span className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
              Last Name:
            </span>
            <span className="ml-2 text-neutral-800 dark:text-neutral-200">
              {profile.lastName || 'N/A'}
            </span>
          </div>
          <div>
            <span className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
              Role:
            </span>
            <span className="ml-2 text-neutral-800 dark:text-neutral-200">
              {profile.role}
            </span>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default Profile;
