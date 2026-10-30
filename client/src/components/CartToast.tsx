import { useEffect } from "react";
import { createPortal } from "react-dom";
import './CartToat.css'

type CartToastProps = {
  message: string;
  kind: "success" | "error";
  onClose: () => void;
  duration?: number;
};

export default function CartToast({
  message,
  kind,
  onClose,
  duration = 2000,
}: CartToastProps) {
  useEffect(() => {
    const timer = window.setTimeout(onClose, duration);
    return () => window.clearTimeout(timer);
  }, [message, duration, onClose]);

  return createPortal(
    <div
      className="cart-toast"
      role={kind === "error" ? "alert" : "status"}
    >
      <span className={`cart-toast-icon ${kind}`}>
        {kind === "success" ? "✓" : "!"}
      </span>
      <p>{message}</p>
    </div>,
    document.body,
  );
}