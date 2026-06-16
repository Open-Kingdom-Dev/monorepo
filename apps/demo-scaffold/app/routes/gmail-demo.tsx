/* eslint-disable jsx-a11y/accessible-emoji */
import { useState, useEffect, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import axios from 'axios';
import {
  useTwinControllerGetStatusQuery,
  useTwinControllerStartMutation,
  useEmailControllerSendEmailMutation,
} from '@open-kingdom/shared-frontend-data-access-api-client';
import {
  showSuccessNotification,
  showErrorNotification,
} from '@open-kingdom/shared-frontend-data-access-notifications';
import { TwinStatus } from '../components';

interface InterceptedEmail {
  id: string;
  from: string;
  to: string;
  subject: string;
  text?: string;
  html?: string;
  date?: string;
  headers?: Record<string, string>;
}

interface RTKQueryError {
  data?: {
    message?: string;
  };
  message?: string;
}

export default function GmailDemo() {
  const dispatch = useDispatch();
  const { data: twinStatus, refetch: refetchStatus } =
    useTwinControllerGetStatusQuery(undefined, {
      pollingInterval: 5000,
    });

  const [startTwin, { isLoading: startingTwin }] =
    useTwinControllerStartMutation();
  const [sendEmail, { isLoading: sendingEmail }] =
    useEmailControllerSendEmailMutation();

  const [emails, setEmails] = useState<InterceptedEmail[]>([]);
  const [errorMode, setErrorMode] = useState<string>('none');
  const [loadingEmails, setLoadingEmails] = useState(false);

  // Send Email State
  const [emailTo, setEmailTo] = useState('recipient@openkingdom.dev');
  const [emailSubject, setEmailSubject] = useState(
    'Digital Twin Interception Verification'
  );
  const [emailBody, setEmailBody] = useState(
    'Hello Team, this email is automatically intercepted at the network level by our NodeInterceptor layer!'
  );

  const status = twinStatus;
  const twinRunning = status?.running ?? false;
  const twinHealthy = status?.healthy ?? false;
  const realGmailConfigured = status?.realGmailConfigured ?? false;

  let buttonText = 'Send via Gmail SDK API';
  let buttonColorClass = 'bg-blue-600 hover:bg-blue-700';
  let buttonIcon = '✉️';
  let buttonDisabled = false;

  if (twinRunning) {
    buttonText = 'Send via Gmail Twin Server';
    buttonColorClass = 'bg-green-600 hover:bg-green-700';
    buttonIcon = '🧪';
  } else if (realGmailConfigured) {
    buttonText = 'Send via Production Gmail API';
    buttonColorClass = 'bg-blue-600 hover:bg-blue-700';
    buttonIcon = '🚀';
  } else {
    buttonText = 'Email Service Disabled (No Config / Twin Offline)';
    buttonColorClass = 'bg-gray-400 cursor-not-allowed';
    buttonIcon = '🔒';
    buttonDisabled = true;
  }

  if (sendingEmail) {
    buttonDisabled = true;
  }

  const fetchInterceptedEmails = useCallback(async () => {
    if (!twinRunning) return;
    setLoadingEmails(true);
    try {
      const response = await axios.get('/api/twin/gmail/emails');
      setEmails(response.data);
    } catch (err) {
      console.error('Failed to fetch intercepted emails', err);
    } finally {
      setLoadingEmails(false);
    }
  }, [twinRunning]);

  const handleClearMailbox = async () => {
    if (
      !window.confirm('Clear all intercepted emails inside Gmail Digital Twin?')
    )
      return;
    try {
      await axios.post('/api/twin/gmail/reset');
      dispatch(
        showSuccessNotification('Gmail Twin Mailbox cleared successfully')
      );
      setEmails([]);
    } catch {
      dispatch(showErrorNotification('Failed to clear mailbox'));
    }
  };

  const handleSetErrorMode = async (mode: string) => {
    try {
      await axios.post('/api/twin/gmail/error-mode', { mode });
      setErrorMode(mode);
      dispatch(showSuccessNotification(`Simulated error mode set to: ${mode}`));
    } catch {
      dispatch(showErrorNotification('Failed to set error mode'));
    }
  };

  const handleSendTestEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await sendEmail({
        sendEmailDto: {
          to: emailTo,
          subject: emailSubject,
          body: emailBody,
        },
      }).unwrap();

      if (res.success) {
        dispatch(
          showSuccessNotification(
            `Email sent successfully! Intercepted ID: ${
              res.messageId || 'unknown'
            }`
          )
        );
        // Refresh the inbox view after short timeout
        setTimeout(fetchInterceptedEmails, 600);
      } else {
        dispatch(
          showErrorNotification(
            `Email sending failed: ${res.error || 'Unknown error'}`
          )
        );
      }
    } catch (err) {
      const rtkErr = err as RTKQueryError;
      dispatch(
        showErrorNotification(
          `Execution error: ${
            rtkErr.data?.message || rtkErr.message || 'Unknown error'
          }`
        )
      );
    }
  };

  // Sync error mode from backend on start
  useEffect(() => {
    const fetchStatusOnLoad = async () => {
      if (twinRunning) {
        try {
          const response = await axios.get('/api/twin/status');
          console.debug('Digital Twin status synced:', response.data);
        } catch (e) {
          console.error(e);
        }
      }
    };
    fetchStatusOnLoad();
  }, [twinRunning]);

  useEffect(() => {
    if (twinRunning) {
      fetchInterceptedEmails();
    } else {
      setEmails([]);
    }
  }, [twinRunning, fetchInterceptedEmails]);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-fade-in">
      {/* Alert if not running */}
      {!twinRunning && !status?.realGmailConfigured && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm transition-all duration-300">
          <div className="flex items-start md:items-center gap-3">
            <span
              role="img"
              aria-label="Danger"
              className="text-2xl animate-pulse"
            >
              🚫
            </span>
            <div>
              <p className="font-semibold text-red-900">
                Real Gmail Service Unconfigured
              </p>
              <p className="text-sm text-red-700">
                Outbound emails cannot be sent directly because production
                Google service account credentials are missing in the{' '}
                <code>.env</code> file.
              </p>
              <p className="text-xs text-red-600 mt-1">
                Please click <strong>"Boot Environment"</strong> to run the
                local Digital Twin or provide your credentials in the backend
                environment.
              </p>
            </div>
          </div>
          <button
            onClick={async () => {
              try {
                await startTwin().unwrap();
                dispatch(
                  showSuccessNotification('Gmail Twin booted successfully')
                );
                refetchStatus();
              } catch {
                dispatch(showErrorNotification('Failed to start twin'));
              }
            }}
            disabled={startingTwin}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded font-semibold disabled:opacity-50 transition duration-150 ease-in-out text-sm whitespace-nowrap shadow-sm"
          >
            {startingTwin ? 'Booting...' : 'Boot Environment'}
          </button>
        </div>
      )}

      {!twinRunning && status?.realGmailConfigured && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm transition-all duration-300">
          <div className="flex items-start md:items-center gap-3">
            <span role="img" aria-label="Info" className="text-2xl">
              ℹ️
            </span>
            <div>
              <p className="font-semibold text-blue-900">
                Production Gmail Service Active
              </p>
              <p className="text-sm text-blue-700">
                Outbound email operations are currently live. Emails will be
                sent directly to real recipients.
              </p>
              <p className="text-xs text-blue-600 mt-1">
                You can click <strong>"Boot Environment"</strong> to redirect
                outbound traffic to the local Digital Twin.
              </p>
            </div>
          </div>
          <button
            onClick={async () => {
              try {
                await startTwin().unwrap();
                dispatch(
                  showSuccessNotification('Gmail Twin booted successfully')
                );
                refetchStatus();
              } catch {
                dispatch(showErrorNotification('Failed to start twin'));
              }
            }}
            disabled={startingTwin}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-semibold disabled:opacity-50 transition duration-150 ease-in-out text-sm whitespace-nowrap shadow-sm"
          >
            {startingTwin ? 'Booting...' : 'Boot Environment'}
          </button>
        </div>
      )}

      <div className="border-b pb-4">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
          Gmail Digital Twin Control Console
        </h1>
        <p className="text-gray-500 mt-2 text-sm max-w-3xl">
          Monitor intercepted outbound SMTP operations at the local process
          level, view parsed multipart MIME headers, and run failure injection
          state machines dynamically.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Inbox Intercepted List */}
        <div className="lg:col-span-2 space-y-6">
          <div className="border border-gray-200 rounded-xl bg-white shadow-sm hover:shadow-md transition-shadow duration-200 p-6 space-y-4">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center border-b pb-3 gap-3">
              <div>
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <span>📬 Mock Inbox</span>
                  {twinRunning && (
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                        twinHealthy
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800 animate-pulse'
                      }`}
                    >
                      {twinHealthy ? '● Healthy' : '● Unhealthy'}
                    </span>
                  )}
                  {emails.length > 0 && (
                    <span className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full font-bold">
                      {emails.length} intercepted
                    </span>
                  )}
                </h2>
                <p className="text-xs text-gray-500">
                  Captured in-memory outbound mail listed in LIFO (newest first)
                  order
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={fetchInterceptedEmails}
                  disabled={!twinRunning || loadingEmails}
                  className="px-3.5 py-1.5 text-xs font-semibold bg-gray-150 hover:bg-gray-200 text-gray-700 rounded-lg border border-gray-300 transition-colors disabled:opacity-50"
                >
                  {loadingEmails ? 'Syncing...' : '🔄 Sync Emails'}
                </button>
                <button
                  onClick={handleClearMailbox}
                  disabled={!twinRunning || emails.length === 0}
                  className="px-3.5 py-1.5 text-xs font-semibold bg-red-50 hover:bg-red-100 text-red-700 rounded-lg border border-red-200 transition-colors disabled:opacity-50"
                >
                  🗑️ Clear Inbox
                </button>
              </div>
            </div>

            {emails.length === 0 ? (
              <div className="py-16 text-center text-gray-400 text-sm flex flex-col items-center justify-center space-y-3">
                <div className="text-4xl">✉️</div>
                <p className="text-gray-500 font-medium">
                  No intercepted emails found in the digital twin store
                </p>
                <p className="text-xs text-gray-400 max-w-sm">
                  Use the form on the right or any workspace component to
                  trigger a Google API outbound send to verify real-time
                  interception
                </p>
              </div>
            ) : (
              <div className="space-y-4 max-h-[600px] overflow-y-auto pr-1">
                {emails.map((email) => (
                  <div
                    key={email.id}
                    className="border border-gray-150 rounded-xl p-4 bg-gray-50 hover:bg-blue-50/20 hover:border-blue-300 transition-all duration-200 space-y-2"
                  >
                    <div className="flex justify-between items-center text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <strong>Message ID:</strong>
                        <code className="bg-gray-200 text-gray-800 px-1.5 py-0.5 rounded font-mono select-all">
                          {email.id}
                        </code>
                      </span>
                      <span className="font-medium bg-gray-200 px-2 py-0.5 rounded-full text-[10px]">
                        {email.date
                          ? new Date(email.date).toLocaleString()
                          : 'Just Now'}
                      </span>
                    </div>
                    <div className="text-sm space-y-1">
                      <p className="text-gray-700">
                        <strong>From:</strong>{' '}
                        <span className="font-mono text-xs">{email.from}</span>
                      </p>
                      <p className="text-gray-700">
                        <strong>To:</strong>{' '}
                        <span className="font-mono text-xs">{email.to}</span>
                      </p>
                      <p className="mt-2 font-bold text-gray-900 border-t pt-1.5">
                        Subject: {email.subject}
                      </p>
                    </div>
                    <div className="border-t border-gray-250 pt-2 mt-2">
                      <p className="text-[10px] text-gray-400 font-semibold mb-1 uppercase tracking-wider">
                        MIME Decoded Text Content:
                      </p>
                      <div className="text-xs text-gray-700 bg-white border border-gray-200 p-3 rounded-lg font-mono whitespace-pre-wrap max-h-40 overflow-y-auto shadow-inner">
                        {email.text || '(No Plaintext Body Found)'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Configurations, Twin Controller, and Test Form */}
        <div className="space-y-6">
          <TwinStatus />

          {/* Test Form */}
          <div className="border border-gray-200 rounded-xl bg-white shadow-sm p-6 space-y-4 hover:shadow-md transition-shadow duration-200">
            <h3 className="font-bold text-gray-900 border-b pb-2 text-md flex items-center gap-2">
              <span>✉️ Send Outbound Mail</span>
            </h3>
            <form onSubmit={handleSendTestEmail} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Recipient Email (To)
                </label>
                <input
                  type="email"
                  value={emailTo}
                  onChange={(e) => setEmailTo(e.target.value)}
                  className="w-full mt-1 border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-150 focus:border-blue-500 focus:outline-none transition duration-150"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Subject Line
                </label>
                <input
                  type="text"
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  className="w-full mt-1 border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-150 focus:border-blue-500 focus:outline-none transition duration-150"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Message Body
                </label>
                <textarea
                  rows={3}
                  value={emailBody}
                  onChange={(e) => setEmailBody(e.target.value)}
                  className="w-full mt-1 border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-150 focus:border-blue-500 focus:outline-none font-sans transition duration-150"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={buttonDisabled}
                className={`w-full py-2.5 text-white font-semibold rounded-lg text-sm disabled:opacity-50 transition duration-150 shadow-sm flex items-center justify-center gap-2 ${buttonColorClass}`}
              >
                {sendingEmail ? (
                  <>
                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Sending Outbound...</span>
                  </>
                ) : (
                  <>
                    <span>{buttonIcon}</span>
                    <span>{buttonText}</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Fault Simulation */}
          <div className="border border-gray-200 rounded-xl bg-white shadow-sm p-6 space-y-4 hover:shadow-md transition-shadow duration-200">
            <h3 className="font-bold text-gray-900 border-b pb-2 text-md flex items-center gap-2">
              <span>⚡ Fault Injection Simulation</span>
            </h3>
            <p className="text-xs text-gray-500">
              Inject failure states directly into the mock backend to verify
              robust application error-handling.
            </p>
            <div className="grid grid-cols-2 gap-2.5 text-xs font-semibold">
              <button
                type="button"
                onClick={() => handleSetErrorMode('none')}
                disabled={!twinRunning}
                className={`py-2.5 px-2 rounded-lg transition-all duration-200 border ${
                  errorMode === 'none'
                    ? 'bg-green-50 border-green-500 text-green-800 shadow-sm font-bold'
                    : 'bg-gray-50 border-gray-200 hover:bg-gray-100 hover:border-gray-300'
                }`}
              >
                🟢 Normal Mode
              </button>
              <button
                type="button"
                onClick={() => handleSetErrorMode('bad-request')}
                disabled={!twinRunning}
                className={`py-2.5 px-2 rounded-lg transition-all duration-200 border ${
                  errorMode === 'bad-request'
                    ? 'bg-yellow-50 border-yellow-450 text-yellow-800 shadow-sm font-bold'
                    : 'bg-gray-50 border-gray-200 hover:bg-gray-100 hover:border-gray-300'
                }`}
              >
                🟡 400 Bad Request
              </button>
              <button
                type="button"
                onClick={() => handleSetErrorMode('auth-error')}
                disabled={!twinRunning}
                className={`py-2.5 px-2 rounded-lg transition-all duration-200 border ${
                  errorMode === 'auth-error'
                    ? 'bg-red-50 border-red-405 text-red-800 shadow-sm font-bold'
                    : 'bg-gray-50 border-gray-200 hover:bg-gray-100 hover:border-gray-300'
                }`}
              >
                🔴 403 Forbidden
              </button>
              <button
                type="button"
                onClick={() => handleSetErrorMode('rate-limit')}
                disabled={!twinRunning}
                className={`py-2.5 px-2 rounded-lg transition-all duration-200 border ${
                  errorMode === 'rate-limit'
                    ? 'bg-purple-50 border-purple-400 text-purple-800 shadow-sm font-bold'
                    : 'bg-gray-50 border-gray-200 hover:bg-gray-100 hover:border-gray-300'
                }`}
              >
                🟣 429 Rate Limit
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
