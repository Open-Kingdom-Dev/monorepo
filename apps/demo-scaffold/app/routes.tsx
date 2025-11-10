import { createBrowserRouter } from 'react-router';
import { AppLayout } from './app-layout';
import AboutComponent from './routes/about';
import { Home } from './routes/home';
import Table from './routes/table';

export const router = createBrowserRouter([
  {
    path: '/',
    Component: AppLayout,
    children: [
      { path: '', Component: Home },
      { path: 'about', Component: AboutComponent },
      { path: 'data-grid', Component: Table },
    ],
  },
]);
