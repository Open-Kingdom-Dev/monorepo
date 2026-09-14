import { useState } from 'react';
import {
  UserCheck,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  LogOut,
} from 'lucide-react';

interface GoogleUserProfile {
  sub: string;
  email: string;
  name: string;
  picture: string;
  email_verified: boolean;
  hd?: string;
}

interface GoogleAuthUserProfileProps {
  userProfile: GoogleUserProfile | null;
  onSignOut?: () => void;
}

export const GoogleAuthUserProfile: React.FC<GoogleAuthUserProfileProps> = ({
  userProfile,
  onSignOut,
}) => {
  const [showRawJson, setShowRawJson] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!userProfile) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-card/50 p-6 text-center space-y-3">
        <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
          <UserCheck className="h-6 w-6" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-foreground">
            No Active Google Session
          </h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">
            Complete the Google sign-in flow to inspect decoded OIDC user
            profile details.
          </p>
        </div>
      </div>
    );
  }

  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(userProfile, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-xl border border-emerald-500/30 bg-card p-6 shadow-sm space-y-5">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div className="flex items-center gap-2">
          <UserCheck className="h-5 w-5 text-emerald-500" />
          <h2 className="text-lg font-bold text-foreground">
            Authenticated User Profile
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Authenticated
          </span>
          {onSignOut && (
            <button
              onClick={onSignOut}
              className="p-1 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
              title="Sign Out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* User Info Header */}
      <div className="flex items-center gap-4">
        <img
          src={userProfile.picture}
          alt={userProfile.name}
          className="w-14 h-14 rounded-full border-2 border-emerald-500/30 object-cover shadow-sm bg-muted"
          onError={(e) => {
            // Fallback for avatar image
            (e.target as HTMLImageElement).src =
              'https://lh3.googleusercontent.com/a/default-user';
          }}
        />
        <div className="space-y-1">
          <h3 className="text-base font-bold text-foreground">
            {userProfile.name}
          </h3>
          <p className="text-xs font-mono text-muted-foreground">
            {userProfile.email}
          </p>
          <div className="flex items-center gap-2 pt-0.5">
            {userProfile.email_verified && (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-3 w-3" /> Email Verified
              </span>
            )}
            {userProfile.hd && (
              <span className="text-[11px] bg-muted px-2 py-0.5 rounded font-mono text-muted-foreground">
                Domain: {userProfile.hd}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Structured Details */}
      <div className="grid grid-cols-2 gap-3 text-xs bg-muted/40 p-3 rounded-lg border border-border">
        <div>
          <span className="text-muted-foreground">Subject (sub / ID):</span>
          <p className="font-mono font-medium text-foreground truncate mt-0.5">
            {userProfile.sub}
          </p>
        </div>
        <div>
          <span className="text-muted-foreground">Identity Provider:</span>
          <p className="font-medium text-foreground mt-0.5">
            Google Emulator (accounts.google.com)
          </p>
        </div>
      </div>

      {/* Raw JSON Accordion */}
      <div className="border-t border-border pt-3">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setShowRawJson(!showRawJson)}
            className="flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
          >
            {showRawJson ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
            Raw User Info Payload
          </button>
          {showRawJson && (
            <button
              onClick={handleCopyJson}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              {copied ? (
                <Check className="h-3.5 w-3.5 text-emerald-500" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
              {copied ? 'Copied' : 'Copy JSON'}
            </button>
          )}
        </div>

        {showRawJson && (
          <pre className="mt-3 p-3 rounded-lg bg-slate-950 text-slate-100 text-xs font-mono overflow-x-auto border border-slate-800">
            {JSON.stringify(userProfile, null, 2)}
          </pre>
        )}
      </div>
    </div>
  );
};
