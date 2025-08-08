import '../css/app.css';
import './bootstrap';

import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';
import { SnackbarProvider, closeSnackbar } from 'notistack';
import {
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  XMarkIcon,
} from '@heroicons/react/24/solid';

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

createInertiaApp({
  title: (title) => `${title} - ${appName}`,
  resolve: (name) =>
    resolvePageComponent(
      `./Pages/${name}.tsx`,
      import.meta.glob('./Pages/**/*.tsx')
    ),
  setup({ el, App, props }) {
    const root = createRoot(el);

    root.render(
      <SnackbarProvider
        maxSnack={3}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        autoHideDuration={4000}
        dense={false}
        preventDuplicate
        action={(snackbarKey) => (
          <button
            onClick={() => closeSnackbar(snackbarKey)}
            className="text-white hover:text-gray-200 transition-colors p-1"
            title="Tutup notifikasi"
            aria-label="Tutup notifikasi"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        )}
        iconVariant={{
          success: <CheckCircleIcon className="w-6 h-6" />,
          error: <XCircleIcon className="w-6 h-6" />,
          warning: <ExclamationTriangleIcon className="w-6 h-6" />,
          info: <InformationCircleIcon className="w-6 h-6" />,
        }}
      >
        <App {...props} />
      </SnackbarProvider>
    );
  },
  progress: {
    color: '#4B5563',
  },
});
