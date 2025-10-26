import { useState, useRef, useCallback } from "react";

export function useSpeechRecognition({ onResult, onError, onEnd }) {
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef(null);
  const currentModeRef = useRef("items");
  const restartTimeoutRef = useRef(null);

  const startListening = useCallback((mode = "items") => {
    if (
      !("webkitSpeechRecognition" in window) &&
      !("SpeechRecognition" in window)
    ) {
      alert(
        "Speech Recognition not supported in this browser. Use Chrome or Edge."
      );
      return;
    }

    // Stop any existing recognition
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    // IMPROVED: Better settings for reliability
    recognition.lang = "hi-IN";
    recognition.continuous = true;
    recognition.interimResults = true; // Changed to true for faster feedback
    recognition.maxAlternatives = 1;

    currentModeRef.current = mode;

    let finalTranscript = "";
    let silenceTimer = null;

    recognition.onresult = (event) => {
      let interimTranscript = "";
      
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        
        if (event.results[i].isFinal) {
          finalTranscript += transcript + " ";
          
          // Clear any pending silence timer
          if (silenceTimer) {
            clearTimeout(silenceTimer);
          }
          
          // Send result immediately after final transcript
          if (finalTranscript.trim()) {
            onResult(finalTranscript.trim(), currentModeRef.current);
            finalTranscript = "";
          }
        } else {
          interimTranscript += transcript;
        }
      }
    };

    recognition.onerror = (e) => {
      console.error("Speech error:", e.error);
      
      // IMPROVED: Handle specific errors
      if (e.error === 'no-speech') {
        console.log("No speech detected, restarting...");
        // Don't show error for no-speech, just restart
      } else if (e.error === 'network') {
        console.error("Network error - check internet connection");
        if (onError) onError(e);
      } else if (e.error === 'not-allowed') {
        alert("Microphone permission denied. Please allow microphone access.");
        setListening(false);
        if (onError) onError(e);
        return;
      } else {
        if (onError) onError(e);
      }
    };

    recognition.onend = () => {
      console.log("Recognition ended");
      
      // IMPROVED: Auto-restart if still supposed to be listening
      if (listening && recognitionRef.current) {
        console.log("Auto-restarting recognition...");
        restartTimeoutRef.current = setTimeout(() => {
          try {
            recognitionRef.current?.start();
          } catch (err) {
            console.error("Failed to restart:", err);
            setListening(false);
          }
        }, 100);
      } else {
        setListening(false);
        if (onEnd) onEnd();
      }
    };

    try {
      recognition.start();
      recognitionRef.current = recognition;
      setListening(true);
      console.log("Recognition started in mode:", mode);
    } catch (err) {
      console.error("Failed to start recognition:", err);
      alert("Failed to start voice recognition. Please try again.");
    }
  }, [listening, onResult, onError, onEnd]);

  const stopListening = useCallback(() => {
    if (restartTimeoutRef.current) {
      clearTimeout(restartTimeoutRef.current);
    }
    
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    
    setListening(false);
  }, []);

  return {
    listening,
    startListening,
    stopListening,
    currentModeRef,
  };
}