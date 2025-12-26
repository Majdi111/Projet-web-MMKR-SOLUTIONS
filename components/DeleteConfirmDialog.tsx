"use client";

import React from "react";
import { Trash2, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { motion } from "framer-motion";
import { hoverTransition } from "@/lib/motion";

// Delete confirmation dialog component
// Shows warning and requires user confirmation before deleting items

interface DeleteConfirmDialogProps {
  isOpen: boolean;
  itemName: string;
  itemType: string;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
}

export default function DeleteConfirmDialog({
  isOpen,
  itemName,
  itemType,
  onConfirm,
  onCancel,
}: DeleteConfirmDialogProps) {
  const [loading, setLoading] = React.useState(false);

  const contentVariants = {
    hidden: { opacity: 0, y: 10, scale: 0.99 },
    show: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { duration: 0.25, ease: "easeOut", when: "beforeChildren", staggerChildren: 0.045 },
    },
  } as const;

  const itemVariants = {
    hidden: { opacity: 0, y: 8 },
    show: { opacity: 1, y: 0, transition: { duration: 0.22, ease: "easeOut" } },
  } as const;

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="max-w-md p-0 overflow-hidden">
        <motion.div
          variants={contentVariants}
          initial="hidden"
          animate="show"
          className="bg-background"
        >
          <div className="border-b border-border/50 bg-gradient-to-r from-destructive/10 via-muted/30 to-background px-6 py-5">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-destructive/15 text-destructive">
                  <AlertCircle className="h-5 w-5" />
                </span>
                <span className="flex flex-col">
                  <span className="text-base font-semibold tracking-tight">Delete {itemType}</span>
                  <span className="text-sm font-normal text-muted-foreground">
                    This action cannot be undone
                  </span>
                </span>
              </DialogTitle>
            </DialogHeader>
          </div>

          <div className="px-6 py-6">
            <motion.div variants={itemVariants} className="space-y-4">
              <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4">
                <p className="text-sm text-foreground">
                  Are you sure you want to delete{" "}
                  <span className="font-semibold text-destructive">"{itemName}"</span>?
                </p>
              </div>
              <p className="text-xs text-muted-foreground">
                This {itemType.toLowerCase()} will be permanently removed and cannot be recovered.
              </p>
            </motion.div>
          </div>

          <DialogFooter className="border-t border-border/40 bg-muted/10 px-6 py-4 gap-2">
            <Button
              variant="outline"
              onClick={onCancel}
              disabled={loading}
              className="hover:scale-[1.02] transition-transform duration-300"
            >
              Cancel
            </Button>

            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              transition={hoverTransition}
            >
              <Button
                onClick={handleConfirm}
                disabled={loading}
                className="bg-gradient-to-r from-destructive to-destructive/80 hover:shadow-lg shadow-md"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete {itemType}
                  </>
                )}
              </Button>
            </motion.div>
          </DialogFooter>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}
