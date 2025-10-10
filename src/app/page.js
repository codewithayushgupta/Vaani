"use client";

import { useState, useRef } from "react";
import { jsPDF } from "jspdf";

export default function Home() {
  const [listening, setListening] = useState(false);
  const [recognizedText, setRecognizedText] = useState("");
  const [items, setItems] = useState([]);
  const recognitionRef = useRef(null);

  // Initialize SpeechRecognition
  const startListening = () => {
    if (!("webkitSpeechRecognition" in window)) {
      alert("Speech Recognition not supported in this browser. Use Chrome.");
      return;
    }

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = "hi-IN"; // Supports Hindi + English mix
    recognition.continuous = true;
    recognition.interimResults = false;

    recognition.onresult = (event) => {
      const transcript = event.results[event.results.length - 1][0].transcript.trim();
      setRecognizedText((prev) => prev + " " + transcript);
      parseSpeech(transcript);
    };

    recognition.onerror = (e) => console.error("Speech error:", e);

    recognition.start();
    recognitionRef.current = recognition;
    setListening(true);
  };

  const stopListening = () => {
    recognitionRef.current?.stop();
    setListening(false);
  };

  // Parse speech into { item, qty, price }
  const parseSpeech = (text) => {
    const pattern = /(\d+)?\s*([a-zA-Z\u0900-\u097F\s]+)\s*(\d+)\s*(रुप(ये|या)|rs|rupees)?/gi;
    const newItems = [];
    let match;

    while ((match = pattern.exec(text)) !== null) {
      const qty = match[1] ? parseInt(match[1]) : 1;
      const name = match[2].trim();
      const price = parseInt(match[3]) || 0;
      newItems.push({ name, qty, price, total: qty * price });
    }

    if (newItems.length > 0) {
      setItems((prev) => [...prev, ...newItems]);
    }
  };

  // Generate PDF
  const generatePDF = () => {
    const doc = new jsPDF();

    doc.setFontSize(16);
    doc.text("🧾 Simple Voice Bill", 10, 15);
    doc.setFontSize(12);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 10, 25);

    let y = 40;
    doc.text("Item", 10, y);
    doc.text("Qty", 80, y);
    doc.text("Price", 110, y);
    doc.text("Total", 150, y);
    y += 10;
    doc.line(10, y, 200, y);

    let totalAmount = 0;
    y += 10;
    items.forEach((item) => {
      doc.text(item.name, 10, y);
      doc.text(String(item.qty), 80, y);
      doc.text(`₹${item.price}`, 110, y);
      doc.text(`₹${item.total}`, 150, y);
      y += 10;
      totalAmount += item.total;
    });

    y += 5;
    doc.line(10, y, 200, y);
    y += 10;
    doc.text(`Total Amount: ₹${totalAmount}`, 10, y);

    doc.save("bill.pdf");
  };

  return (
    <main className="min-h-screen bg-gray-950 text-gray-100 flex flex-col items-center justify-center p-6">
      <h1 className="text-3xl font-bold mb-6">🧾 Voice Billing App</h1>

      <div className="flex gap-4 mb-4">
        {!listening ? (
          <button
            onClick={startListening}
            className="px-5 py-3 bg-green-600 rounded-lg font-semibold hover:bg-green-700"
          >
            🎙️ Start Listening
          </button>
        ) : (
          <button
            onClick={stopListening}
            className="px-5 py-3 bg-red-600 rounded-lg font-semibold hover:bg-red-700"
          >
            ⏹ Stop Listening
          </button>
        )}

        <button
          onClick={generatePDF}
          disabled={items.length === 0}
          className="px-5 py-3 bg-blue-600 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-600"
        >
          📄 Generate PDF
        </button>
      </div>

      <div className="w-full max-w-xl bg-gray-900 rounded-xl p-4 border border-gray-700">
        <h2 className="text-lg font-semibold mb-2">Recognized Speech:</h2>
        <p className="text-gray-300 text-sm min-h-[60px]">{recognizedText}</p>
      </div>

      <div className="w-full max-w-xl mt-6">
        <h2 className="text-lg font-semibold mb-2">Parsed Items:</h2>
        {items.length === 0 ? (
          <p className="text-gray-400">No items detected yet.</p>
        ) : (
          <table className="w-full border border-gray-700 text-sm">
            <thead className="bg-gray-800 text-gray-200">
              <tr>
                <th className="p-2 border border-gray-700">Item</th>
                <th className="p-2 border border-gray-700">Qty</th>
                <th className="p-2 border border-gray-700">Price</th>
                <th className="p-2 border border-gray-700">Total</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it, idx) => (
                <tr key={idx}>
                  <td className="p-2 border border-gray-700">{it.name}</td>
                  <td className="p-2 border border-gray-700 text-center">{it.qty}</td>
                  <td className="p-2 border border-gray-700 text-center">₹{it.price}</td>
                  <td className="p-2 border border-gray-700 text-center">₹{it.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </main>
  );
}
