import { toast } from "sonner";

type ToastMessage =
  | string
  | {
      title: string;
      description?: string;
    };

function unpack(message: ToastMessage) {
  if (typeof message === "string") return { title: message, description: undefined };
  return message;
}

export const appToast = {
  success(message: ToastMessage) {
    const { title, description } = unpack(message);
    return toast.success(title, { description });
  },
  error(message: ToastMessage) {
    const { title, description } = unpack(message);
    return toast.error(title, { description });
  },
  info(message: ToastMessage) {
    const { title, description } = unpack(message);
    return toast.info(title, { description });
  },
  warning(message: ToastMessage) {
    const { title, description } = unpack(message);
    return toast.warning(title, { description });
  },
};
