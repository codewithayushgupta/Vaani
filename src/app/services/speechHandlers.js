import { detectCustomerName, parseItemsWithAI } from "@/app/utils/apiHelpers";

export async function handleNameSpeech(text, callbacks) {
  const { setCustomerName, speak, setCurrentMode, setIsProcessing } = callbacks;
  const cleaned = text.trim();
  if (!cleaned) return;

  setIsProcessing(true);

  try {
    const detectedName = await detectCustomerName(cleaned);

    if (detectedName) {
      setCustomerName(detectedName);
      speak(`ठीक है, ग्राहक का नाम ${detectedName} रिकॉर्ड कर लिया गया है।`);
    } else {
      setCustomerName("");
      speak("नाम नहीं मिला — आगे बढ़ते हैं।");
    }

    setCurrentMode("items");
    speak("कृपया अपने आइटम बताइए।");
  } catch (err) {
    console.error("Name detection error:", err);
    speak("नाम पता करने में त्रुटि हुई — कृपया आगे आइटम बताइए।");
    setCurrentMode("items");
  } finally {
    setIsProcessing(false);
  }
}

export async function handleItemSpeech(text, items, callbacks) {
  const { speak, setIsProcessing, handleGeneratePDF, itemHandlers } = callbacks;
  const cleaned = text.trim();
  if (!cleaned) return;

  // Check for bill generation command
  if (/\b(bill|बिल|बनाओ|generate)\b/i.test(cleaned)) {
    if (items.length === 0) {
      speak("आपने अभी तक कोई आइटम नहीं बताया।");
      return;
    }
    speak("बिल बना रहा हूँ।");
    handleGeneratePDF();
    return;
  }

  setIsProcessing(true);

  try {
    const data = await parseItemsWithAI(cleaned);
    const { intent = "other", items: aiItems = [] } = data;

    console.log("AI Parsed Data:", data);

    switch (intent) {
      case "add_item":
        itemHandlers.handleAddItems(aiItems, speak);
        break;
      case "delete_item":
        itemHandlers.handleDeleteItems(aiItems, speak);
        break;
      case "update_item":
        itemHandlers.handleUpdateItems(aiItems, speak);
        break;
      case "generate_bill":
        if (!items || items.length === 0) {
          speak("अभी तक कोई आइटम नहीं जोड़ा गया है।");
        } else {
          speak("बिल बना रहा हूँ।");
          handleGeneratePDF();
        }
        break;
      default:
        speak("मैंने समझा नहीं, कृपया दोबारा कहें।");
    }
  } catch (err) {
    console.error("parse-ai error:", err);
    speak("आइटम पढ़ने में त्रुटि हुई। दुबारा बोलें।");
  } finally {
    setIsProcessing(false);
  }
}