import React from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import './styles/custom-modal.css';
import './index.css';
import { BrowserRouter as Router } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './redux/store';
import '@mantine/core/styles.css';
import '@mantine/dates/styles.css';
import '@mantine/notifications/styles.css';

import dayjs from 'dayjs';
import 'dayjs/locale/vi';

import AppRoutes from './routes/AppRoutes';
import { MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';

const App: React.FC = () => {
  return (
    <Provider store={store}>
      <MantineProvider>
        <Notifications position="top-right" zIndex={1000} />
        <Router>
          <AppRoutes />
        </Router>
      </MantineProvider>
    </Provider>
  );
};

export default App;
