import { useState } from 'react';
import { Key, Copy, Check, Lock, ShieldCheck, Eye, EyeOff } from 'lucide-react';

interface GoogleOAuthTokens {
  access_token: string;
  id_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
  scope: string;
}

interface GoogleAuthTokenInspectorProps {
  tokens: GoogleOAuthTokens | null;
}

export const GoogleAuthTokenInspector: React.FC<
  GoogleAuthTokenInspectorProps
> = ({ tokens }) => {
  const [showTokens, setShowTokens] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  if (!tokens) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-card/50 p-6 text-center space-y-3">
        <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
          <Key className="h-6 w-6" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-foreground">
            Token Payload Inspection
          </h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">
            After Google OAuth sign-in, access, ID, and refresh tokens will be
            displayed here.
          </p>
        </div>
      </div>
    );
  }

  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const maskToken = (token: string) => {
    if (showTokens) return token;
    if (token.length <= 20) return '••••••••••••••••••••';
    return `${token.slice(0, 10)}...${token.slice(-10)}`;
  };

  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-5">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div className="flex items-center gap-2">
          <Lock className="h-5 w-5 text-blue-500" />
          <h2 className="text-lg font-bold text-foreground">
            Issued OAuth Tokens
          </h2>
        </div>
        <button
          onClick={() => setShowTokens(!showTokens)}
          className="flex items-center gap-1.5 rounded-lg border border-input bg-background px-3 py-1 text-xs font-semibold text-foreground shadow-sm hover:bg-accent"
        >
          {showTokens ? (
            <EyeOff className="h-3.5 w-3.5" />
          ) : (
            <Eye className="h-3.5 w-3.5" />
          )}
          {showTokens ? 'Mask Values' : 'Reveal Tokens'}
        </button>
      </div>

      {/* Meta Bar */}
      <div className="grid grid-cols-3 gap-3 text-xs bg-muted/40 p-3 rounded-lg border border-border">
        <div>
          <span className="text-muted-foreground">Token Type:</span>
          <p className="font-semibold text-foreground mt-0.5">
            {tokens.token_type}
          </p>
        </div>
        <div>
          <span className="text-muted-foreground">Expires In:</span>
          <p className="font-semibold text-foreground mt-0.5">
            {tokens.expires_in}s (1 hour)
          </p>
        </div>
        <div>
          <span className="text-muted-foreground">Granted Scope:</span>
          <p className="font-mono text-foreground truncate mt-0.5">
            {tokens.scope}
          </p>
        </div>
      </div>

      {/* Access Token */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-blue-500" />
            Access Token (access_token)
          </label>
          <button
            onClick={() => copyToClipboard(tokens.access_token, 'access_token')}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            {copiedField === 'access_token' ? (
              <Check className="h-3.5 w-3.5 text-emerald-500" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
            {copiedField === 'access_token' ? 'Copied' : 'Copy'}
          </button>
        </div>
        <div className="p-3 rounded-lg bg-slate-950 text-slate-200 font-mono text-xs break-all border border-slate-800">
          {maskToken(tokens.access_token)}
        </div>
      </div>

      {/* ID Token */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
            <Key className="h-3.5 w-3.5 text-purple-500" />
            OIDC ID Token (id_token)
          </label>
          <button
            onClick={() => copyToClipboard(tokens.id_token, 'id_token')}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            {copiedField === 'id_token' ? (
              <Check className="h-3.5 w-3.5 text-emerald-500" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
            {copiedField === 'id_token' ? 'Copied' : 'Copy'}
          </button>
        </div>
        <div className="p-3 rounded-lg bg-slate-950 text-slate-200 font-mono text-xs break-all border border-slate-800">
          {maskToken(tokens.id_token)}
        </div>
      </div>

      {/* Refresh Token if present */}
      {tokens.refresh_token && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
              <Lock className="h-3.5 w-3.5 text-amber-500" />
              Refresh Token (refresh_token)
            </label>
            <button
              onClick={() =>
                copyToClipboard(tokens.refresh_token!, 'refresh_token')
              }
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            >
              {copiedField === 'refresh_token' ? (
                <Check className="h-3.5 w-3.5 text-emerald-500" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
              {copiedField === 'refresh_token' ? 'Copied' : 'Copy'}
            </button>
          </div>
          <div className="p-3 rounded-lg bg-slate-950 text-slate-200 font-mono text-xs break-all border border-slate-800">
            {maskToken(tokens.refresh_token)}
          </div>
        </div>
      )}
    </div>
  );
};
