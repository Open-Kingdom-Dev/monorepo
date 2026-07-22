import React from 'react';
import {
  Key,
  ExternalLink,
  ShieldCheck,
  LogOut,
  RefreshCw,
} from 'lucide-react';

interface GoogleAuthLoginPanelProps {
  isEmulatorRunning: boolean;
  authenticating: boolean;
  isAuthenticated: boolean;
  onSignIn: () => void;
  onSignOut: () => void;
}

export const GoogleAuthLoginPanel: React.FC<GoogleAuthLoginPanelProps> = ({
  isEmulatorRunning,
  authenticating,
  isAuthenticated,
  onSignIn,
  onSignOut,
}) => {
  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-6">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div>
          <h2 className="text-lg font-bold text-foreground">
            Google OAuth Flow
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Test authorization code exchange & ID token validation locally
          </p>
        </div>
        <div className="p-2 rounded-lg bg-primary/10 text-primary">
          <Key className="h-5 w-5" />
        </div>
      </div>

      {/* Login Action Card */}
      <div className="p-5 rounded-lg border border-border bg-muted/30 space-y-4">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 mt-0.5">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">
              {isAuthenticated
                ? 'Active Google Session'
                : 'Mock OAuth Authorization'}
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed mt-1">
              {isAuthenticated
                ? 'You are currently authenticated with an emulated Google user session. You can log out to clear the session or sign in again with another test account.'
                : 'Clicking below will redirect your browser to the local emulator consent endpoint (/o/oauth2/v2/auth). The emulator auto-approves and returns an authorization code.'}
            </p>
          </div>
        </div>

        {isAuthenticated ? (
          <div className="flex flex-col sm:flex-row items-center gap-3 pt-1">
            <button
              onClick={onSignOut}
              className="w-full flex items-center justify-center gap-2 rounded-lg bg-destructive/15 text-destructive border border-destructive/30 px-4 py-2.5 text-sm font-bold shadow-sm transition-all hover:bg-destructive/25 active:scale-[0.99]"
            >
              <LogOut className="h-4 w-4" />
              Sign Out (Clear Session)
            </button>
            <button
              onClick={onSignIn}
              disabled={!isEmulatorRunning || authenticating}
              className="w-full flex items-center justify-center gap-2 rounded-lg border border-input bg-background text-foreground hover:bg-accent px-4 py-2.5 text-sm font-semibold shadow-sm transition-all active:scale-[0.99]"
            >
              <RefreshCw className="h-4 w-4" />
              Switch Account
            </button>
          </div>
        ) : (
          <button
            onClick={onSignIn}
            disabled={!isEmulatorRunning || authenticating}
            className="w-full flex items-center justify-center gap-2.5 rounded-lg bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-md transition-all hover:bg-blue-700 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
            {authenticating
              ? 'Initiating OAuth Flow...'
              : 'Sign in with Google (Emulated)'}
            <ExternalLink className="h-4 w-4 ml-1 opacity-70" />
          </button>
        )}

        {!isEmulatorRunning && (
          <p className="text-xs text-amber-600 dark:text-amber-400 font-medium text-center">
            ⚠️ Start the emulator above before initiating Google sign-in.
          </p>
        )}
      </div>

      {/* Config Info */}
      <div className="space-y-2">
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Configured OAuth Parameters
        </h4>
        <div className="rounded-lg border border-border bg-background p-3 text-xs space-y-2 font-mono">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Client ID:</span>
            <span className="text-foreground font-medium">
              example-client-id.apps.googleusercontent.com
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Redirect URI:</span>
            <span className="text-foreground font-medium">
              /api/google-auth-emulate/callback
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Scopes:</span>
            <span className="text-foreground font-medium">
              openid profile email
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Response Type:</span>
            <span className="text-foreground font-medium">code</span>
          </div>
        </div>
      </div>
    </div>
  );
};
