"use client";

import { useState, useRef } from "react";
import { jsPDF } from "jspdf";

export default function Home() {
  const [listening, setListening] = useState(false);
  const [recognizedText, setRecognizedText] = useState("");
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(false); // New state for API loading
  const recognitionRef = useRef(null);
  
  // The backend API URL from ngrok
  const API_URL = "https://5f042ba7e1ba.ngrok-free.app/process-invoice/";

  // --- Speech Synthesis Helper ---
  const speak = (text, lang = "hi-IN") => {
    if (!("speechSynthesis" in window)) return;
    const ut = new SpeechSynthesisUtterance(text);
    ut.lang = lang;
    window.speechSynthesis.cancel(); // stop any previous speech
    window.speechSynthesis.speak(ut);
  };

  // --- Speech Recognition Start / Stop ---
  const startListening = () => {
    if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) {
      alert("Speech Recognition is not supported in this browser. Please use Chrome or Edge.");
      return;
    }
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = "hi-IN"; // Supports Hindi-English mix (Hinglish)
    recognition.continuous = true;
    recognition.interimResults = false;

    recognition.onresult = (event) => {
      const transcript = event.results[event.results.length - 1][0].transcript.trim();
      setRecognizedText((prev) => (prev + " " + transcript).trim());
      handleSpeech(transcript); // Process the recognized speech
    };

    recognition.onerror = (e) => {
      console.error("Speech recognition error:", e);
      speak("Speech recognition में कुछ समस्या हुई।");
    };
    
    recognition.onend = () => {
      setListening(false);
    };

    recognition.start();
    recognitionRef.current = recognition;
    setListening(true);
    speak("Listening started. कृपया अपने आइटम और बिल की जानकारी बताइए।");
  };

  const stopListening = () => {
    recognitionRef.current?.stop();
    setListening(false);
    speak("Listening stopped.");
  };

  // --- Handle Speech by Sending to Backend API ---
  const handleSpeech = async (text) => {
    if (!text) {
      speak("माफ कीजिए, मैं समझ नहीं पाया।");
      return;
    }

    // Detect generate bill command locally
    if (/\b(bill|बिल|बनाओ|generate)\b/i.test(text)) {
      if (items.length === 0) {
        speak("आपने अभी तक कोई आइटम नहीं बताया।");
        return;
      }
      speak("बिल बना रहा हूँ।");
      generatePDF();
      return;
    }
    
    setIsLoading(true); // Start loading indicator
    speak("Processing... कृपया प्रतीक्षा करें।");

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text: text }),
      });

      if (!response.ok) {
        // Handle non-200 responses from the backend
        const errorData = await response.json();
        throw new Error(errorData.detail || "Backend server error");
      }

      const data = await response.json();
      
      // The backend now provides the full, structured list of items
      const newItems = data.items.map(item => ({
        name: item.description,
        qty: item.quantity,
        price: item.unit_price,
        total: item.quantity * item.unit_price // Recalculate on frontend for safety
      }));

      if (newItems.length > 0) {
        setItems(prevItems => [...prevItems, ...newItems]);
        const addedText = newItems.map(i => `${i.qty} ${i.name}`).join(", ");
        speak(`ठीक है, मैंने ${addedText} जोड़ दिया है।`);
      } else {
        speak("Backend से कोई आइटम नहीं मिला। कृपया दोबारा प्रयास करें।");
      }

    } catch (error) {
      console.error("API Error:", error);
      speak(`An error occurred: ${error.message}`);
    } finally {
      setIsLoading(false); // Stop loading indicator
    }
  };

  // --- PDF Generation ---
  const generatePDF = () => {
    if (items.length === 0) {
      speak("कोई आइटम नहीं है। पहले कुछ आइटम बोलें।");
      return;
    }

    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("🧾 Voice Billing Receipt", 10, 15);
    doc.setFontSize(11);
    doc.text(`Date: ${new Date().toLocaleString()}`, 10, 25);

    let y = 40;
    doc.setFontSize(11);
    doc.text("Item", 10, y);
    doc.text("Qty", 90, y);
    doc.text("Price", 120, y);
    doc.text("Total", 160, y);
    y += 6;
    doc.setLineWidth(0.5);
    doc.line(10, y, 200, y);
    y += 8;

    let totalAmount = 0;
    items.forEach((it) => {
      const name = it.name.length > 28 ? it.name.slice(0, 28) + "..." : it.name;
      doc.text(name, 10, y);
      doc.text(String(it.qty), 95, y);
      doc.text(`₹${it.price}`, 125, y);
      doc.text(`₹${it.total}`, 160, y);
      y += 8;
      totalAmount += it.total;
      if (y > 270) { doc.addPage(); y = 20; }
    });

    y += 6;
    doc.line(10, y, 200, y);
    y += 8;
    doc.setFontSize(12);
    doc.text(`Total Amount: ₹${totalAmount}`, 10, y);

    doc.save("bill.pdf");
    speak(`बिल बन गया है। कुल रकम ₹${totalAmount} रुपये है।`);
  };

  return (
    <main className="min-h-screen bg-gray-950 text-gray-100 flex flex-col items-center justify-start p-6">
      <h1 className="text-3xl font-bold mb-6">🗣️ Talking Billing Assistant</h1>

      <div className="flex gap-4 mb-4">
        {!listening && !isLoading ? (
          <button
            onClick={startListening}
            className="px-5 py-3 bg-green-600 rounded-lg font-semibold hover:bg-green-700"
          >
            🎙️ Start Talking
          </button>
        ) : (
          <button
            onClick={stopListening}
            disabled={isLoading}
            className="px-5 py-3 bg-red-600 rounded-lg font-semibold hover:bg-red-700 disabled:bg-gray-500"
          >
            {isLoading ? "Processing..." : "⏹ Stop"}
          </button>
        )}

        <button
          onClick={generatePDF}
          disabled={items.length === 0 || isLoading}
          className="px-5 py-3 bg-blue-600 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-500"
        >
          📄 Generate PDF
        </button>

        <button
          onClick={() => { setItems([]); setRecognizedText(""); speak("सब कुछ क्लियर कर दिया।"); }}
          disabled={isLoading}
          className="px-4 py-3 bg-gray-700 rounded-lg font-semibold hover:bg-gray-600 disabled:bg-gray-500"
        >
          🧹 Clear
        </button>
      </div>

      <div className="w-full max-w-xl bg-gray-900 rounded-xl p-4 border border-gray-700 mb-4">
        <h2 className="text-lg font-semibold mb-2">🗒️ Recognized Speech:</h2>
        <p className="text-gray-300 text-sm min-h-[60px]">{recognizedText || "No speech recognized yet."}</p>
      </div>

      <div className="w-full max-w-xl mt-2">
        <h2 className="text-lg font-semibold mb-2">🧾 Detected Items:</h2>
        {items.length === 0 ? (
          <p className="text-gray-400">No items detected yet. Speak your bill details to add them.</p>
        ) : (
          <table className="w-full border border-gray-700 text-sm">
            <thead className="bg-gray-800 text-gray-200">
              <tr>
                <th className="p-2 border border-gray-700 text-left">Item</th>
                <th className="p-2 border border-gray-700 text-center">Qty</th>
                <th className="p-2 border border-gray-700 text-center">Price</th>
                <th className="p-2 border border-gray-700 text-center">Total</th>
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
