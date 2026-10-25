import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, X } from "lucide-react";
import { Button } from "./button";

/**
 * Custom confirmation dialog to replace native confirm()
 * More accessible and consistent with app design
 */
export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title = "Confirm Action",
  message = "Are you sure you want to continue?",
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "danger", // "danger" | "warning" | "info"
  isLoading = false,
}) {
  const handleConfirm = () => {
    onConfirm();
  };

  const handleKeyDown = (e) => {
    if (e.key === "Escape") {
      onClose();
    }
  };

  const variantStyles = {
    danger: {
      icon: "text-red-500",
      iconBg: "bg-red-100",
      button: "bg-red-600 hover:bg-red-700 text-white",
    },
    warning: {
      icon: "text-amber-500",
      iconBg: "bg-amber-100",
      button: "bg-amber-600 hover:bg-amber-700 text-white",
    },
    info: {
      icon: "text-blue-500",
      iconBg: "bg-blue-100",
      button: "bg-blue-600 hover:bg-blue-700 text-white",
    },
  };

  const styles = variantStyles[variant] || variantStyles.danger;

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onKeyDown={handleKeyDown}
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-dialog-title"
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50"
            onClick={onClose}
          />

          {/* Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-1 hover:bg-stone-100 rounded-lg transition-colors"
              aria-label="Close dialog"
            >
              <X className="w-5 h-5 text-stone-500" />
            </button>

            {/* Content */}
            <div className="p-6">
              <div className="flex items-start gap-4">
                {/* Icon */}
                <div className={`w-12 h-12 rounded-full ${styles.iconBg} flex items-center justify-center flex-shrink-0`}>
                  <AlertTriangle className={`w-6 h-6 ${styles.icon}`} />
                </div>

                {/* Text */}
                <div className="flex-1 pt-1">
                  <h3
                    id="confirm-dialog-title"
                    className="text-lg font-semibold text-stone-900"
                  >
                    {title}
                  </h3>
                  <p className="mt-2 text-stone-600">{message}</p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 mt-6">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={onClose}
                  disabled={isLoading}
                >
                  {cancelText}
                </Button>
                <Button
                  className={`flex-1 ${styles.button}`}
                  onClick={handleConfirm}
                  disabled={isLoading}
                >
                  {isLoading ? "Processing..." : confirmText}
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

/**
 * Hook to use confirmation dialogs
 * Returns a function that shows the dialog and returns a promise
 */
export function useConfirmDialog() {
  const [dialogState, setDialogState] = React.useState({
    isOpen: false,
    title: "",
    message: "",
    confirmText: "Confirm",
    cancelText: "Cancel",
    variant: "danger",
    resolve: null,
  });

  const confirm = React.useCallback(({
    title = "Confirm Action",
    message = "Are you sure you want to continue?",
    confirmText = "Confirm",
    cancelText = "Cancel",
    variant = "danger",
  } = {}) => {
    return new Promise((resolve) => {
      setDialogState({
        isOpen: true,
        title,
        message,
        confirmText,
        cancelText,
        variant,
        resolve,
      });
    });
  }, []);

  const handleClose = React.useCallback(() => {
    dialogState.resolve?.(false);
    setDialogState((prev) => ({ ...prev, isOpen: false }));
  }, [dialogState.resolve]);

  const handleConfirm = React.useCallback(() => {
    dialogState.resolve?.(true);
    setDialogState((prev) => ({ ...prev, isOpen: false }));
  }, [dialogState.resolve]);

  const ConfirmDialogComponent = React.useMemo(() => (
    <ConfirmDialog
      isOpen={dialogState.isOpen}
      onClose={handleClose}
      onConfirm={handleConfirm}
      title={dialogState.title}
      message={dialogState.message}
      confirmText={dialogState.confirmText}
      cancelText={dialogState.cancelText}
      variant={dialogState.variant}
    />
  ), [dialogState, handleClose, handleConfirm]);

  return { confirm, ConfirmDialogComponent };
}

export default ConfirmDialog;
