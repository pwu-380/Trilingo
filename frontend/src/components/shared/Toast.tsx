import { useEffect, useState } from "react";
import "./Toast.css";

export interface ToastData {
  id: number;
  message: string;
  type: "success" | "info" | "error";
}

function ToastItem({ message, type, onDone }: {
  message: string;
  type: "success" | "info" | "error";
  onDone: () => void;
}) {
  const [fadingOut, setFadingOut] = useState(false);

  useEffect(() => {
    const fadeTimer = setTimeout(() => setFadingOut(true), 2700);
    const removeTimer = setTimeout(onDone, 3000);
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(removeTimer);
    };
  }, [onDone]);

  return (
    <div className={`toast ${type}${fadingOut ? " fade-out" : ""}`}>
      {message}
    </div>
  );
}

export default function ToastContainer({
  toasts,
  onRemove,
}: {
  toasts: ToastData[];
  onRemove: (id: number) => void;
}) {
  if (toasts.length === 0) return null;

  return (
    <div className="toast-container">
      {toasts.map((t) => (
        <ToastItem
          key={t.id}
          message={t.message}
          type={t.type}
          onDone={() => onRemove(t.id)}
        />
      ))}
    </div>
  );
}
