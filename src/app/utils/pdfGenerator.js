import { jsPDF } from "jspdf";

export function generateBillPDF(items, customerName) {
  if (!items || items.length === 0) {
    return null;
  }

  const doc = new jsPDF();
  doc.setFontSize(16);
  doc.text("🧾 Voice Billing Receipt", 10, 15);
  doc.setFontSize(11);
  doc.text(`Date: ${new Date().toLocaleString()}`, 10, 25);
  
  if (customerName) {
    doc.text(`Customer: ${customerName}`, 10, 32);
  }

  let y = 44;
  doc.text("Item", 10, y);
  doc.text("Qty", 90, y);
  doc.text("Price", 120, y);
  doc.text("Total", 160, y);
  y += 6;
  doc.line(10, y, 200, y);
  y += 8;

  let totalAmount = 0;
  items.forEach((item) => {
    const name = item.name.length > 28 ? item.name.slice(0, 28) + "..." : item.name;
    doc.text(name, 10, y);
    doc.text(String(item.qty), 95, y);
    doc.text(`₹${item.price}`, 125, y);
    doc.text(`₹${item.total}`, 160, y);
    y += 8;
    totalAmount += item.total;
    
    if (y > 270) {
      doc.addPage();
      y = 20;
    }
  });

  y += 6;
  doc.line(10, y, 200, y);
  y += 8;
  doc.text(`Total Amount: ₹${totalAmount}`, 10, y);
  doc.save("bill.pdf");

  return totalAmount;
}
