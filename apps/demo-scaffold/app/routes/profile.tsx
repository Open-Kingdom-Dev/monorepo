import { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  useAuthControllerLoginMutation,
  useAuthControllerGetProfileQuery,
  useEmailControllerSendEmailMutation,
  selectIsAuthenticated,
  setToken,
  logout,
} from '@open-kingdom/shared-frontend-data-access-api-client';
import { showSuccessNotification } from '@open-kingdom/shared-frontend-data-access-notifications';

const inputStyles =
  'w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100';
const labelStyles =
  'block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1';
const cardStyles =
  'max-w-md mx-auto mt-8 p-6 bg-white dark:bg-neutral-800 rounded-lg shadow-lg';

function EmailForm() {
  const dispatch = useDispatch();
  const [to, setTo] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [sendEmail, { isLoading, isSuccess, isError, error }] =
    useEmailControllerSendEmailMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await sendEmail({ sendEmailDto: { to, subject, body } }).unwrap();
      dispatch(showSuccessNotification('Email sent successfully'));
      setTo('');
      setSubject('');
      setBody('');
    } catch {
      // Error notification handled by RTK middleware
    }
  };

  return (
    <div className={cardStyles}>
      <h2 className="text-2xl font-bold mb-4 text-neutral-800 dark:text-neutral-200">
        Send Email
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="emailTo" className={labelStyles}>
            To
          </label>
          <input
            id="emailTo"
            type="email"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            placeholder="recipient@example.com"
            required
            className={inputStyles}
          />
        </div>
        <div>
          <label htmlFor="emailSubject" className={labelStyles}>
            Subject
          </label>
          <input
            id="emailSubject"
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Email subject"
            required
            className={inputStyles}
          />
        </div>
        <div>
          <label htmlFor="emailBody" className={labelStyles}>
            Body
          </label>
          <textarea
            id="emailBody"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Email body content"
            required
            rows={4}
            className={inputStyles}
          />
        </div>
        {isSuccess && (
          <p className="text-sm text-success-600 dark:text-success-400">
            Email sent successfully!
          </p>
        )}
        {isError && (
          <p className="text-sm text-error-600 dark:text-error-400">
            {(error as Error)?.message || 'Failed to send email'}
          </p>
        )}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-md transition-colors disabled:opacity-50"
        >
          {isLoading ? 'Sending...' : 'Send Email'}
        </button>
      </form>
    </div>
  );
}

function LoginForm() {
  const dispatch = useDispatch();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [login, { isLoading, error }] = useAuthControllerLoginMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const result = await login({ loginDto: { email, password } }).unwrap();
      if (result.access_token) {
        dispatch(setToken(result.access_token));
      }
    } catch {
      // Error state handled by RTK Query
    }
  };

  return (
    <div className={cardStyles}>
      <h1 className="text-2xl font-bold mb-4 text-neutral-800 dark:text-neutral-200">
        Login
      </h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className={labelStyles}>
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@gmail.com"
            required
            className={inputStyles}
          />
        </div>
        <div>
          <label htmlFor="password" className={labelStyles}>
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="admin"
            required
            className={inputStyles}
          />
        </div>
        {error && (
          <p className="text-error-600 dark:text-error-400 text-sm">
            Invalid credentials
          </p>
        )}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-md transition-colors disabled:opacity-50"
        >
          {isLoading ? 'Logging in...' : 'Login'}
        </button>
      </form>
    </div>
  );
}

function ProfileCard() {
  const dispatch = useDispatch();
  const {
    data: profile,
    isLoading,
    error,
  } = useAuthControllerGetProfileQuery();

  if (isLoading) {
    return (
      <div className={cardStyles}>
        <p className="text-neutral-600 dark:text-neutral-300">Loading...</p>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className={cardStyles}>
        <p className="text-error-600 dark:text-error-400">
          Error loading profile
        </p>
      </div>
    );
  }

  const fields = [
    { label: 'ID', value: profile?.id },
    { label: 'Email', value: profile?.email },
    { label: 'First Name', value: profile?.firstName || 'N/A' },
    { label: 'Last Name', value: profile?.lastName || 'N/A' },
  ];

  return (
    <div className={cardStyles}>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-neutral-800 dark:text-neutral-200">
          Profile
        </h1>
        <button
          onClick={() => dispatch(logout())}
          className="px-4 py-2 bg-error-500 hover:bg-error-600 text-white rounded-md transition-colors text-sm"
        >
          Logout
        </button>
      </div>
      <div className="space-y-3">
        {fields.map(({ label, value }) => (
          <div key={label}>
            <span className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
              {label}:
            </span>
            <span className="ml-2 text-neutral-800 dark:text-neutral-200">
              {value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Profile() {
  const isLoggedIn = useSelector(selectIsAuthenticated);

  return (
    <>
      {isLoggedIn ? <ProfileCard /> : <LoginForm />}
      <EmailForm />
    </>
  );
}
