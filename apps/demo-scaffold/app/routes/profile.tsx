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
import { Button, Input, Label, Card, CardContent } from '@open-kingdom/shared-frontend-ui-primitives';

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
    <Card className="max-w-md mx-auto mt-8">
      <CardContent className="p-6">
        <h2 className="text-2xl font-bold mb-4 text-foreground">
          Send Email
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="emailTo" className="mb-1">
              To
            </Label>
            <Input
              id="emailTo"
              type="email"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              placeholder="recipient@example.com"
              required
            />
          </div>
          <div>
            <Label htmlFor="emailSubject" className="mb-1">
              Subject
            </Label>
            <Input
              id="emailSubject"
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Email subject"
              required
            />
          </div>
          <div>
            <Label htmlFor="emailBody" className="mb-1">
              Body
            </Label>
            <textarea
              id="emailBody"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Email body content"
              required
              rows={4}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
          {isSuccess && (
            <p className="text-sm text-success">
              Email sent successfully!
            </p>
          )}
          {isError && (
            <p className="text-sm text-destructive">
              {(error as Error)?.message || 'Failed to send email'}
            </p>
          )}
          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? 'Sending...' : 'Send Email'}
          </Button>
        </form>
      </CardContent>
    </Card>
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
    <Card className="max-w-md mx-auto mt-8">
      <CardContent className="p-6">
        <h1 className="text-2xl font-bold mb-4 text-foreground">
          Login
        </h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="email" className="mb-1">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@gmail.com"
              required
            />
          </div>
          <div>
            <Label htmlFor="password" className="mb-1">
              Password
            </Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="admin"
              required
            />
          </div>
          {error && (
            <p className="text-destructive text-sm">
              Invalid credentials
            </p>
          )}
          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? 'Logging in...' : 'Login'}
          </Button>
        </form>
      </CardContent>
    </Card>
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
      <Card className="max-w-md mx-auto mt-8">
        <CardContent className="p-6">
          <p className="text-muted-foreground">Loading...</p>
        </CardContent>
      </Card>
    );
  }

  if (error || !profile) {
    return (
      <Card className="max-w-md mx-auto mt-8">
        <CardContent className="p-6">
          <p className="text-destructive">
            Error loading profile
          </p>
        </CardContent>
      </Card>
    );
  }

  const fields = [
    { label: 'ID', value: profile?.id },
    { label: 'Email', value: profile?.email },
    { label: 'First Name', value: profile?.firstName || 'N/A' },
    { label: 'Last Name', value: profile?.lastName || 'N/A' },
  ];

  return (
    <Card className="max-w-md mx-auto mt-8">
      <CardContent className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold text-foreground">
            Profile
          </h1>
          <Button variant="destructive" size="sm" onClick={() => dispatch(logout())}>
            Logout
          </Button>
        </div>
        <div className="space-y-3">
          {fields.map(({ label, value }) => (
            <div key={label}>
              <span className="text-sm font-medium text-muted-foreground">
                {label}:
              </span>
              <span className="ml-2 text-foreground">
                {value}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
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
