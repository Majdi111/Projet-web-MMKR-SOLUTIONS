export interface Client {
  id: string;
  cin: string; // Unique identifier
  name: string;
  email: string;
  phone: string;
  location: string;
  status: "Active" | "Inactive";
  createdAt: Date;
  updatedAt: Date;
}

export interface Order {
  id: string;
  clientId: string;
  clientCIN: string;
  clientName: string;
  orderNumber: string;
  items: OrderItem[];
  subtotal: number; // Add subtotal before tax
  taxRate: number; // Store tax rate (e.g., 0.0752)
  taxAmount: number; // Calculated tax
  totalAmount: number; // Final total with tax
  status: "Pending" | "Processing" | "Completed" | "Cancelled";
  createdAt: Date;
  updatedAt: Date;
  invoiceId?: string;
}

export interface OrderItem {
  id: string;
  productId?: string;
  reference?: string;
  description: string; // Changed from 'name' to match your form
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface Invoice {
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