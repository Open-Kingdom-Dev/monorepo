import { createBrowserRouter } from 'react-router';
import { crmRoutes } from '@open-kingdom/crm-frontend-feature-crm';
import { AppLayout } from './app-layout';
import AboutComponent from './routes/about';
import { Home } from './routes/home';
import Profile from './routes/profile';
import UserManagement from './routes/user-management';
import AcceptInvitationRoute from './routes/accept-invitation';
import GcsDemo from './routes/gcs-demo';
import GmailDemo from './routes/gmail-demo';
import YouTubeDemo from './routes/youtube-demo';

export const router = createBrowserRouter([
  {
    path: '/',
    Component: AppLayout,
    children: [
      { path: '', Component: Home },
      { path: 'about', Component: AboutComponent },
      { path: 'profile', Component: Profile },
      { path: 'admin/users', Component: UserManagement },
      { path: 'accept-invitation', Component: AcceptInvitationRoute },
      ...crmRoutes,
      { path: 'gcs-demo', Component: GcsDemo },
      { path: 'gmail-demo', Component: GmailDemo },
      { path: 'youtube-demo', Component: YouTubeDemo },
    ],
  },
]);
