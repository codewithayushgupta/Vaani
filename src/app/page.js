"use client";
import { useState } from "react";
import BillingControls from "@/app/components/BillingControls";
import SpeechLog from "@/app/components/SpeechLog";
import SpeechBuffer from "@/app/components/SpeechBuffer";
import ItemsTable from "@/app/components/ItemsTable";
import { useSpeechSynthesis } from "@/app/hooks/useSpeechSynthesis";
import { useSpeechRecognition } from "@/app/hooks/useSpeechRecognition";
import { useBillFlow } from "@/app/hooks/useBillFlow";
import { useItemManagement } from "@/app/hooks/useItemManagement";
import { useItemEdit } from "@/app/hooks/useItemEdit";
import { generateBillPDF } from "@/app/utils/pdfGenerator";
import { handleNameSpeech, handleItemSpeech } from "@/app/services/speechHandlers";

export default function Home() {
  const [customerName, setCustomerName] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const { speak } = useSpeechSynthesis();

  const {
    hasStartedBillFlow,
    setHasStartedBillFlow,
    speechBuffer,
    recognizedText,
    appendToRecognizedText,
    updateSpeechBuffer,
    clearBuffer,
    resetFlow,
    parseTimerRef,
  } = useBillFlow();

  const {
    items,
    setItems,
    itemsRef,
    handleAddItems,
    handleDeleteItems,
    handleUpdateItems,
    clearItems,
  } = useItemManagement();

  const {
    editingIndex,
    editFormData,
    handleStartEdit,
    handleCancelEdit,
    handleEditChange,
    handleSaveEdit,
    handleDeleteItem,
  } = useItemEdit(items, setItems, speak);

  const handleSpeechResult = (transcript, mode) => {
    appendToRecognizedText(transcript);

    if (mode === "name") {
      if (parseTimerRef.current) {
        clearTimeout(parseTimerRef.current);
      }
      handleNameSpeech(transcript, {
        setCustomerName,
        speak,
        setCurrentMode: (mode) => {
          currentModeRef.current = mode;
        },
        setIsProcessing,
      });
      return;
    }

    updateSpeechBuffer(transcript, (buffer) => {
      handleItemSpeech(buffer, itemsRef.current, {
        speak,
        setIsProcessing,
        handleGeneratePDF: handleGeneratePDFWrapper,
        itemHandlers: {
          handleAddItems,
          handleDeleteItems,
          handleUpdateItems,
        },
      });
    });
  };

  const { listening, startListening, stopListening, currentModeRef } =
    useSpeechRecognition({
      onResult: handleSpeechResult,
      onEnd: () => {
        console.log("Speech recognition ended");
      },
    });

  const handleGeneratePDFWrapper = () => {
    const currentItems = itemsRef.current;
    if (!currentItems || currentItems.length === 0) {
      speak("कोई आइटम नहीं है। पहले कुछ आइटम बोलें।");
      return;
    }

    const totalAmount = generateBillPDF(currentItems, customerName);
    if (totalAmount !== null) {
      speak(`बिल बन गया है। कुल रकम ₹${totalAmount} रुपये है।`);
    }
  };

  const handleCreateBill = () => {
    if (!hasStartedBillFlow) {
      setHasStartedBillFlow(true);
      speak("नमस्कार, बिल बनाने के लिए ग्राहक का नाम बताइए।");
      startListening("name");
    } else {
      speak("कृपया अपने आइटम बताइए।");
      if (!listening) startListening("items");
    }
  };

  const handleStopListening = () => {
    stopListening();
    clearBuffer();
    if (speechBuffer.length > 0) {
      handleItemSpeech(speechBuffer, itemsRef.current, {
        speak,
        setIsProcessing,
        handleGeneratePDF: handleGeneratePDFWrapper,
        itemHandlers: {
          handleAddItems,
          handleDeleteItems,
          handleUpdateItems,
        },
      });
    }
  };

  const handleClear = () => {
    clearItems();
    setCustomerName("");
    resetFlow();
    currentModeRef.current = "items";
    setIsProcessing(false);
    speak("क्लियर कर दिया।");
  };

  return (
    <main className="min-h-screen bg-gray-950 text-gray-100 flex flex-col items-center justify-start p-6">
      <h1 className="text-3xl font-bold mb-6">🗣️ Talking Billing Assistant</h1>

      {isProcessing && (
        <div className="mb-4 px-4 py-2 bg-yellow-600 text-white rounded-lg flex items-center gap-2">
          <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
          <span>Processing...</span>
        </div>
      )}

      {listening && (
        <div className="mb-4 px-4 py-2 bg-green-600 text-white rounded-lg flex items-center gap-2">
          <div className="animate-pulse h-3 w-3 bg-white rounded-full"></div>
          <span>Listening... Speak now</span>
        </div>
      )}

      <BillingControls
        listening={listening}
        onCreateBill={handleCreateBill}
        onStartListening={() => startListening("items")}
        onStopListening={handleStopListening}
        onGeneratePDF={handleGeneratePDFWrapper}
        onClear={handleClear}
      />

      <SpeechLog recognizedText={recognizedText} customerName={customerName} />
      <SpeechBuffer speechBuffer={speechBuffer} />

      <div className="w-full max-w-xl mt-2">
        <h2 className="text-lg font-semibold mb-2">🧾 Detected Items:</h2>
        <ItemsTable
          items={items}
          editingIndex={editingIndex}
          editFormData={editFormData}
          onStartEdit={handleStartEdit}
          onCancelEdit={handleCancelEdit}
          onEditChange={handleEditChange}
          onSaveEdit={handleSaveEdit}
          onDeleteItem={handleDeleteItem}
        />
      </div>
    </main>
  );
}