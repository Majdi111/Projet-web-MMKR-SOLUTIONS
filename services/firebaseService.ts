// firebaseService.ts
// Firebase database service functions for managing clients, orders, and invoices
import { db } from "../lib/firebaseClient";
import { Client, Order } from "../types/index";
import { 
  collection, addDoc, getDocs, query, where, updateDoc, doc, serverTimestamp, getDoc, deleteDoc
} from "firebase/firestore";
import type { DocumentData } from "firebase/firestore";

// ============ CLIENT SERVICES ============

// Create a new client in the database
// Returns the newly created client ID
export async function addClient(client: Omit<Client, "id" | "createdAt" | "updatedAt">) {
  try {
    const docRef = await addDoc(collection(db, "clients"), {
      ...client,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    console.error("Error adding client:", error);
    throw error;
  }
}

// Fetch all clients from the database
// Converts Firestore Timestamp objects to JavaScript Date objects
export async function getClients(): Promise<Client[]> {
  const querySnapshot = await getDocs(collection(db, "clients"));
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt?.toDate(),
    updatedAt: doc.data().updatedAt?.toDate(),
  })) as Client[];
}

// ============ ORDER SERVICES ============

// Create a new order in the database
// Returns the newly created order ID
export async function addOrder(order: Omit<Order, "id" | "createdAt" | "updatedAt">) {
  try {
    const docRef = await addDoc(collection(db, "orders"), {
      ...order,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    console.error("Error adding order:", error);
    throw error;
  }
}

// Fetch all orders for a specific client
// Handles both Timestamp and string date formats for compatibility
export const getOrdersByClient = async (clientId: string): Promise<Order[]> => {
  const ordersRef = collection(db, "orders");
  const q = query(ordersRef, where("clientId", "==", clientId));
  const querySnapshot = await getDocs(q);

  return querySnapshot.docs.map((doc) => {
    const data = doc.data();
    
    return {
      id: doc.id,
      ...data,
      // Handle both Timestamp and string formats
      createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : data.createdAt,
      updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : data.updatedAt,
    } as Order;
  });
};

// Update the status of an order
// Automatically sets the updatedAt timestamp
export const updateOrderStatus = async (orderId: string, newStatus: string) => {
  const orderRef = doc(db, "orders", orderId);
  await updateDoc(orderRef, {
    status: newStatus,
    updatedAt: new Date().toISOString()
  });
};

// ============ INVOICE SERVICES ============

// Create a new invoice record in the database
// Returns the newly created invoice ID
export const createInvoice = async (invoiceData: DocumentData) => {
  const invoicesRef = collection(db, "invoices");
  const docRef = await addDoc(invoicesRef, {
    ...invoiceData,
    createdAt: new Date().toISOString(),
  });
  return docRef.id;
};

// Fetch all invoices from the database
export const getInvoices = async () => {
  const invoicesRef = collection(db, "invoices");
  const querySnapshot = await getDocs(invoicesRef);
  
  return querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
};

// Fetch a specific client by their ID
export const getClientById = async (clientId: string) => {
  const clientRef = doc(db, "clients", clientId);
  const clientDoc = await getDoc(clientRef);
  
  if (!clientDoc.exists()) return null;
  
  return {
    id: clientDoc.id,
    ...clientDoc.data(),
  };
};

// Delete an invoice from the database
export const deleteInvoice = async (invoiceId: string) => {
  const invoiceRef = doc(db, "invoices", invoiceId);
  await deleteDoc(invoiceRef);
};