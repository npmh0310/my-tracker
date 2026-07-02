import { Toaster as SonnerToaster } from "sonner";

export function Toaster() {
  return (
    <SonnerToaster
      closeButton={false}
      duration={5000}
      offset={24}
      position="bottom-left"
      toastOptions={{
        classNames: {
          actionButton: "rounded-3xl",
        },
        style: {
          fontSize: "12px",
          minHeight: "48px",
          padding: "10px 12px",
          width: "280px",
        },
      }}
    />
  );
}
