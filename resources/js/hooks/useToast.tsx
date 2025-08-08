import { useSnackbar, VariantType, SnackbarKey } from 'notistack';

export const useToast = () => {
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();

  const success = (message: string, options?: { persist?: boolean }) => {
    return enqueueSnackbar(message, {
      variant: 'success',
      persist: options?.persist || false,
    });
  };

  const error = (message: string, options?: { persist?: boolean }) => {
    return enqueueSnackbar(message, {
      variant: 'error',
      persist: options?.persist || false,
    });
  };

  const warning = (message: string, options?: { persist?: boolean }) => {
    return enqueueSnackbar(message, {
      variant: 'warning',
      persist: options?.persist || false,
    });
  };

  const info = (message: string, options?: { persist?: boolean }) => {
    return enqueueSnackbar(message, {
      variant: 'info',
      persist: options?.persist || false,
    });
  };

  const dismiss = (key?: SnackbarKey) => {
    if (key) {
      closeSnackbar(key);
    } else {
      closeSnackbar();
    }
  };

  return {
    success,
    error,
    warning,
    info,
    dismiss,
  };
};
