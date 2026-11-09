"use client";

import * as React from "react";
import { X } from "lucide-react";

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const sizeClasses = {
  sm: "max-w-md",
  md: "max-w-lg",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
};

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  size = "md",
  className = "",
}: ModalProps) {
  React.useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? "modal-title" : undefined}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className={`w-full ${sizeClasses[size]} rounded-2xl border border-slate-200/80 bg-white shadow-xl transition-all ${className}`}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {(title || description) && (
          <div className="flex items-start justify-between border-b border-slate-100 p-5 sm:p-6">
            <div className="space-y-1 pr-6">
              {title && (
                <h2
                  id="modal-title"
                  className="text-lg font-semibold tracking-tight text-slate-900"
                >
                  {title}
                </h2>
              )}
              {description && (
                <p className="text-xs sm:text-sm text-slate-500">
                  {description}
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close dialog"
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        <div className="p-5 sm:p-6">{children}</div>
      </div>
    </div>
  );
}

export function ModalHeader({
  className = "",
  children,
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`border-b border-slate-100 p-5 sm:p-6 ${className}`}
    >
      {children}
    </div>
  );
}

export function ModalTitle({
  className = "",
  children,
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h2
      className={`text-lg font-semibold tracking-tight text-slate-900 ${className}`}
    >
      {children}
    </h2>
  );
}

export function ModalDescription({
  className = "",
  children,
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={`mt-1 text-sm text-slate-500 ${className}`}>
      {children}
    </p>
  );
}

export function ModalBody({
  className = "",
  children,
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={`p-5 sm:p-6 ${className}`}>{children}</div>;
}

export function ModalFooter({
  className = "",
  children,
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`flex items-center justify-end gap-3 border-t border-slate-100 bg-slate-50/50 p-4 sm:p-5 rounded-b-2xl ${className}`}
    >
      {children}
    </div>
  );
}
