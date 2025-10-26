export function useSpeechSynthesis() {
  const speak = (text, lang = "hi-IN") => {
    if (!("speechSynthesis" in window)) return;
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = lang;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utter);
  };

  return { speak };
}
