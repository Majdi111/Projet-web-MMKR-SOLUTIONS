'use client';

import { useState, useSyncExternalStore } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Save, Download, ArrowLeft, Plus, Trash2, User, Mail, MapPin, Phone, Calendar, FileText, CheckCircle, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useRouter } from 'next/navigation';
import { hoverCard, hoverTransition } from '@/lib/motion';
import { generateInvoicePDF } from '@/app/utils/generateInvoice';

interface InvoiceItem {
  description: string;
  quantity: number;
  price: number;
}

interface InvoiceFormData {
  client: string;
  clientEmail: string;
  clientAddress: string;
  clientPhone: string;
  issueDate: string;
  dueDate: string;
  status: 'Paid' | 'Pending' | 'Overdue';
  notes: string;
  items: InvoiceItem[];
}

type CompanyProfile = {
  name?: string;
  email?: string;
  phoneNumbers?: string[];
  addresses?: string[];
};

const TAX_RATE = 0.0752; // 7.52%
const COMPANY_PROFILE_KEY = 'companyProfile';

function readCompanyProfileFromStorage(): CompanyProfile | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(COMPANY_PROFILE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== 'object') return null;
    return parsed as CompanyProfile;
  } catch {
    return null;
  }
}

function subscribeToCompanyProfile(onStoreChange: () => void) {
  if (typeof window === 'undefined') return () => {};

  const handler = () => onStoreChange();
  window.addEventListener('storage', handler);
  window.addEventListener('focus', handler);
  document.addEventListener('visibilitychange', handler);

  return () => {
    window.removeEventListener('storage', handler);
    window.removeEventListener('focus', handler);
    document.removeEventListener('visibilitychange', handler);
  };
}

export default function FormPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const companyProfile = useSyncExternalStore(
    subscribeToCompanyProfile,
    readCompanyProfileFromStorage,
    () => null
  );

  const [formData, setFormData] = useState<InvoiceFormData>({
    client: '',
    clientEmail: '',
    clientAddress: '',
    clientPhone: '',
    issueDate: new Date().toISOString().split('T')[0],
    dueDate: '',
    status: 'Pending',
    notes: '',
    items: [
      { description: '', quantity: 1, price: 0 }
    ]
  });

  const handleItemChange = (index: number, field: keyof InvoiceItem, value: string | number) => {
    const newItems = [...formData.items];
    newItems[index] = { ...newItems[index], [field]: value };
    setFormData({ ...formData, items: newItems });
  };

  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { description: '', quantity: 1, price: 0 }]
    });
  };

  const removeItem = (index: number) => {
    if (formData.items.length > 1) {
      const newItems = formData.items.filter((_, i) => i !== index);
      setFormData({ ...formData, items: newItems });
    }
  };

  const calculateSubtotal = () => {
    return formData.items.reduce((sum, item) => {
      return sum + (item.quantity * item.price);
    }, 0);
  };

  const calculateTax = () => {
    return calculateSubtotal() * TAX_RATE;
  };

  const calculateTotal = () => {
    return calculateSubtotal() + calculateTax();
  };

  const isFormValid = () => {
    return (
      formData.client.trim() !== '' &&
      formData.dueDate !== '' &&
      formData.items.every(item => item.description.trim() !== '' && item.quantity > 0 && item.price >= 0)
    );
  };

  const handleSave = async () => {
    if (!isFormValid()) return;
    
    setIsSubmitting(true);
    console.log('Saving invoice:', formData);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsSubmitting(false);
    alert('Invoice saved successfully!');
    router.push('/invoices');
  };

  const handleDownload = async () => {
    if (!isFormValid()) return;

    const subtotal = calculateSubtotal();
    const taxAmount = calculateTax();
    const totalAmount = calculateTotal();

    await generateInvoicePDF(
      {
        invoiceNumber: `INV-${Date.now()}`,
        issueDate: formData.issueDate ? new Date(formData.issueDate) : new Date(),
        dueDate: formData.dueDate ? new Date(formData.dueDate) : undefined,
        status: formData.status,
        client: {
          name: formData.client,
          email: formData.clientEmail || undefined,
          phone: formData.clientPhone || undefined,
          location: formData.clientAddress || undefined,
        },
        items: formData.items.map((item) => ({
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.price,
          totalPrice: item.quantity * item.price,
        })),
        subtotal,
        taxAmount,
        totalAmount,
        notes: undefined,
      },
      {
        company: {
          name: companyProfile?.name,
          email: companyProfile?.email,
          phoneNumbers: companyProfile?.phoneNumbers,
          addresses: companyProfile?.addresses,
        },
      }
    );
  };

  return (
    <div className="p-8 max-w-[1600px] mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
        className="mb-8"
      >
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <motion.div
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.push('/invoices')}
                className="hover:bg-muted"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </motion.div>
            <div>
              <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                Create Invoice
              </h1>
              <p className="text-muted-foreground">Fill in the details to generate a new invoice</p>
            </div>
          </div>

          <div className="flex flex-col items-start sm:items-end gap-3">
            {(companyProfile?.name || companyProfile?.email || (companyProfile?.phoneNumbers?.length ?? 0) > 0 || (companyProfile?.addresses?.length ?? 0) > 0) && (
              <div className="text-right text-sm" dir="ltr">
                <div className="font-semibold text-foreground">{companyProfile?.name}</div>
                {companyProfile?.email && <div className="text-muted-foreground">{companyProfile.email}</div>}
                {(companyProfile?.phoneNumbers?.length ?? 0) > 0 && (
                  <div className="text-muted-foreground">{companyProfile?.phoneNumbers?.filter(Boolean).join(' / ')}</div>
                )}
                {(companyProfile?.addresses?.length ?? 0) > 0 && (
                  <div className="text-muted-foreground">{companyProfile?.addresses?.filter(Boolean).join(' · ')}</div>
                )}
              </div>
            )}

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={handleDownload}
                disabled={!isFormValid()}
                className="flex items-center gap-2 hover:scale-[1.02] transition-transform duration-300 ease-out"
              >
                <Download className="h-4 w-4" />
                Download PDF
              </Button>
              <Button
                onClick={handleSave}
                disabled={isSubmitting || !isFormValid()}
                className="flex items-center gap-2 bg-gradient-to-r from-primary to-primary/80 hover:scale-[1.02] transition-transform duration-300 ease-out shadow-lg disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                {isSubmitting ? 'Saving...' : 'Save Invoice'}
              </Button>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Client Information */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1, ease: [0.25, 0.1, 0.25, 1] }}
            whileHover={{ ...hoverCard, transition: hoverTransition }}
          >
            <Card className="transition-shadow duration-300 ease-out hover:shadow-2xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5 text-primary" />
                  Client Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="client" className="flex items-center gap-2 text-sm">
                      <User className="h-3.5 w-3.5 text-muted-foreground" />
                      Client Name *
                    </Label>
                    <Input
                      id="client"
                      placeholder="Enter client name"
                      value={formData.client}
                      onChange={(e) => setFormData({ ...formData, client: e.target.value })}
                      className="border-black dark:border-white focus:border-primary dark:focus:border-primary"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="clientEmail" className="flex items-center gap-2 text-sm">
                      <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                      Email
                    </Label>
                    <Input
                      id="clientEmail"
                      type="email"
                      placeholder="client@example.com"
                      value={formData.clientEmail}
                      onChange={(e) => setFormData({ ...formData, clientEmail: e.target.value })}
                      className="border-black dark:border-white focus:border-primary dark:focus:border-primary"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="clientPhone" className="flex items-center gap-2 text-sm">
                      <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                      Phone
                    </Label>
                    <Input
                      id="clientPhone"
                      type="tel"
                      placeholder="+1 (555) 000-0000"
                      value={formData.clientPhone}
                      onChange={(e) => setFormData({ ...formData, clientPhone: e.target.value })}
                      className="border-black dark:border-white focus:border-primary dark:focus:border-primary"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="clientAddress" className="flex items-center gap-2 text-sm">
                      <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                      Address
                    </Label>
                    <Input
                      id="clientAddress"
                      placeholder="Client address"
                      value={formData.clientAddress}
                      onChange={(e) => setFormData({ ...formData, clientAddress: e.target.value })}
                      className="border-black dark:border-white focus:border-primary dark:focus:border-primary"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Invoice Details */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15, ease: [0.25, 0.1, 0.25, 1] }}
            whileHover={{ ...hoverCard, transition: hoverTransition }}
          >
            <Card className="transition-shadow duration-300 ease-out hover:shadow-2xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  Invoice Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="issueDate" className="flex items-center gap-2 text-sm">
                      <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                      Issue Date
                    </Label>
                    <Input
                      id="issueDate"
                      type="date"
                      value={formData.issueDate}
                      onChange={(e) => setFormData({ ...formData, issueDate: e.target.value })}
                      className="border-black dark:border-white focus:border-primary dark:focus:border-primary"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="dueDate" className="flex items-center gap-2 text-sm">
                      <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                      Due Date *
                    </Label>
                    <Input
                      id="dueDate"
                      type="date"
                      value={formData.dueDate}
                      onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                      min={formData.issueDate}
                      className="border-black dark:border-white focus:border-primary dark:focus:border-primary"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="status" className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-3.5 w-3.5 text-muted-foreground" />
                      Status
                    </Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value) => setFormData({ ...formData, status: value as InvoiceFormData["status"] })}
                    >
                      <SelectTrigger id="status">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Pending">Pending</SelectItem>
                        <SelectItem value="Paid">Paid</SelectItem>
                        <SelectItem value="Overdue">Overdue</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Items Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
            whileHover={{ ...hoverCard, transition: hoverTransition }}
          >
            <Card className="transition-shadow duration-300 ease-out hover:shadow-2xl">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5 text-primary" />
                    Item List
                  </CardTitle>
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button
                      onClick={addItem}
                      size="sm"
                      className="bg-gradient-to-r from-primary to-primary/80 hover:scale-[1.02] transition-transform duration-300 ease-out shadow-md"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add Item
                    </Button>
                  </motion.div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <AnimatePresence mode="popLayout">
                  {formData.items.map((item, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, scale: 0.95, height: 0 }}
                      animate={{ opacity: 1, scale: 1, height: 'auto' }}
                      exit={{ opacity: 0, scale: 0.95, height: 0 }}
                      transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
                      className="space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <motion.div 
                            className="h-9 w-9 rounded-lg bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center"
                            whileHover={{ rotate: 360, transition: { duration: 0.5 } }}
                          >
                            <span className="text-sm font-bold text-primary">{index + 1}</span>
                          </motion.div>
                          <span className="text-sm font-semibold">Item #{index + 1}</span>
                        </div>
                        {formData.items.length > 1 && (
                          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeItem(index)}
                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              Remove
                            </Button>
                          </motion.div>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                        <div className="md:col-span-6 space-y-2">
                          <Label htmlFor={`description-${index}`} className="text-sm">Description *</Label>
                          <Input
                            id={`description-${index}`}
                            placeholder="Item description"
                            value={item.description}
                            onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                            className="border-black dark:border-white focus:border-primary dark:focus:border-primary"
                          />
                        </div>

                        <div className="md:col-span-2 space-y-2">
                          <Label htmlFor={`quantity-${index}`} className="text-sm">Quantity</Label>
                          <Input
                            id={`quantity-${index}`}
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => handleItemChange(index, 'quantity', parseFloat(e.target.value) || 1)}
                            className="border-black dark:border-white focus:border-primary dark:focus:border-primary"
                          />
                        </div>

                        <div className="md:col-span-2 space-y-2">
                          <Label htmlFor={`price-${index}`} className="text-sm">Price</Label>
                          <Input
                            id={`price-${index}`}
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.price}
                            onChange={(e) => handleItemChange(index, 'price', parseFloat(e.target.value) || 0)}
                            className="border-black dark:border-white focus:border-primary dark:focus:border-primary"
                          />
                        </div>

                        <div className="md:col-span-2 space-y-2">
                          <Label className="text-sm">Total</Label>
                          <div className="h-10 flex items-center px-3 bg-primary/10 border border-primary/20 rounded-md font-bold text-primary">
                            {(item.quantity * item.price).toFixed(2)} Dt
                          </div>
                        </div>
                      </div>

                      {index < formData.items.length - 1 && (
                        <Separator className="my-4" />
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>
              </CardContent>
            </Card>
          </motion.div>

          {/* Notes Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
            whileHover={{ ...hoverCard, transition: hoverTransition }}
          >
            <Card className="transition-shadow duration-300 ease-out hover:shadow-2xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  Additional Notes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label htmlFor="notes" className="text-sm">Notes (Optional)</Label>
                  <Textarea
                    id="notes"
                    placeholder="Add any additional notes or terms..."
                    rows={4}
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="border-black dark:border-white focus:border-primary dark:focus:border-primary resize-none"
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Right Column - Summary */}
        <div className="lg:col-span-1">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
            whileHover={{ ...hoverCard, transition: hoverTransition }}
            className="sticky top-8"
          >
            <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20 transition-shadow duration-300 ease-out hover:shadow-2xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="text-2xl">💰</span>
                  Invoice Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal:</span>
                    <span className="font-semibold">{calculateSubtotal().toFixed(2)} Dt</span>
                  </div>

                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Tax (7.52%):</span>
                    <span className="font-semibold">{calculateTax().toFixed(2)} Dt</span>
                  </div>

                  <Separator />

                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold">Total:</span>
                    <motion.span 
                      className="text-2xl font-bold text-primary"
                      key={calculateTotal()}
                      initial={{ scale: 1.2 }}
                      animate={{ scale: 1 }}
                      transition={{ duration: 0.3 }}
                    >
                      {calculateTotal().toFixed(2)} Dt
                    </motion.span>
                  </div>
                </div>

                {formData.client && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="pt-4 border-t"
                  >
                    <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                      <User className="h-4 w-4 text-primary" />
                      Bill To:
                    </h4>
                    <p className="text-sm font-medium">{formData.client}</p>
                    {formData.clientEmail && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                        <Mail className="h-3 w-3" />
                        {formData.clientEmail}
                      </p>
                    )}
                    {formData.clientPhone && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                        <Phone className="h-3 w-3" />
                        {formData.clientPhone}
                      </p>
                    )}
                  </motion.div>
                )}

                <div className="pt-4 border-t space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Status:</span>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      formData.status === 'Paid' 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                        : formData.status === 'Pending'
                        ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400'
                        : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                    }`}>
                      {formData.status}
                    </span>
                  </div>
                  {formData.dueDate && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Due Date:</span>
                      <span className="font-medium">{new Date(formData.dueDate).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}