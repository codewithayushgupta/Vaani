"use client";

import { useState, useRef } from "react";
import { jsPDF } from "jspdf";

export default function Home() {
  const [listening, setListening] = useState(false);
  const [recognizedText, setRecognizedText] = useState("");
  const [items, setItems] = useState([]);
  const recognitionRef = useRef(null);

  // --- Helpers: Hindi numbers + devnagari digits ---
  const HINDI_NUMBERS = {
    "एक": 1, "दो": 2, "तीन": 3, "चार": 4, "पांच": 5, "छह": 6, "सात": 7,
    "आठ": 8, "नौ": 9, "दस": 10, "ग्यारह": 11, "बारह": 12, "तेरह": 13,
    "चौदह": 14, "पंद्रह": 15, "सोलह": 16, "सत्रह": 17, "अठारह": 18,
    "उन्नीस": 19, "बीस": 20, "तीस": 30, "चालीस": 40, "पचास": 50,
    "साठ": 60, "सत्तर": 70, "अस्सी": 80, "नब्बे": 90, "सौ": 100
  };

  const DEVNAGARI_DIGITS = {
    "०":"0","१":"1","२":"2","३":"3","४":"4","५":"5","६":"6","७":"7","८":"8","९":"9"
  };

  const replaceDevanagariDigits = (s) => {
    return s.replace(/[०१२३४५६७८९]/g, d => DEVNAGARI_DIGITS[d] || d);
  };

  const replaceHindiWordsWithDigits = (s) => {
    let t = s;
    for (const [word, num] of Object.entries(HINDI_NUMBERS)) {
      const re = new RegExp(`\\b${word}\\b`, "gi");
      t = t.replace(re, String(num));
    }
    return t;
  };

  const normalizeText = (raw) => {
    if (!raw) return "";
    let t = raw.toString();
    t = replaceDevanagariDigits(t);
    t = replaceHindiWordsWithDigits(t);
    // replace currency symbols and commas with spaces
    t = t.replace(/[₹,]/g, " ");
    // collapse multiple spaces
    t = t.replace(/\s+/g, " ").trim();
    return t;
  };

  // Speak helper
  const speak = (text, lang = "hi-IN") => {
    if (!("speechSynthesis" in window)) return;
    const ut = new SpeechSynthesisUtterance(text);
    ut.lang = lang;
    window.speechSynthesis.cancel(); // stop any previous
    window.speechSynthesis.speak(ut);
  };

  // Start / stop listening
  const startListening = () => {
    if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) {
      alert("Speech Recognition not supported in this browser. Use Chrome or Edge.");
      return;
    }
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = "hi-IN"; // supports Hindi-English mix
    recognition.continuous = true;
    recognition.interimResults = false;

    recognition.onresult = (event) => {
      const transcript = event.results[event.results.length - 1][0].transcript.trim();
      setRecognizedText((prev) => (prev + " " + transcript).trim());
      handleSpeech(transcript);
    };

    recognition.onerror = (e) => {
      console.error("Speech error:", e);
    };

    recognition.onend = () => {
      // keep UI consistent
      setListening(false);
    };

    recognition.start();
    recognitionRef.current = recognition;
    setListening(true);
    speak("Listening started. कृपया अपने आइटम बताइए।");
  };

  const stopListening = () => {
    recognitionRef.current?.stop();
    setListening(false);
    speak("Listening stopped.");
  };

  // --- Improved parsing logic ---
const parseSpeech = (text) => {
  const normalized = normalizeText(text);
  if (!normalized) return [];

  const results = [];
  const seen = new Set();

  // join accidental merged numbers: "2050 मोबाइल" → "20 50 मोबाइल"
  let fixed = normalized.replace(/(\d{2,})(?=\s*[a-zA-Z\u0900-\u097F])/g, (m) => {
    // try to split long digit string in half if plausible
    if (m.length >= 4) {
      const mid = Math.floor(m.length / 2);
      return m.slice(0, mid) + " " + m.slice(mid);
    }
    return m;
  });

  // split into clauses
  const phrases = fixed.split(/[,|और|plus|add|\band\b]/i).map(p => p.trim()).filter(Boolean);

  for (let phrase of phrases) {
    // unify ₹ spacing
    phrase = phrase.replace(/₹\s*/g, "₹");
    // 1️⃣ qty name price  (50 मोबाइल 20)
    let m = phrase.match(/^\s*(\d+)\s+([^\d₹]+?)\s*(?:₹)?\s*(\d+)\s*$/);
    if (m) {
      const name = cleanName(m[2]);
      const qty = parseInt(m[1]) || 1;
      const price = parseInt(m[3]) || 0;
      if (name && price > 0) {
        const key = `${name}|${qty}|${price}`;
        if (!seen.has(key)) {
          seen.add(key);
          results.push({ name, qty, price, total: qty * price });
        }
      }
      continue;
    }

    // 2️⃣ name qty price (मोबाइल 50 20)
    m = phrase.match(/^\s*([^\d₹]+?)\s+(\d+)\s+(?:₹)?\s*(\d+)\s*$/);
    if (m) {
      const name = cleanName(m[1]);
      const qty = parseInt(m[2]) || 1;
      const price = parseInt(m[3]) || 0;
      const key = `${name}|${qty}|${price}`;
      if (!seen.has(key)) {
        seen.add(key);
        results.push({ name, qty, price, total: qty * price });
      }
      continue;
    }

    // 3️⃣ name price (default qty=1)
    m = phrase.match(/^\s*([^\d₹]+?)\s*(?:₹)?\s*(\d+)\s*$/);
    if (m) {
      const name = cleanName(m[1]);
      const price = parseInt(m[2]) || 0;
      const key = `${name}|1|${price}`;
      if (!seen.has(key)) {
        seen.add(key);
        results.push({ name, qty: 1, price, total: price });
      }
    }
  }

  return results;
};

  // remove filler words and trim name
  const cleanName = (rawName) => {
    if (!rawName) return "";
    let n = rawName.toString().trim();
    // common filler words to remove
    n = n.replace(/\b(सिर्फ|के|के लिए|के लिये|only|sirf)\b/gi, "");
    // trailing/leading numeric remnants
    n = n.replace(/\b\d+\b/g, "").replace(/\s+/g, " ").trim();
    return n;
  };

  // handle speech (commands + items)
  const handleSpeech = (text) => {
    const cleaned = normalizeText(text);
    if (!cleaned) {
      speak("माफ कीजिए, मैं समझ नहीं पाया। कृपया दोबारा बताएं।");
      return;
    }

    // detect generate bill command
    if (/\b(bill|बिल|बनाओ|generate)\b/i.test(cleaned)) {
      if (items.length === 0) {
        speak("आपने अभी तक कोई आइटम नहीं बताया।");
        return;
      }
      speak("बिल बना रहा हूँ।");
      generatePDF();
      return;
    }

    const newItems = parseSpeech(cleaned);
    if (newItems.length > 0) {
      setItems((prev) => [...prev, ...newItems]);
      const added = newItems.map(i => `${i.qty} ${i.name} ₹${i.price}`).join(", ");
      speak(`ठीक है, मैंने ${added} जोड़ दिया है।`);
    } else {
      speak("माफ कीजिए, मैं समझ नहीं पाया। कृपया दोबारा बताएं।");
    }
  };

  // --- PDF generation ---
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
      if (y > 270) { doc.addPage(); y = 20; } // handle page overflow
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
        {!listening ? (
          <button
            onClick={startListening}
            className="px-5 py-3 bg-green-600 rounded-lg font-semibold hover:bg-green-700"
          >
            🎙️ Start Talking
          </button>
        ) : (
          <button
            onClick={stopListening}
            className="px-5 py-3 bg-red-600 rounded-lg font-semibold hover:bg-red-700"
          >
            ⏹ Stop
          </button>
        )}

        <button
          onClick={() => {
            if (items.length === 0) speak("कोई आइटम नहीं है। पहले बोलें।");
            else generatePDF();
          }}
          className="px-5 py-3 bg-blue-600 rounded-lg font-semibold hover:bg-blue-700"
        >
          📄 Generate PDF
        </button>

        <button
          onClick={() => { setItems([]); setRecognizedText(""); speak("क्लियर कर दिया।"); }}
          className="px-4 py-3 bg-gray-700 rounded-lg font-semibold hover:bg-gray-600"
        >
          🧹 Clear
        </button>
      </div>

      <div className="w-full max-w-xl bg-gray-900 rounded-xl p-4 border border-gray-700 mb-4">
        <h2 className="text-lg font-semibold mb-2">🗒️ Recognized Speech:</h2>
        <p className="text-gray-300 text-sm min-h-[60px]">{recognizedText || "No speech yet."}</p>
      </div>

      <div className="w-full max-w-xl mt-2">
        <h2 className="text-lg font-semibold mb-2">🧾 Detected Items:</h2>
        {items.length === 0 ? (
          <p className="text-gray-400">No items yet. Speak your bill details.</p>
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
