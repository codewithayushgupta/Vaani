"use client";
import { useState, useRef, useEffect } from "react";
import { jsPDF } from "jspdf";

export default function Home() {
  const [listening, setListening] = useState(false);
  const [recognizedText, setRecognizedText] = useState("");
  const [items, setItems] = useState([]);
  const itemsRef = useRef([]);
  const recognitionRef = useRef(null);

  // --- New: customer name and flow state ---
  const [customerName, setCustomerName] = useState("");
  const [hasStartedBillFlow, setHasStartedBillFlow] = useState(false);
  const currentModeRef = useRef("items"); // "name" | "items"

  // --- State for inline editing ---
  const [editingIndex, setEditingIndex] = useState(null);
  const [editFormData, setEditFormData] = useState({
    name: "",
    qty: 0,
    price: 0,
  });

  // --- State for debouncing speech ---
  const [speechBuffer, setSpeechBuffer] = useState("");
  const parseTimerRef = useRef(null);

  // --- Keep itemsRef always up to date ---
  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  // --- Speak helper ---
  const speak = (text, lang = "hi-IN") => {
    if (!("speechSynthesis" in window)) return;
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = lang;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utter);
  };

  // --- Start / Stop listening (accepts mode) ---
  const startListening = (mode = "items") => {
    if (
      !("webkitSpeechRecognition" in window) &&
      !("SpeechRecognition" in window)
    ) {
      alert(
        "Speech Recognition not supported in this browser. Use Chrome or Edge."
      );
      return;
    }

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = "hi-IN";
    recognition.continuous = true;
    recognition.interimResults = false;

    currentModeRef.current = mode;

    recognition.onresult = (event) => {
      const transcript =
        event.results[event.results.length - 1][0].transcript.trim();

      // Append to full log
      setRecognizedText((prev) => (prev + " " + transcript).trim());

      // If we're in name mode, handle immediately (no debounce)
      if (currentModeRef.current === "name") {
        handleNameSpeech(transcript);
        return;
      }

      // items mode -> keep debounced buffer
      setSpeechBuffer((prevBuffer) => {
        const newBuffer = (prevBuffer + " " + transcript).trim();
        if (parseTimerRef.current) {
          clearTimeout(parseTimerRef.current);
        }
        parseTimerRef.current = setTimeout(() => {
          if (newBuffer.length > 0) {
            handleSpeech(newBuffer);
            setSpeechBuffer("");
          }
        }, 1500);
        return newBuffer;
      });
    };

    recognition.onerror = (e) => console.error("Speech error:", e);
    recognition.onend = () => setListening(false);

    recognition.start();
    recognitionRef.current = recognition;
    setListening(true);
  };

  const stopListening = () => {
    recognitionRef.current?.stop();
    setListening(false);
    if (parseTimerRef.current) {
      clearTimeout(parseTimerRef.current);
    }
    if (speechBuffer.length > 0) {
      // flush final buffer to parse into items
      handleSpeech(speechBuffer);
    }
    setSpeechBuffer("");
    speak("Listening stopped.");
  };

  // --- Handle name-specific speech (first step) ---
  const handleNameSpeech = async (text) => {
    const cleaned = text.trim();
    if (!cleaned) return;

    try {
      const res = await fetch("/api/name-detect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: cleaned }),
      });
      const data = await res.json();
      const detectedName = (data.name || "").trim();

      if (detectedName) {
        setCustomerName(detectedName);
        speak(`ठीक है, ग्राहक का नाम ${detectedName} रिकॉर्ड कर लिया गया है।`);
      } else {
        // As requested: if name not found, return blank and move on
        setCustomerName("");
        speak("नाम नहीं मिला — आगे बढ़ते हैं।");
      }

      // Move to item collection step
      currentModeRef.current = "items";
      speak("कृपया अपने आइटम बताइए।");
    } catch (err) {
      console.error("Name detection error:", err);
      speak("नाम पता करने में त्रुटि हुई — कृपया आगे आइटम बताइए।");
      currentModeRef.current = "items";
      speak("कृपया अपने आइटम बताइए।");
    }
  };

  // --- Handle speech input for items ---
  const handleSpeech = async (text) => {
    const cleaned = text.trim();
    if (!cleaned) return;

    if (/\b(bill|बिल|बनाओ|generate)\b/i.test(cleaned)) {
      if (items.length === 0) {
        speak("आपने अभी तक कोई आइटम नहीं बताया।");
        return;
      }
      speak("बिल बना रहा हूँ।");
      generatePDF();
      return;
    }

    try {
      const res = await fetch("/api/parse-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: cleaned }),
      });

      const data = await res.json();
      const { intent = "other", items: aiItems = [] } = data;

      console.log("AI Parsed Data:", data);

      // ADD ITEM intent (improved logic)
      if (intent === "add_item") {
        const validItems = aiItems.filter((i) => {
          if (!i.name) return false;

          const qtyValid =
            i.quantity !== undefined &&
            i.quantity !== null &&
            !isNaN(Number(i.quantity)) &&
            Number(i.quantity) > 0;

          const rateValid =
            i.rate !== undefined &&
            i.rate !== null &&
            !isNaN(Number(i.rate)) &&
            Number(i.rate) > 0;

          // Only accept if both quantity and rate are valid
          return qtyValid && rateValid;
        });

        if (validItems.length > 0) {
          setItems((prev) => [
            ...prev,
            ...validItems.map((i) => ({
              name: i.name,
              qty: Number(i.quantity),
              price: Number(i.rate),
              total: Number(i.quantity) * Number(i.rate),
            })),
          ]);

          const added = validItems.map((i) => `${i.name}`).join(", ");
          speak(`${added} जोड़ दिया गया है।`);
        } else {
          speak("कृपया मात्रा और कीमत दोनों बताएं।");
        }
        return;
      }

      // DELETE ITEM intent
      if (intent === "delete_item") {
        const namesToDelete = aiItems.map((i) => i.name).filter(Boolean);
        if (namesToDelete.length === 0) {
          speak("कौन सा आइटम हटाना है?");
          return;
        }

        setItems((prev) =>
          prev.filter(
            (it) =>
              !namesToDelete.some((del) =>
                it.name.toLowerCase().includes(del.toLowerCase())
              )
          )
        );

        speak(`${namesToDelete.join(", ")} हटा दिया गया है।`);
        return;
      }

      //  UPDATE ITEM intent (unchanged)
      if (intent === "update_item") {
        if (aiItems.length === 0) {
          speak("कौन सा आइटम अपडेट करना है?");
          return;
        }

        let foundMatch = false;
        setItems((prev) => {
          const updatedList = prev.map((it) => {
            const match = aiItems.find(
              (a) =>
                a.name && it.name.toLowerCase().includes(a.name.toLowerCase())
            );
            if (!match) return it;

            foundMatch = true;

            const qtyProvided =
              match.quantity !== undefined &&
              match.quantity !== null &&
              !isNaN(Number(match.quantity)) &&
              Number(match.quantity) > 0;
            const newQty = qtyProvided
              ? Number(match.quantity)
              : Number(it.qty);

            const rateProvided =
              match.rate !== undefined &&
              match.rate !== null &&
              !isNaN(Number(match.rate)) &&
              Number(match.rate) > 0;
            const newRate = rateProvided
              ? Number(match.rate)
              : Number(it.price);

            return {
              ...it,
              qty: newQty,
              price: newRate,
              total: newQty * newRate,
            };
          });

          if (foundMatch) speak("आइटम अपडेट कर दिया गया है।");
          else speak("कोई मेल खाता आइटम नहीं मिला।");

          return updatedList;
        });
        return;
      }

      // GENERATE BILL intent (fixed with ref)
      if (intent === "generate_bill") {
        const currentItems = itemsRef.current;

        if (!currentItems || currentItems.length === 0) {
          speak("अभी तक कोई आइटम नहीं जोड़ा गया है।");
        } else {
          speak("बिल बना रहा हूँ।");
          generatePDF();
        }
        return;
      }

      // OTHER intent
      speak("मैंने समझा नहीं, कृपया दोबारा कहें।");
    } catch (err) {
      console.error("parse-ai error:", err);
      speak("आइटम पढ़ने में त्रुटि हुई। दुबारा बोलें।");
    }
  };

  // --- Generate PDF ---
  const generatePDF = () => {
    const currentItems = itemsRef.current;
    if (!currentItems || currentItems.length === 0) {
      speak("कोई आइटम नहीं है। पहले कुछ आइटम बोलें।");
      return;
    }
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("🧾 Voice Billing Receipt", 10, 15);
    doc.setFontSize(11);
    doc.text(`Date: ${new Date().toLocaleString()}`, 10, 25);
    if (customerName) doc.text(`Customer: ${customerName}`, 10, 32);
    let y = 44;
    doc.text("Item", 10, y);
    doc.text("Qty", 90, y);
    doc.text("Price", 120, y);
    doc.text("Total", 160, y);
    y += 6;
    doc.line(10, y, 200, y);
    y += 8;
    let totalAmount = 0;
    currentItems.forEach((it) => {
      const name = it.name.length > 28 ? it.name.slice(0, 28) + "..." : it.name;
      doc.text(name, 10, y);
      doc.text(String(it.qty), 95, y);
      doc.text(`₹${it.price}`, 125, y);
      doc.text(`₹${it.total}`, 160, y);
      y += 8;
      totalAmount += it.total;
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
    speak(`बिल बन गया है। कुल रकम ₹${totalAmount} रुपये है।`);
  };

  // --- Item Edit/Delete Handlers ---
  const handleStartEdit = (index) => {
    setEditingIndex(index);
    setEditFormData(items[index]);
  };
  const handleCancelEdit = () => {
    setEditingIndex(null);
  };
  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditFormData((prev) => ({ ...prev, [name]: value }));
  };
  const handleSaveEdit = (index) => {
    const { name, qty, price } = editFormData;
    const numQty = parseFloat(qty);
    const numPrice = parseFloat(price);
    if (
      !name ||
      isNaN(numQty) ||
      isNaN(numPrice) ||
      numQty <= 0 ||
      numPrice < 0
    ) {
      speak("अमान्य डेटा। कृपया दोबारा जांच लें।");
      return;
    }
    setItems((prevItems) => {
      const updatedItems = [...prevItems];
      updatedItems[index] = {
        name,
        qty: numQty,
        price: numPrice,
        total: numQty * numPrice,
      };
      return updatedItems;
    });
    setEditingIndex(null);
    speak("आइटम अपडेट हो गया।");
  };
  const handleDeleteItem = (index) => {
    setItems((prevItems) => prevItems.filter((_, i) => i !== index));
    speak("आइटम हटा दिया।");
  };

  // --- New: Create Bill flow ---
  const handleCreateBill = () => {
    if (!hasStartedBillFlow) {
      // first time: ask for customer name
      setHasStartedBillFlow(true);
      speak("नमस्कार, बिल बनाने के लिए ग्राहक का नाम बताइए।");
      // start listening in name mode
      startListening("name");
    } else {
      // If already started, just ensure we are listening for items
      speak("कृपया अपने आइटम बताइए।");
      if (!listening) startListening("items");
    }
  };

  return (
    <main className="min-h-screen bg-gray-950 text-gray-100 flex flex-col items-center justify-start p-6">
      <h1 className="text-3xl font-bold mb-6">🗣️ Talking Billing Assistant</h1>
      <div className="flex gap-4 mb-4">
        <button
          onClick={handleCreateBill}
          className="px-5 py-3 bg-indigo-600 rounded-lg font-semibold hover:bg-indigo-700"
        >
          ➕ Create Bill
        </button>

        {!listening ? (
          <button
            onClick={() => startListening("items")}
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
          onClick={generatePDF}
          className="px-5 py-3 bg-blue-600 rounded-lg font-semibold hover:bg-blue-700"
        >
          📄 Generate PDF
        </button>

        <button
          onClick={() => {
            setItems([]);
            setRecognizedText("");
            setCustomerName("");
            setHasStartedBillFlow(false);
            currentModeRef.current = "items";
            if (parseTimerRef.current) clearTimeout(parseTimerRef.current);
            setSpeechBuffer("");
            speak("क्लियर कर दिया।");
          }}
          className="px-4 py-3 bg-gray-700 rounded-lg font-semibold hover:bg-gray-600"
        >
          🧹 Clear
        </button>
      </div>

      <div className="w-full max-w-xl bg-gray-900 rounded-xl p-4 border border-gray-700 mb-4">
        <h2 className="text-lg font-semibold mb-2">🗒️ Full Speech Log:</h2>
        <p className="text-gray-300 text-sm min-h-[60px]">
          {recognizedText || "No speech yet."}
        </p>
        <p className="text-sm text-gray-400 mt-2">
          Customer:{" "}
          <span className="text-yellow-300">
            {customerName || "— (not set)"}
          </span>
        </p>
      </div>

      <div className="w-full max-w-xl bg-gray-800 rounded-xl p-4 border border-gray-600 mb-4">
        <h2 className="text-sm font-semibold mb-2 text-yellow-400">
          🧠 AI Buffer (What will be parsed next):
        </h2>
        <p className="text-gray-200 text-sm min-h-[20px] italic">
          {speechBuffer || "Waiting for 2s pause..."}
        </p>
      </div>

      <div className="w-full max-w-xl mt-2">
        <h2 className="text-lg font-semibold mb-2">🧾 Detected Items:</h2>
        {items.length === 0 ? (
          <p className="text-gray-400">
            No items yet. Speak your bill details.
          </p>
        ) : (
          <table className="w-full border border-gray-700 text-sm">
            <thead className="bg-gray-800 text-gray-200">
              <tr>
                <th className="p-2 border border-gray-700 text-left">Item</th>
                <th className="p-2 border border-gray-700 text-center">Qty</th>
                <th className="p-2 border border-gray-700 text-center">
                  Price
                </th>
                <th className="p-2 border border-gray-700 text-center">
                  Total
                </th>
                <th className="p-2 border border-gray-700 text-center">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {items.map((it, idx) =>
                editingIndex === idx ? (
                  <tr key={idx}>
                    <td className="p-1 border border-gray-700">
                      <input
                        type="text"
                        name="name"
                        value={editFormData.name}
                        onChange={handleEditChange}
                        className="w-full bg-gray-700 text-white p-1 rounded"
                      />
                    </td>
                    <td className="p-1 border border-gray-700 text-center">
                      <input
                        type="number"
                        name="qty"
                        value={editFormData.qty}
                        onChange={handleEditChange}
                        className="w-16 bg-gray-700 text-white p-1 rounded"
                      />
                    </td>
                    <td className="p-1 border border-gray-700 text-center">
                      <input
                        type="number"
                        name="price"
                        value={editFormData.price}
                        onChange={handleEditChange}
                        className="w-20 bg-gray-700 text-white p-1 rounded"
                      />
                    </td>
                    <td className="p-2 border border-gray-700 text-center">
                      ₹
                      {parseFloat(editFormData.qty) *
                        parseFloat(editFormData.price) || 0}
                    </td>
                    <td className="p-1 border border-gray-700 text-center">
                      <button
                        onClick={() => handleSaveEdit(idx)}
                        className="px-2 py-1 text-green-400 hover:text-green-300"
                        title="Save"
                      >
                        ✔️
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        className="px-2 py-1 text-gray-400 hover:text-gray-300"
                        title="Cancel"
                      >
                        ❌
                      </button>
                    </td>
                  </tr>
                ) : (
                  <tr key={idx}>
                    <td className="p-2 border border-gray-700">{it.name}</td>
                    <td className="p-2 border border-gray-700 text-center">
                      {it.qty}
                    </td>
                    <td className="p-2 border border-gray-700 text-center">
                      ₹{it.price}
                    </td>
                    <td className="p-2 border border-gray-700 text-center">
                      ₹{it.total}
                    </td>
                    <td className="p-2 border border-gray-700 text-center">
                      <button
                        onClick={() => handleStartEdit(idx)}
                        className="px-2 py-1 text-yellow-400 hover:text-yellow-300"
                        title="Edit"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => handleDeleteItem(idx)}
                        className="px-2 py-1 text-red-400 hover:text-red-300"
                        title="Delete"
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        )}
      </div>
    </main>
  );
}
