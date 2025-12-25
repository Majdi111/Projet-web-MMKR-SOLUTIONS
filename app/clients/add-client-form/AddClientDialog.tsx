"use client";

import { useState } from "react";
import { BadgeCheck, Ban, Hash, Loader2, Mail, MapPin, Phone, User, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebaseClient';
import { motion } from "framer-motion";
import { hoverTransition } from "@/lib/motion";

interface AddClientForm {
  name: string;
  cin: string;
  email: string;
  phone: string;
  location: string;
  status: "Active" | "Inactive";
}

interface AddClientDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => Promise<void>; // Refresh clients list
}

export default function AddClientDialog({ 
  isOpen, 
  onClose, 
  onSuccess 
}: AddClientDialogProps) {
  const [formData, setFormData] = useState<AddClientForm>({
    name: '',
    cin: '',
    email: '',
    phone: '',
    location: '',
    status: 'Active'
  });
  const [loading, setLoading] = useState(false);

  const contentVariants = {
    hidden: { opacity: 0, y: 10, scale: 0.99 },
    show: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { duration: 0.25, ease: "easeOut", when: "beforeChildren", staggerChildren: 0.045 },
    },
  } as const

  const itemVariants = {
    hidden: { opacity: 0, y: 8 },
    show: { opacity: 1, y: 0, transition: { duration: 0.22, ease: "easeOut" } },
  } as const

  const sanitizeName = (value: string) =>
    value
      .replace(/\s+/g, " ")
      .replace(/[^a-zA-Z\u00C0-\u024F\u1E00-\u1EFF\s'\-]/g, "")
      .trimStart()

  const sanitizeCin = (value: string) => value.replace(/\D/g, "").slice(0, 12)

  const sanitizeEmail = (value: string) => value.replace(/\s+/g, "").toLowerCase().slice(0, 120)

  const sanitizePhone = (value: string) => {
    const trimmed = value.trimStart()
    const hasPlus = trimmed.startsWith("+")
    const digits = trimmed.replace(/\D/g, "")
    const limitedDigits = digits.slice(0, 15)
    return (hasPlus ? "+" : "") + limitedDigits
  }

  const sanitizeLocation = (value: string) =>
    value
      .replace(/\s+/g, " ")
      .replace(/[^a-zA-Z0-9\u00C0-\u024F\u1E00-\u1EFF\s,.'\-]/g, "")
      .trimStart()
      .slice(0, 80)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target

    setFormData((previous) => {
      if (name === "name") return { ...previous, name: sanitizeName(value).slice(0, 60) }
      if (name === "cin") return { ...previous, cin: sanitizeCin(value) }
      if (name === "email") return { ...previous, email: sanitizeEmail(value) }
      if (name === "phone") return { ...previous, phone: sanitizePhone(value) }
      if (name === "location") return { ...previous, location: sanitizeLocation(value) }
      return { ...previous, [name]: value }
    })
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.cin) return;

    setLoading(true);
    try {
      const clientsRef = collection(db, 'clients');
      await addDoc(clientsRef, {
        ...formData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      
      // Reset form
      setFormData({
        name: '',
        cin: '',
        email: '',
        phone: '',
        location: '',
        status: 'Active'
      });
      
      onClose();
      await onSuccess();
    } catch (error) {
      console.error('Error adding client:', error);
      alert('Failed to add client');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      <DialogContent className="max-w-2xl p-0 overflow-hidden">
        <motion.div variants={contentVariants} initial="hidden" animate="show" className="bg-background">
          <div className="border-b border-border/50 bg-gradient-to-r from-primary/10 via-muted/30 to-background px-6 py-5">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
                  <UserPlus className="h-5 w-5" />
                </span>
                <span className="flex flex-col">
                  <span className="text-base font-semibold tracking-tight">Add Client</span>
                  <span className="text-sm font-normal text-muted-foreground">
                    Quick profile for invoices and orders.
                  </span>
                </span>
              </DialogTitle>
            </DialogHeader>
          </div>

          <div className="px-6 pb-2 pt-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <motion.div variants={itemVariants} className="space-y-2 rounded-xl border border-border/50 bg-muted/10 p-4">
              <Label htmlFor="name">
                Full name <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Client full name"
                  title="Letters, spaces, apostrophes, and hyphens only"
                  autoComplete="name"
                  maxLength={60}
                  className="pl-10"
                  required
                />
              </div>
            </motion.div>

            <motion.div variants={itemVariants} className="space-y-2 rounded-xl border border-border/50 bg-muted/10 p-4">
              <Label htmlFor="cin">
                CIN <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <Hash className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="cin"
                  name="cin"
                  value={formData.cin}
                  onChange={handleInputChange}
                  placeholder="CIN (max 12 digits)"
                  title="Digits only (up to 12)"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={12}
                  className="pl-10"
                  required
                />
              </div>
            </motion.div>

            <motion.div variants={itemVariants} className="space-y-2 rounded-xl border border-border/50 bg-muted/10 p-4">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="Email (optional)"
                  title="Spaces are removed automatically"
                  autoComplete="email"
                  maxLength={120}
                  className="pl-10"
                />
              </div>
            </motion.div>

            <motion.div variants={itemVariants} className="space-y-2 rounded-xl border border-border/50 bg-muted/10 p-4">
              <Label htmlFor="phone">Phone</Label>
              <div className="relative">
                <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="Phone (optional)"
                  title="Digits only, optional leading +"
                  inputMode="tel"
                  pattern="\+?[0-9]{6,15}"
                  maxLength={16}
                  autoComplete="tel"
                  className="pl-10"
                />
              </div>
            </motion.div>

            <motion.div variants={itemVariants} className="space-y-2 sm:col-span-2 rounded-xl border border-border/50 bg-muted/10 p-4">
              <Label htmlFor="location">Location</Label>
              <div className="relative">
                <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="location"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  placeholder="City / Country"
                  title="Letters/numbers and basic punctuation"
                  autoComplete="address-level2"
                  maxLength={80}
                  className="pl-10"
                />
              </div>
            </motion.div>

            <motion.div variants={itemVariants} className="space-y-2 rounded-xl border border-border/50 bg-muted/10 p-4">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) =>
                  setFormData({ ...formData, status: value as "Active" | "Inactive" })
                }
              >
                <div className="relative">
                  {formData.status === "Active" ? (
                    <BadgeCheck className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  ) : (
                    <Ban className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  )}
                  <SelectTrigger id="status" className="pl-10">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                </div>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </motion.div>
            </div>
          </div>

          <DialogFooter className="mt-2 border-t border-border/40 bg-muted/10 px-6 py-4 gap-2">
            <Button variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>

            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              transition={hoverTransition}
            >
              <Button
                onClick={handleSubmit}
                disabled={loading || !formData.name || !formData.cin}
                className="bg-gradient-to-r from-primary to-primary/80 shadow-lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Adding...
                  </>
                ) : (
                  <>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Add client
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
