"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { hoverCard, hoverTransition } from "@/lib/motion";
import { 
  Plus, 
  MoreVertical, 
  Edit, 
  Trash2, 
  Download, 
  FileText, 
  User, 
  Calendar, 
  DollarSign, 
  CheckCircle, 
  Filter, 
  Loader2, 
  AlertCircle,
  Search 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"; // ✅ NEW IMPORT
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { collection, getDocs, query, orderBy, deleteDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebaseClient';

interface OrderItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  orderId: string;
  clientId: string;
  clientCIN: string;
  client: {
    name: string;
    email: string;
    phone: string;
    location: string;
  };
  items: OrderItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  totalAmount: number;
  issueDate: Date;
  dueDate: Date;
  status: "Paid" | "Pending" | "Overdue";
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const generateInvoicePDF = async (invoice: Invoice) => {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF();
  
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('INVOICE', 105, 20, { align: 'center' });
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Invoice #: ${invoice.invoiceNumber}`, 20, 40);
  doc.text(`Issue Date: ${invoice.issueDate.toLocaleDateString()}`, 20, 46);
  doc.text(`Due Date: ${invoice.dueDate.toLocaleDateString()}`, 20, 52);
  doc.text(`Status: ${invoice.status}`, 20, 58);
  
  doc.setFont('helvetica', 'bold');
  doc.text('Bill To:', 20, 75);
  doc.setFont('helvetica', 'normal');
  doc.text(invoice.client.name, 20, 81);
  doc.text(`CIN: ${invoice.clientCIN}`, 20, 87);
  if (invoice.client.email) doc.text(invoice.client.email, 20, 93);
  if (invoice.client.phone) doc.text(invoice.client.phone, 20, 99);
  if (invoice.client.location) doc.text(invoice.client.location, 20, 105);
  
  const startY = 125;
  doc.setFillColor(59, 130, 246);
  doc.rect(20, startY, 170, 8, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.text('Description', 22, startY + 5.5);
  doc.text('Qty', 120, startY + 5.5);
  doc.text('Price', 140, startY + 5.5);
  doc.text('Total', 170, startY + 5.5);
  
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'normal');
  let currentY = startY + 15;
  
  invoice.items.forEach((item, index) => {
    if (currentY > 260) {
      doc.addPage();
      currentY = 20;
    }
    const description = String(item.description || "No description").substring(0, 50);
    doc.text(description, 22, currentY);
    doc.text(String(item.quantity || 0), 120, currentY);
    doc.text(`$${Number(item.unitPrice || 0).toFixed(2)}`, 140, currentY);
    doc.text(`$${Number(item.totalPrice || 0).toFixed(2)}`, 170, currentY);
    currentY += 8;
    
    if (index < invoice.items.length - 1) {
      doc.setDrawColor(200, 200, 200);
      doc.line(20, currentY - 3, 190, currentY - 3);
    }
  });
  
  currentY += 10;
  doc.setFont('helvetica', 'normal');
  doc.text('Subtotal:', 140, currentY);
  doc.text(`$${invoice.subtotal.toFixed(2)}`, 170, currentY);
  
  currentY += 7;
  const displayTaxRate = invoice.taxRate > 1 ? invoice.taxRate : invoice.taxRate * 100;
  doc.text(`Tax (${displayTaxRate.toFixed(2)}%):`, 140, currentY);
  doc.text(`$${invoice.taxAmount.toFixed(2)}`, 170, currentY);
  
  currentY += 10;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('Total:', 140, currentY);
  doc.text(`$${invoice.totalAmount.toFixed(2)}`, 170, currentY);
  
  if (invoice.notes) {
    currentY += 20;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Notes:', 20, currentY);
    doc.setFont('helvetica', 'normal');
    doc.text(invoice.notes, 20, currentY + 6, { maxWidth: 170 });
  }
  
  doc.setFontSize(8);
  doc.setTextColor(128, 128, 128);
  doc.text('Thank you for your business!', 105, 280, { align: 'center' });
  
  doc.save(`${invoice.invoiceNumber}.pdf`);
};

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);
  const [deleteDialogState, setDeleteDialogState] = useState<{ isOpen: boolean; invoiceId: string; invoiceNumber: string }>({
    isOpen: false,
    invoiceId: "",
    invoiceNumber: "",
  });
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [statusFilter, setStatusFilter] = useState<"All" | "Paid" | "Pending" | "Overdue">("All");
  const [cinSearch, setCinSearch] = useState(""); // ✅ NEW: CIN Search State

  useEffect(() => {
    loadInvoices();
  }, []);

  const loadInvoices = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const invoicesRef = collection(db, 'invoices');
      const q = query(invoicesRef, orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      
      const invoicesData = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          issueDate: data.issueDate?.toDate() || new Date(),
          dueDate: data.dueDate?.toDate() || new Date(),
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date()
        } as Invoice;
      });
      
      setInvoices(invoicesData);
    } catch (err) {
      console.error('Error loading invoices:', err);
      setError('Failed to load invoices. Please check your Firebase configuration.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (invoiceId: string, newStatus: Invoice["status"]) => {
    setUpdatingStatusId(invoiceId);
    
    try {
      const invoiceRef = doc(db, 'invoices', invoiceId);
      await updateDoc(invoiceRef, {
        status: newStatus,
        updatedAt: serverTimestamp()
      });
      
      setInvoices(prev => 
        prev.map(inv => 
          inv.id === invoiceId 
            ? { ...inv, status: newStatus, updatedAt: new Date() }
            : inv
        )
      );
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update status. Please try again.');
    } finally {
      setUpdatingStatusId(null);
    }
  };

  //filter
  const filteredInvoices = invoices
    .filter(inv => statusFilter === "All" || inv.status === statusFilter)
    .filter(inv => 
      inv.clientCIN.toLowerCase().includes(cinSearch.toLowerCase()) || 
      cinSearch === ""
    );

  const totalInvoices = invoices.length;
  const paidInvoices = invoices.filter(i => i.status === "Paid").length;
  const totalRevenue = invoices
    .filter(i => i.status === "Paid")
    .reduce((sum, i) => sum + i.totalAmount, 0);

  const handleDownloadPDF = async (invoice: Invoice) => {
    setDownloadingId(invoice.id);
    try {
      await generateInvoicePDF(invoice);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setDownloadingId(null);
    }
  };

  const handleDeleteInvoice = (invoiceId: string, invoiceNumber: string) => {
    setDeleteDialogState({
      isOpen: true,
      invoiceId,
      invoiceNumber,
    });
  };

  const confirmDeleteInvoice = async () => {
    try {
      await deleteDoc(doc(db, 'invoices', deleteDialogState.invoiceId));
      setInvoices(invoices.filter(inv => inv.id !== deleteDialogState.invoiceId));
      setDeleteDialogState({ isOpen: false, invoiceId: "", invoiceNumber: "" });
    } catch (error) {
      console.error('Error deleting invoice:', error);
      alert('Failed to delete invoice. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="p-8 shadow-lg">
            <div className="flex flex-col items-center gap-4">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              >
                <Loader2 className="h-12 w-12 text-primary" />
              </motion.div>
              <p className="text-lg font-semibold">Loading invoices...</p>
            </div>
          </Card>
        </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 max-w-2xl mx-auto">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription className="mt-2">
            {error}
            <div className="mt-4">
              <Button onClick={loadInvoices} variant="outline" size="sm">
                Try Again
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-[1600px] mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8"
      >
        <div>
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Invoices
          </h1>
          <p className="text-muted-foreground">Manage billing and payment records.</p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => setViewMode(viewMode === "grid" ? "table" : "grid")}
            className="hover:scale-[1.02] transition-transform duration-300 ease-out"
          >
            {viewMode === "grid" ? "Table View" : "Grid View"}
          </Button>
          <Button 
            className="flex items-center gap-2 bg-gradient-to-r from-primary to-primary/80 hover:scale-[1.02] transition-transform duration-300 ease-out shadow-lg"
          >
            <Plus size={16} /> New Invoice
          </Button>
        </div>
      </motion.div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
        {[
          {
            title: "Total Invoices",
            value: totalInvoices,
            description: "Invoices generated",
            icon: FileText,
            color: "text-blue-600",
          },
          {
            title: "Paid Invoices",
            value: paidInvoices,
            description: "Fully settled",
            icon: CheckCircle,
            color: "text-green-600",
          },
          {
            title: "Total Revenue",
            value: `$${totalRevenue.toFixed(2)}`,
            description: "Total payments received",
            icon: DollarSign,
            color: "text-purple-600",
          },
        ].map((stat, index) => (
          <motion.div
            key={stat.title}
                      initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.4, ease: "easeOut", delay: index * 0.05 }}
  whileHover={{ ...hoverCard, transition: hoverTransition }}
          >
            <Card className="transition-shadow duration-300 ease-out hover:shadow-2xl">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <stat.icon className={`h-10 w-10 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">{stat.description}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

  {/*  Filters LEFT + Search RIGHT */}
<motion.div
  initial={{ opacity: 0, y: 10 }}
  animate={{ opacity: 1, y: 0 }}
  className="mb-6"
>
  <Card className="p-6">
    <div className="flex flex-col lg:flex-row justify-between items-center gap-4">
      {/* LEFT: Filter Label + Buttons - SAME ORDER */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="flex items-center gap-2">
          <Filter size={18} className="text-muted-foreground" />
          <span className="font-semibold text-sm">Filter by Status:</span>
        </div>
        <div className="flex gap-2 flex-wrap order-1">
          {["All", "Paid", "Pending", "Overdue"].map((status) => (
            <Button
              key={status}
              variant={statusFilter === status ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter(status as typeof statusFilter)}
            >
              {status}
              <Badge variant="secondary" className="ml-2 px-1.5 py-0 h-5">
                {status === "All" 
                  ? filteredInvoices.length 
                  : invoices.filter(i => i.status === status).filter(i => 
                      i.clientCIN.toLowerCase().includes(cinSearch.toLowerCase())
                    ).length
                }
              </Badge>
            </Button>
          ))}
        </div>
      </div>

      {/* RIGHT: Search Bar */}
      <div className="relative flex-1 max-w-md order-last">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by CIN..."
          value={cinSearch}
          onChange={(e) => setCinSearch(e.target.value)}
          className="pl-10 w-full"
        />
      </div>
    </div>
    
    {/* Results count */}
    {filteredInvoices.length !== invoices.length && (
      <p className="text-sm text-muted-foreground mt-3">
        Showing {filteredInvoices.length} of {invoices.length} invoices
        {cinSearch && (
          <>
            {' '}• Found {filteredInvoices.length} matching CIN: <strong>{cinSearch}</strong>
          </>
        )}
      </p>
    )}
  </Card>
</motion.div>


      {/* Grid View */}
      {viewMode === "grid" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredInvoices.map((inv, index) => (
            <motion.div
              key={inv.id}
              initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.4, ease: "easeOut", delay: index * 0.05 }}
  whileHover={{ scale: 1.03, y: -8 }}
            >
              <Card className="overflow-hidden transition-shadow duration-300 ease-out hover:shadow-2xl">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <FileText className="h-4 w-4 text-primary" /> {inv.invoiceNumber}
                      </CardTitle>
                      <Badge
                        className="mt-2"
                        variant={
                          inv.status === "Paid"
                            ? "default"
                            : inv.status === "Pending"
                            ? "secondary"
                            : "destructive"
                        }
                      >
                        {inv.status}
                      </Badge>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleDownloadPDF(inv)}>
                          <Download className="mr-2 h-4 w-4" />
                          Download PDF
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit Invoice
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="text-destructive"
                          onClick={() => handleDeleteInvoice(inv.id, inv.invoiceNumber)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <User size={16} className="text-primary" />
                    <span className="font-medium">{inv.client.name}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar size={16} className="text-primary" />
                    <span>Due: {inv.dueDate.toLocaleDateString()}</span>
                  </div>
                  <Separator className="my-4" />
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Amount</p>
                    <p className="text-2xl font-bold text-primary">
                      ${inv.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>
                  
                  <div className="flex gap-2 mt-4">
                    <Button 
                      onClick={() => handleDownloadPDF(inv)}
                      disabled={downloadingId === inv.id}
                      className="flex-1"
                      variant="outline"
                    >
                      {downloadingId === inv.id ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Download className="mr-2 h-4 w-4" />
                          Download Invoice
                        </>
                      )}
                    </Button>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button 
                          variant="default" 
                          size="default"
                          disabled={updatingStatusId === inv.id}
                          className="flex-1 justify-center gap-2"
                        >
                          {updatingStatusId === inv.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Edit className="h-4 w-4" />
                          )}
                          Status
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem 
                          onClick={() => handleUpdateStatus(inv.id, "Pending")}
                          disabled={inv.status === "Pending"}
                        >
                          Pending
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleUpdateStatus(inv.id, "Paid")}
                          disabled={inv.status === "Paid"}
                        >
                          Paid
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleUpdateStatus(inv.id, "Overdue")}
                          disabled={inv.status === "Overdue"}
                        >
                          Overdue
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Table View - SAME AS BEFORE */}
      {viewMode === "table" && (
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }}
        >
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr className="border-b">
                    <th className="h-14 px-6 text-left font-semibold text-sm">Invoice #</th>
                    <th className="h-14 px-6 text-left font-semibold text-sm">Client</th>
                    <th className="h-14 px-6 text-left font-semibold text-sm">CIN</th>
                    <th className="h-14 px-6 text-left font-semibold text-sm">Due Date</th>
                    <th className="h-14 px-6 text-center font-semibold text-sm">Status</th>
                    <th className="h-14 px-6 text-right font-semibold text-sm">Amount</th>
                    <th className="h-14 px-6 text-center font-semibold text-sm">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInvoices.map((inv) => (
                    <tr key={inv.id} className="border-b hover:bg-muted/30">
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-2">
                          <FileText size={16} className="text-primary" />
                          <span className="font-semibold">{inv.invoiceNumber}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5">{inv.client.name}</td>
                      <td className="px-6 py-5 font-mono text-xs bg-muted/20 px-2 py-1 rounded">{inv.clientCIN}</td>
                      <td className="px-6 py-5">{inv.dueDate.toLocaleDateString()}</td>
                      <td className="px-6 py-5">
                        <div className="flex justify-center">
                          <Badge
                            variant={
                              inv.status === "Paid" ? "default" :
                              inv.status === "Pending" ? "secondary" : "destructive"
                            }
                          >
                            {inv.status}
                          </Badge>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-right font-bold text-primary">
                        ${inv.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDownloadPDF(inv)}
                            disabled={downloadingId === inv.id}
                            title="Download PDF"
                          >
                            {downloadingId === inv.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Download className="h-4 w-4" />
                            )}
                          </Button>
                          
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                disabled={updatingStatusId === inv.id}
                                title="Change Status"
                              >
                                {updatingStatusId === inv.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Edit className="h-4 w-4" />
                                )}
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem 
                                onClick={() => handleUpdateStatus(inv.id, "Pending")}
                                disabled={inv.status === "Pending"}
                              >
                                Pending
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleUpdateStatus(inv.id, "Paid")}
                                disabled={inv.status === "Paid"}
                              >
                                Paid
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleUpdateStatus(inv.id, "Overdue")}
                                disabled={inv.status === "Overdue"}
                              >
                                Overdue
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                          
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="hover:text-destructive" 
                            title="Delete"
                            onClick={() => handleDeleteInvoice(inv.id, inv.invoiceNumber)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </motion.div>
      )}

      {/* Empty State */}
      {filteredInvoices.length === 0 && !loading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-16"
        >
          <Card className="max-w-md mx-auto p-8">
            <FileText className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-xl font-semibold mb-2">
              {cinSearch || statusFilter !== "All" ? "No matching invoices" : "No invoices yet"}
            </h3>
            <p className="text-muted-foreground mb-4">
              {cinSearch 
                ? `No invoices found for CIN: "${cinSearch}"`
                : statusFilter !== "All"
                ? "No invoices match the selected filter."
                : "Create your first invoice to get started."}
            </p>
            <div className="flex flex-col sm:flex-row gap-2">
              {statusFilter !== "All" && (
                <Button onClick={() => setStatusFilter("All")} variant="outline">
                  Clear Filters
                </Button>
              )}
              {cinSearch && (
                <Button onClick={() => setCinSearch("")} variant="outline">
                  Clear Search
                </Button>
              )}
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create Invoice
              </Button>
            </div>
          </Card>
        </motion.div>
      )}

      {/* Delete Invoice Dialog */}
      <Dialog open={deleteDialogState.isOpen} onOpenChange={(open) => !open && setDeleteDialogState({ isOpen: false, invoiceId: "", invoiceNumber: "" })}>
        <DialogContent className="max-w-md">
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.99 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
          >
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-destructive">
                <AlertCircle className="h-5 w-5" />
                Delete Invoice
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <p className="text-sm text-muted-foreground">
                Are you sure you want to delete invoice <span className="font-semibold text-foreground">{deleteDialogState.invoiceNumber}</span>?
              </p>
              <p className="text-xs text-destructive/70">
                ⚠️ This action cannot be undone.
              </p>
            </div>

            <DialogFooter className="gap-2">
              <Button 
                variant="outline" 
                onClick={() => setDeleteDialogState({ isOpen: false, invoiceId: "", invoiceNumber: "" })}
              >
                Cancel
              </Button>
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button 
                  variant="destructive"
                  onClick={confirmDeleteInvoice}
                  className="bg-destructive hover:bg-destructive/90"
                >
                  Delete Invoice
                </Button>
              </motion.div>
            </DialogFooter>
          </motion.div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
