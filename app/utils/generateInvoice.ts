import jsPDF from "jspdf";
import { Client, Order } from "@/types/index";

export const generateInvoicePDF = async (client: Client, order: Order) => {
  const doc = new jsPDF();
  
  // Company header
  doc.setFontSize(20);
  doc.text("INVOICE", 105, 20, { align: "center" });
  
  // Invoice details
  doc.setFontSize(10);
  doc.text(`Invoice #: ${order.orderNumber}`, 20, 40);
  doc.text(`Date: ${new Date(order.createdAt).toLocaleDateString()}`, 20, 46);
  
  // Client info
  doc.setFontSize(12);
  doc.text("Bill To:", 20, 60);
  doc.setFontSize(10);
  doc.text(client.name, 20, 66);
  doc.text(`CIN: ${client.cin}`, 20, 72);
  doc.text(client.email, 20, 78);
  doc.text(client.phone, 20, 84);
  doc.text(client.location, 20, 90);
  
  // Items table
  let yPos = 110;
  doc.setFontSize(12);
  doc.text("Item", 20, yPos);
  doc.text("Qty", 110, yPos);
  doc.text("Price", 150, yPos);
  
  doc.line(20, yPos + 2, 190, yPos + 2);
  
  yPos += 10;
  doc.setFontSize(10);
  
  order.items.forEach((item) => {
    doc.text(item.description, 20, yPos);
    doc.text(item.quantity.toString(), 110, yPos);
    doc.text(`${item.totalPrice} TND`, 150, yPos);
    yPos += 8;
  });
  
  // Total
  yPos += 10;
  doc.setFontSize(12);
  doc.text(`Total: ${order.totalAmount} TND`, 150, yPos);
  
  // Save PDF
  doc.save(`invoice-${order.orderNumber}.pdf`);
};