import React from "react";

interface ToastProps {
  message: string;
}

export function Toast({ message }: ToastProps): JSX.Element {
  return (
    <div className="toast" role="status" aria-live="polite" aria-atomic="true">
      {message}
    </div>
  );
}
