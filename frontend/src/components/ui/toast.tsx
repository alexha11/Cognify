"use client";

import {
  useState,
  useEffect,
  createContext,
  useContext,
  ReactNode,
} from "react";
import { X, AlertCircle, CheckCircle, Info, AlertTriangle } from "lucide-react";
import { Button } from "./button";
import { cn } from "@/lib/utils";

type ToastType = "success" | "error" | "warning" | "info";

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = (message: string, type: ToastType = "info") => {
    const id = Math.random().toString(36).substring(7);
    setToasts((prev) => [...prev, { id, message, type }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
}

function ToastContainer({
  toasts,
  onRemove,
}: {
  toasts: Toast[];
  onRemove: (id: string) => void;
}) {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 max-w-sm w-full">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>
  );
}

function ToastItem({
  toast,
  onRemove,
}: {
  toast: Toast;
  onRemove: (id: string) => void;
}) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onRemove(toast.id);
    }, 5000);
    return () => clearTimeout(timer);
  }, [toast.id, onRemove]);

  const styles = {
    success: {
      bg: "bg-[#F0FDF4]",
      border: "border-green-200/60",
      text: "text-green-800",
      icon: <CheckCircle className="w-5 h-5 text-green-600" />,
    },
    error: {
      bg: "bg-destructive/5",
      border: "border-destructive/10",
      text: "text-destructive",
      icon: <AlertCircle className="w-5 h-5 text-destructive" />,
    },
    warning: {
      bg: "bg-[#FFFBEB]",
      border: "border-amber-200/60",
      text: "text-amber-800",
      icon: <AlertTriangle className="w-5 h-5 text-amber-600" />,
    },
    info: {
      bg: "bg-primary/5",
      border: "border-primary/10",
      text: "text-primary",
      icon: <Info className="w-5 h-5 text-primary" />,
    },
  };

  const style = styles[toast.type];

  return (
    <div
      className={`flex items-center gap-4 p-5 rounded-2xl border shadow-2xl shadow-black/5 animate-in slide-in-from-right-8 fade-in duration-500 ${style.bg} ${style.border}`}
      role="alert"
    >
      <div className="shrink-0">{style.icon}</div>
      <p
        className={`flex-1 text-sm font-semibold tracking-tight ${style.text}`}
      >
        {toast.message}
      </p>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => onRemove(toast.id)}
        className={cn(style.text, "opacity-30 hover:opacity-100 h-8 w-8")}
      >
        <X className="w-4 h-4" />
      </Button>
    </div>
  );
}
