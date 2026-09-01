import useGoogleAuthDemo from './use-google-auth-demo';
import { GoogleAuthEmulatorStatus } from '../components/google-auth-demo/google-auth-emulator-status';
import { GoogleAuthLoginPanel } from '../components/google-auth-demo/google-auth-login-panel';
import { GoogleAuthUserProfile } from '../components/google-auth-demo/google-auth-user-profile';
import { GoogleAuthTokenInspector } from '../components/google-auth-demo/google-auth-token-inspector';
import { GoogleAuthApiInspector } from '../components/google-auth-demo/google-auth-api-inspector';
import { Shield, AlertCircle } from 'lucide-react';

export default function GoogleAuthDemo() {
  const {
    status,
    loadingStatus,
    starting,
    stopping,
    resetting,
    oauthResult,
    authenticating,
    apiLogs,
    authError,
    handleStart,
    handleStop,
    handleReset,
    handleSignIn,
    handleLogout,
    handleClearLogs,
  } = useGoogleAuthDemo();

  const isEmulatorRunning = Boolean(status?.running && status?.healthy);
  const isAuthenticated = Boolean(oauthResult?.userProfile);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <Shield className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold text-foreground tracking-tight">
                Google Auth Emulator Demo
              </h1>
              <p className="text-muted-foreground mt-1 text-sm">
                Production-fidelity local Google OAuth 2.0 & OIDC emulation
                powered by Vercel Labs Emulate.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Auth Error Banner */}
      {authError && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-destructive flex items-center gap-3">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <div className="text-sm font-medium">
            <p className="font-bold">OAuth Error Encountered</p>
            <p className="text-xs opacity-90">{authError}</p>
          </div>
        </div>
      )}

      {/* Main Work Area Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Column: Login Panel & Token Inspector */}
        <div className="lg:col-span-2 space-y-6">
          <GoogleAuthLoginPanel
            isEmulatorRunning={isEmulatorRunning}
            authenticating={authenticating}
            isAuthenticated={isAuthenticated}
            onSignIn={handleSignIn}
            onSignOut={handleLogout}
          />

          <GoogleAuthTokenInspector tokens={oauthResult?.tokens || null} />
        </div>

        {/* Right Column: Emulator Status & User Profile */}
        <div className="space-y-6">
          <GoogleAuthEmulatorStatus
            status={status ?? null}
            loading={loadingStatus}
            starting={starting}
            stopping={stopping}
            resetting={resetting}
            onStart={handleStart}
            onStop={handleStop}
            onReset={handleReset}
          />

          <GoogleAuthUserProfile
            userProfile={oauthResult?.userProfile || null}
            onSignOut={handleLogout}
          />
        </div>
      </div>

      {/* Full-width Inspector */}
      <GoogleAuthApiInspector logs={apiLogs} onClearLogs={handleClearLogs} />
    </div>
  );
}
