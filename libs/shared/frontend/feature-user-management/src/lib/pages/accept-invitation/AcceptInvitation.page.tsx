import { useState } from 'react';
import { useMountEffect } from '@react-hookz/web';
import { styles } from '../../styles';
import { AcceptInvitationForm } from './components';
import type { BaseApi } from '../../types';

export interface AcceptInvitationPageProps {
  api: BaseApi;
  token?: string;
  onSuccess?: () => void;
  onNotify?: (type: 'success' | 'error', message: string) => void;
  onNavigate?: (url: string) => void;
  loginUrl?: string;
}

export function AcceptInvitationPage({
  token: propToken,
  ...props
}: AcceptInvitationPageProps) {
  const [token, setToken] = useState<string | null>(propToken ?? null);

  useMountEffect(() => {
    if (propToken !== undefined) return;
    const params = new URLSearchParams(window.location.search);
    const urlToken = params.get('token');
    setToken(urlToken ?? '');
  });

  if (token === null) {
    return <p className={styles.loading}>Loading...</p>;
  }

  if (!token) {
    return (
      <p className={`${styles.message} ${styles.warning}`}>
        No invitation token provided. Please use the link from your invitation
        email.
      </p>
    );
  }

  return <AcceptInvitationForm token={token} {...props} />;
}
