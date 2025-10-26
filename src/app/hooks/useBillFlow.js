import { useState, useRef, useCallback } from "react";

export function useBillFlow() {
  const [hasStartedBillFlow, setHasStartedBillFlow] = useState(false);
  const [speechBuffer, setSpeechBuffer] = useState("");
  const [recognizedText, setRecognizedText] = useState("");
  const parseTimerRef = useRef(null);

  const appendToRecognizedText = useCallback((text) => {
    setRecognizedText((prev) => {
      const newText = prev ? `${prev} ${text}` : text;
      return newText.trim();
    });
  }, []);

  const updateSpeechBuffer = useCallback((text, callback, delay = 1000) => {
    setSpeechBuffer((prevBuffer) => {
      const newBuffer = prevBuffer ? `${prevBuffer} ${text}` : text;

      if (parseTimerRef.current) {
        clearTimeout(parseTimerRef.current);
      }

      parseTimerRef.current = setTimeout(() => {
        if (newBuffer.trim().length > 0) {
          callback(newBuffer.trim());
          setSpeechBuffer("");
        }
      }, delay);

      return newBuffer.trim();
    });
  }, []);

  const clearBuffer = useCallback(() => {
    if (parseTimerRef.current) {
      clearTimeout(parseTimerRef.current);
    }
    setSpeechBuffer("");
  }, []);

  const resetFlow = useCallback(() => {
    setHasStartedBillFlow(false);
    setRecognizedText("");
    clearBuffer();
  }, [clearBuffer]);

  return {
    hasStartedBillFlow,
    setHasStartedBillFlow,
    speechBuffer,
    setSpeechBuffer,
    recognizedText,
    appendToRecognizedText,
    updateSpeechBuffer,
    clearBuffer,
    resetFlow,
    parseTimerRef,
  };
}