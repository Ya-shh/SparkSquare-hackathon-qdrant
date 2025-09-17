import { toast as sonnerToast, type ToastT } from 'sonner';
import { MouseEvent } from 'react';

type Action = {
  label: string;
  onClick: (event: MouseEvent<HTMLButtonElement, MouseEvent>) => void;
};

type ExternalToast = Omit<ToastT, "id" | "type" | "title" | "jsx" | "delete" | "promise">;

export const toast = {
  success: (message: string, options?: ExternalToast) => {
    return sonnerToast.success(message, options);
  },
  
  error: (message: string, options?: ExternalToast) => {
    return sonnerToast.error(message, options);
  },
  
  info: (message: string, options?: ExternalToast) => {
    return sonnerToast.info(message, options);
  },
  
  warning: (message: string, options?: ExternalToast) => {
    return sonnerToast.warning(message, options);
  },
  
  loading: (message: string, options?: ExternalToast) => {
    return sonnerToast.loading(message, options);
  },
  
  promise: <T>(
    promise: Promise<T>, 
    messages: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((error: unknown) => string);
    }
  ) => {
    return sonnerToast.promise(promise, messages);
  },
  
  dismiss: (toastId?: string) => {
    return sonnerToast.dismiss(toastId);
  },
  
  custom: (
    content: React.ReactNode,
    options?: ExternalToast
  ) => {
    return sonnerToast(content, options);
  }
};

export default toast; 