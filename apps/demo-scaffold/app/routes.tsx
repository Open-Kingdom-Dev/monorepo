import { createBrowserRouter } from 'react-router';
import { AppLayout } from './app-layout';
import AboutComponent from './routes/about';
import { Home } from './routes/home';

export const router = createBrowserRouter([
  {
    path: '/',
    Component: AppLayout,
    children: [
      { path: '', Component: Home },
      { path: 'about', Component: AboutComponent },
    ],
  },
]);
