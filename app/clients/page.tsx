"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { hoverCard, hoverTransition } from "@/lib/motion";
import {
  BadgeCheck,
  Ban,
  Plus,
  Phone,
  MapPin,
  Mail,
  Edit,
  Eye,
  Filter,
  Search,
  ShoppingCart,
  FileText,
  Loader2,
  CircleAlert,
  Trash2,
  User,
  UserCheck,
  Users,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import AddClientDialog from '@/app/clients/add-client-form/AddClientDialog';
import DeleteConfirmDialog from '@/components/DeleteConfirmDialog';

import { 
  collection, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  doc, 
  updateDoc, 
  addDoc,
  serverTimestamp,
  Timestamp,
  getDoc,
  deleteDoc
} from 'firebase/firestore';
import { db } from '@/lib/firebaseClient';


interface Client {
  id: string;
  cin: string;
  name: string;
  email: string;
  phone: string;
  location: string;
  status: "Active" | "Inactive";
  createdAt: Date;
  updatedAt: Date;
  pendingOrdersCount?: number;
}

interface OrderItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

interface Order {
  id: string;
  clientId: string;
  clientCIN: string;
  clientName: string;
  orderNumber: string;
  items: OrderItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  totalAmount: number;
  status: "Pending" | "Processing" | "Completed" | "Cancelled";
  createdAt: Date;
  updatedAt: Date;
  invoiceId?: string;
}

interface Invoice {
  id?: string;
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

//  AUTOMATIC CALCULATION FUNCTION
const calculateInvoiceTotals = (
  items: OrderItem[],
  taxRate: number = 0.2
): { subtotal: number; taxAmount: number; totalAmount: number } => {
  const subtotal = items.reduce((sum, item) => {
    return sum + ((item.quantity || 0) * (item.unitPrice || 0));
  }, 0);

  const taxAmount = subtotal * taxRate;
  const totalAmount = subtotal + taxAmount;

  return {
    subtotal: Number(subtotal.toFixed(2)),
    taxAmount: Number(taxAmount.toFixed(2)),
    totalAmount: Number(totalAmount.toFixed(2)),
  };
};

//  PDF GENERATION
const generateInvoicePDF = async (invoice: Invoice) => {
  if (typeof window === "undefined") return;

  try {
    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF();

    // Header
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('INVOICE', 105, 20, { align: 'center' });
    
    // Invoice Details
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Invoice #: ${invoice.invoiceNumber}`, 20, 40);
    doc.text(`Issue Date: ${invoice.issueDate.toLocaleDateString()}`, 20, 46);
    doc.text(`Due Date: ${invoice.dueDate.toLocaleDateString()}`, 20, 52);
    doc.text(`Status: ${invoice.status}`, 20, 58);
    
    // Client Info
    doc.setFont('helvetica', 'bold');
    doc.text('Bill To:', 20, 75);
    doc.setFont('helvetica', 'normal');
    doc.text(invoice.client.name, 20, 81);
    doc.text(`CIN: ${invoice.clientCIN}`, 20, 87);
    if (invoice.client.email) doc.text(invoice.client.email, 20, 93);
    if (invoice.client.phone) doc.text(invoice.client.phone, 20, 99);
    if (invoice.client.location) doc.text(invoice.client.location, 20, 105);
    
    // Table Header
    const startY = 125;
    doc.setFillColor(59, 130, 246);
    doc.rect(20, startY, 170, 8, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.text('Description', 22, startY + 5.5);
    doc.text('Qty', 120, startY + 5.5);
    doc.text('Price', 140, startY + 5.5);
    doc.text('Total', 170, startY + 5.5);
    
    // ✅ SAFE ITEMS LOOP
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'normal');
    let currentY = startY + 15;
    
    invoice.items.forEach((item, index) => {
      if (currentY > 260) {
        doc.addPage();
        currentY = 20;
      }
      
      const description = String(item.description || "No description").substring(0, 50);
      const qty = String(item.quantity || 0);
      const unitPrice = `$${Number(item.unitPrice || 0).toFixed(2)}`;
      const totalPrice = `$${Number(item.totalPrice || 0).toFixed(2)}`;
      
      doc.text(description, 22, currentY);
      doc.text(qty, 120, currentY);
      doc.text(unitPrice, 140, currentY);
      doc.text(totalPrice, 170, currentY);
      currentY += 8;
      
      if (index < invoice.items.length - 1) {
        doc.setDrawColor(200, 200, 200);
        doc.line(20, currentY - 3, 190, currentY - 3);
      }
    });
    
    // Totals
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
  } catch (error) {
    console.error('PDF Error:', error);
    alert('PDF failed. Check console.');
  }
};

const generateInvoiceNumber = () => {
  const timestamp = Date.now().toString().slice(-8);
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `INV-${timestamp}-${random}`;
};

export default function ClientsPage() {
  
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [statusFilter, setStatusFilter] = useState<"All" | "Active" | "Inactive" | "PendingOrders">("All");

  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [clientOrders, setClientOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [processingOrderId, setProcessingOrderId] = useState<string | null>(null);
  const [showAddClientDialog, setShowAddClientDialog] = useState(false);
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [deleteDialogState, setDeleteDialogState] = useState<{ isOpen: boolean; clientId: string; clientName: string }>({
    isOpen: false,
    clientId: "",
    clientName: "",
  });
  const [deletingClientId, setDeletingClientId] = useState<string | null>(null); 
  
  const handleOpenAddClient = () => setShowAddClientDialog(true);
  const handleCloseAddClient = () => setShowAddClientDialog(false);
  
  const handleClientAdded = async () => {
    await loadClients();
  };

  const handleDeleteClient = (clientId: string, clientName: string) => {
    setDeleteDialogState({
      isOpen: true,
      clientId,
      clientName,
    });
  };

  const confirmDeleteClient = async () => {
    try {
      setDeletingClientId(deleteDialogState.clientId);
      await deleteDoc(doc(db, 'clients', deleteDialogState.clientId));
      setClients(clients.filter(c => c.id !== deleteDialogState.clientId));
      setDeleteDialogState({ isOpen: false, clientId: "", clientName: "" });
      setNotification({
        type: "success",
        message: `✅ Client "${deleteDialogState.clientName}" deleted successfully`
      });
      setTimeout(() => setNotification(null), 5000);
    } catch (err) {
      console.error('Error deleting client:', err);
      const errorMessage = err instanceof Error ? err.message : "Failed to delete client";
      setNotification({
        type: "error",
        message: `❌ ${errorMessage}`
      });
      setTimeout(() => setNotification(null), 5000);
    } finally {
      setDeletingClientId(null);
    }
  };

  // Load clients WITH pending order counts
  const loadClients = async () => {
    try {
      setLoading(true);
      const clientsRef = collection(db, 'clients');
      const q = query(clientsRef, orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      
      const clientsData = await Promise.all(snapshot.docs.map(async (doc) => {
        const data = doc.data();
        const clientData = {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date()
        } as Client;

        const ordersRef = collection(db, 'orders');
        const pendingOrdersQuery = query(
          ordersRef, 
          where('clientId', '==', doc.id),
          where('status', '==', 'Pending')
        );
        const pendingSnapshot = await getDocs(pendingOrdersQuery);
        const pendingCount = pendingSnapshot.size;

        return {
          ...clientData,
          pendingOrdersCount: pendingCount
        } as Client;
      }));
      
      setClients(clientsData);
    } catch (err) {
      console.error("Error loading clients:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClients();
  }, []);

  const handleClientClick = async (client: Client) => {
    setSelectedClient(client);
    setClientOrders([]);
    setLoading(true);

    try {
      const ordersRef = collection(db, 'orders');
      const q = query(ordersRef, where('clientId', '==', client.id));
      const snapshot = await getDocs(q);
      
      const ordersData = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          clientId: data.clientId || '',
          clientCIN: data.clientCIN || '',
          clientName: data.clientName || '',
          orderNumber: data.orderNumber || '',
          items: data.items ?? [],
          subtotal: data.subtotal ?? 0,
          taxRate: data.taxRate ?? 0.2,
          taxAmount: data.taxAmount ?? 0,
          totalAmount: data.totalAmount ?? 0,
          status: (data.status as string) ?? "Pending",
          createdAt: data.createdAt?.toDate?.() || new Date(),
          updatedAt: data.updatedAt?.toDate?.() || new Date(),
          invoiceId: data.invoiceId || ''
        } as Order;
      });
      
      setClientOrders(ordersData);
    } catch (err) {
      console.error("Error loading orders:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleTraiterOrder = async (order: Order) => {
    if (!selectedClient) return;

    try {
      setProcessingOrderId(order.id);

      const issueDate = new Date();
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 30);

      // Use the tax values directly from the order, not recalculating
      const taxRate = order.taxRate ?? 0;
      const taxAmount = order.taxAmount ?? 0;
      const subtotal = order.subtotal ?? 0;
      const totalAmount = order.totalAmount ?? 0;

      const invoiceData: Invoice = {
        invoiceNumber: generateInvoiceNumber(),
        orderId: order.id,
        clientId: selectedClient.id,
        clientCIN: selectedClient.cin,
        client: {
          name: selectedClient.name,
          email: selectedClient.email,
          phone: selectedClient.phone,
          location: selectedClient.location,
        },
        items: order.items.map(item => ({
          ...item,
          totalPrice: (item.quantity || 0) * (item.unitPrice || 0)
        })),
        subtotal,
        taxRate,
        taxAmount,
        totalAmount,
        issueDate,
        dueDate,
        status: "Pending",
        notes: `Generated from Order #${order.orderNumber}`,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const invoicesRef = collection(db, 'invoices');
      const invoiceDoc = await addDoc(invoicesRef, {
        ...invoiceData,
        issueDate: Timestamp.fromDate(issueDate),
        dueDate: Timestamp.fromDate(dueDate),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      const orderRef = doc(db, 'orders', order.id);
      await updateDoc(orderRef, {
        status: "Completed",
        invoiceId: invoiceDoc.id,
        updatedAt: serverTimestamp(),
      });

      await generateInvoicePDF({ ...invoiceData, id: invoiceDoc.id });
      await handleClientClick(selectedClient);
      await loadClients(); // Refresh pending counts

      setNotification({
        type: "success",
        message: `✅ Invoice ${invoiceData.invoiceNumber} created & PDF downloaded!`
      });
      setTimeout(() => setNotification(null), 5000);
    } catch (err) {
      console.error("Error:", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to process order";
      setNotification({
        type: "error",
        message: `❌ ${errorMessage}`
      });
      setTimeout(() => setNotification(null), 5000);
    } finally {
      setProcessingOrderId(null);
    }
  };

  //   PendingOrders filter logic with sorting - pending clients at bottom
  const filteredClients = (() => {
    let result = statusFilter === "All" 
      ? clients 
      : statusFilter === "PendingOrders"
        ? clients.filter(c => (c.pendingOrdersCount || 0) > 0)
        : clients.filter(c => c.status === statusFilter);
    
    // Sort so clients with pending orders appear at the bottom
    return result.sort((a, b) => {
      const aPending = (a.pendingOrdersCount || 0) > 0 ? 1 : 0;
      const bPending = (b.pendingOrdersCount || 0) > 0 ? 1 : 0;
      return aPending - bPending; // 0s first, 1s last
    });
  })();

  // ========== CLIENT ORDERS VIEW ==========
  if (selectedClient) {
    return (
      <div className="p-8 max-w-[1600px] mx-auto">
        <Button
          variant="outline"
          onClick={() => setSelectedClient(null)}
          className="mb-6 flex items-center gap-2"
        >
          ← Back to Clients
        </Button>

        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarFallback className="bg-primary/20 text-primary font-bold text-2xl">
                  {selectedClient.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-3xl font-bold">{selectedClient.name}</h2>
                <p className="text-muted-foreground text-lg">CIN: {selectedClient.cin}</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mt-4">
            <div className="space-y-1">
              <p className="font-semibold">📧 Email:</p>
              <p>{selectedClient.email}</p>
            </div>
            <div className="space-y-1">
              <p className="font-semibold">📞 Phone:</p>
              <p>{selectedClient.phone}</p>
            </div>
            <div className="space-y-1">
              <p className="font-semibold">📍 Location:</p>
              <p>{selectedClient.location}</p>
            </div>
            <div className="space-y-1">
              <p className="font-semibold">Status:</p>
              <Badge
                variant={selectedClient.status === "Active" ? "default" : "secondary"}
                className="inline-flex items-center gap-1"
              >
                {selectedClient.status === "Active" ? (
                  <BadgeCheck className="h-3 w-3" />
                ) : (
                  <Ban className="h-3 w-3" />
                )}
                {selectedClient.status}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 gap-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p>Loading orders...</p>
          </div>
        ) : clientOrders.length === 0 ? (
          <Card className="p-12 text-center">
            <ShoppingCart className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-xl font-semibold mb-2">No orders</h3>
            <p className="text-muted-foreground">No orders for this client.</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {clientOrders.map((order, index) => (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ ...hoverCard, transition: hoverTransition }}
              >
                <Card className="p-6 shadow-md transition-shadow duration-300 ease-out hover:shadow-2xl">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold flex items-center gap-2">
                      <ShoppingCart size={20} className="text-primary" />
                      Order #{order.orderNumber}
                    </h3>
                    <Badge variant={
                      order.status === "Pending" ? "secondary" :
                      order.status === "Completed" ? "default" :
                      order.status === "Processing" ? "outline" : "destructive"
                    }>
                      {order.status}
                    </Badge>
                  </div>
                  
                  <div className="text-sm space-y-2 mb-4">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span className="font-medium">${order.subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tax {(order.taxRate * 100).toFixed(1)}%:</span>
                      <span className="font-medium">${order.taxAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold border-t pt-2">
                      <span>Total:</span>
                      <span className="text-primary">${order.totalAmount.toFixed(2)}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {order.createdAt.toLocaleDateString()}
                    </p>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      className="flex-1"
                      variant="outline"
                      onClick={() => setSelectedOrder(order)}
                    >
                      <Eye size={16} className="mr-2" /> Details
                    </Button>
                    {order.status === "Pending" && (
                      <Button
                        className="bg-green-600 hover:bg-green-700 flex items-center gap-2"
                        onClick={() => handleTraiterOrder(order)}
                        disabled={processingOrderId === order.id}
                      >
                        {processingOrderId === order.id ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin mr-2" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <FileText size={16} className="mr-2" />
                            Traiter
                          </>
                        )}
                      </Button>
                    )}
                    {order.status === "Completed" && order.invoiceId && (
                      <Badge variant="default" className="px-3 py-2 h-fit">
                        <FileText size={14} className="mr-1" />
                        Invoiced
                      </Badge>
                    )}
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )}

        {selectedOrder && (
          <Dialog open={true} onOpenChange={() => setSelectedOrder(null)}>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Order #{selectedOrder.orderNumber}</DialogTitle>
              </DialogHeader>
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Status</p>
                    <Badge variant={selectedOrder.status === "Completed" ? "default" : "secondary"}>
                      {selectedOrder.status}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Date</p>
                    <p>{selectedOrder.createdAt.toLocaleDateString()}</p>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <ShoppingCart size={18} />
                    Items ({selectedOrder.items.length})
                  </h4>
                  <div className="space-y-2">
                    {selectedOrder.items.map((item, i) => (
                      <div key={i} className="p-4 border rounded-lg bg-muted/30">
                        <div className="flex justify-between items-start mb-2">
                          <p className="font-semibold">{item.description}</p>
                          <p className="font-bold text-primary">${item.totalPrice.toFixed(2)}</p>
                        </div>
                        <div className="flex gap-4 text-sm text-muted-foreground">
                          <span>Qty: {item.quantity}</span>
                          <span>Unit: ${item.unitPrice.toFixed(2)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border-t pt-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>${selectedOrder.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tax ({(selectedOrder.taxRate * 100).toFixed(1)}%):</span>
                    <span>${selectedOrder.taxAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold border-t pt-2">
                    <span>Total:</span>
                    <span className="text-primary">${selectedOrder.totalAmount.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    );
  }

  // ========== CLIENTS LIST VIEW ==========
  return (
    <div className="p-8 max-w-[1600px] mx-auto">
      {/* Notification Toast */}
      {notification && (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          className={`fixed top-4 left-1/2 -translate-x-1/2 max-w-md z-50 p-4 rounded-lg border shadow-lg ${
            notification.type === "success"
              ? "bg-green-500/10 border-green-500/30 text-green-700 dark:text-green-400"
              : "bg-red-500/10 border-red-500/30 text-red-700 dark:text-red-400"
          }`}
        >
          <div className="flex items-center gap-3">
            <div className={`text-xl ${notification.type === "success" ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
              {notification.type === "success" ? "✓" : "⚠"}
            </div>
            <p className="font-medium">{notification.message}</p>
          </div>
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8"
      >
        <div>
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Clients
          </h1>
          <p className="text-muted-foreground">Manage clients & generate invoices</p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => setViewMode(viewMode === "grid" ? "table" : "grid")}
            className="hover:scale-[1.02] transition-transform duration-300 ease-out"
          >
            {viewMode === "grid" ? "Table view" : "Grid"}
          </Button>
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            transition={hoverTransition}
          >
            <Button className="bg-gradient-to-r from-primary to-primary/80 hover:scale-[1.02] transition-transform duration-300 ease-out shadow-lg flex items-center gap-2" onClick={handleOpenAddClient}>
              <Plus size={16} /> Add Client
            </Button>
          </motion.div>
        </div>
      </motion.div>

      {/* ✅ UPDATED: Added Pending Orders filter */}
      <Card className="p-4 mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter size={18} />
            <span className="font-semibold">Filter:</span>
          </div>
          <div className="flex gap-2 flex-wrap">
            {(["All", "Active", "Inactive", "PendingOrders"] as const).map(status => (
              <Button
                key={status}
                variant={statusFilter === status ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter(status)}
              >
                {status === "PendingOrders" ? "Pending Orders" : status}
                <Badge variant="secondary" className="ml-2 px-2 py-0">
                  {status === "All" ? clients.length :
                   status === "PendingOrders" ? clients.filter(c => (c.pendingOrdersCount || 0) > 0).length :
                   clients.filter(c => c.status === status).length}
                </Badge>
              </Button>
            ))}
          </div>
        </div>
      </Card>

      {loading ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="flex items-center justify-center py-32"
        >
          <Card className="p-8 shadow-lg">
            <div className="flex flex-col items-center gap-4">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              >
                <Loader2 className="h-12 w-12 text-primary" />
              </motion.div>
              <p className="text-lg font-semibold">Loading clients...</p>
            </div>
          </Card>
        </motion.div>
      ) : (
        <>
          {viewMode === "grid" && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredClients.map((client, index) => (
                <motion.div
                  key={client.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ ...hoverCard, transition: hoverTransition }}
                  className="cursor-pointer"
                  onClick={() => handleClientClick(client)}
                >
                  <Card className={`h-full p-6 hover:shadow-2xl transition-all ${
                    (client.pendingOrdersCount || 0) > 0 
                      ? "ring-2 ring-yellow-500/30 border-yellow-500/50 bg-gradient-to-br from-yellow-50/50" 
                      : ""
                  }`}>
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-12 w-12">
                          <AvatarFallback className={`text-primary font-bold text-lg ${
                            (client.pendingOrdersCount || 0) > 0 
                              ? "bg-gradient-to-br from-yellow-500/20 to-orange-500/20 text-yellow-600" 
                              : "bg-gradient-to-br from-primary/20 to-primary/40"
                          }`}>
                            {client.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-bold">{client.name}</h3>
                          <p className="text-sm text-muted-foreground">CIN: {client.cin}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={client.status === "Active" ? "default" : "secondary"}
                          className="inline-flex items-center gap-1"
                        >
                          {client.status === "Active" ? (
                            <BadgeCheck className="h-3 w-3" />
                          ) : (
                            <Ban className="h-3 w-3" />
                          )}
                          {client.status}
                        </Badge>
                        {(client.pendingOrdersCount || 0) > 0 && (
                          <Badge variant="destructive" className="flex items-center gap-1 text-xs">
                            <CircleAlert size={12} />
                            {client.pendingOrdersCount}
                          </Badge>
                        )}
                        <motion.div
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteClient(client.id, client.name);
                          }}
                        >
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-full border border-destructive/30 bg-destructive/5 text-destructive hover:bg-destructive/10"
                            title="Delete client"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </motion.div>
                      </div>
                    </div>
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Mail size={16} className="text-primary" /> {client.email}
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone size={16} className="text-primary" /> {client.phone}
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin size={16} className="text-primary" /> {client.location}
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}

          {viewMode === "table" && (
            <Card>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="h-12 px-4 text-left font-semibold">Client</th>
                      <th className="h-12 px-4 text-left font-semibold">Email</th>
                      <th className="h-12 px-4 text-left font-semibold">Phone</th>
                      <th className="h-12 px-4 text-left font-semibold">Location</th>
                      <th className="h-12 px-4 text-center font-semibold">Status</th>
                      <th className="h-12 px-4 text-center font-semibold">Pending</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredClients.map((client, index) => (
                      <motion.tr
                        key={client.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className={`border-b hover:bg-muted/20 cursor-pointer transition-colors ${
                          (client.pendingOrdersCount || 0) > 0 
                            ? "bg-yellow-50/50 hover:bg-yellow-100/50 border-yellow-200" 
                            : ""
                        }`}
                        onClick={() => handleClientClick(client)}
                      >
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10">
                              <AvatarFallback className={`text-primary font-bold ${
                                (client.pendingOrdersCount || 0) > 0 
                                  ? "bg-yellow-500/20 text-yellow-600" 
                                  : "bg-primary/20"
                              }`}>
                                {client.name.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{client.name}</p>
                              <p className="text-sm text-muted-foreground">CIN: {client.cin}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 max-w-[200px] truncate">{client.email}</td>
                        <td className="px-4 py-4">{client.phone}</td>
                        <td className="px-4 py-4">{client.location}</td>
                        <td className="px-4 py-4 text-center">
                          <Badge
                            variant={client.status === "Active" ? "default" : "secondary"}
                            className="inline-flex items-center gap-1"
                          >
                            {client.status === "Active" ? (
                              <BadgeCheck className="h-3 w-3" />
                            ) : (
                              <Ban className="h-3 w-3" />
                            )}
                            {client.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-4 text-center">
                          {(client.pendingOrdersCount || 0) > 0 ? (
                            <Badge variant="destructive" className="flex items-center gap-1 text-xs">
                              <CircleAlert size={12} />
                              {client.pendingOrdersCount}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground text-xs">0</span>
                          )}
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </>
      )}
      
      <AddClientDialog 
        isOpen={showAddClientDialog}
        onClose={handleCloseAddClient}
        onSuccess={handleClientAdded}
      />

      <DeleteConfirmDialog
        isOpen={deleteDialogState.isOpen}
        itemName={deleteDialogState.clientName}
        itemType="Client"
        onConfirm={confirmDeleteClient}
        onCancel={() => setDeleteDialogState({ isOpen: false, clientId: "", clientName: "" })}
      />
    </div>
  );
}
