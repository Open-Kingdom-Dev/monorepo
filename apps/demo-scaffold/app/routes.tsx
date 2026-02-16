import { createBrowserRouter } from 'react-router';
import { AppLayout } from './app-layout';
import AboutComponent from './routes/about';
import { Home } from './routes/home';
import Profile from './routes/profile';
import UserManagement from './routes/user-management';
import AcceptInvitationRoute from './routes/accept-invitation';

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
    ],
  },
]);
