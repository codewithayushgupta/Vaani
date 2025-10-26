export default function SpeechLog({ recognizedText, customerName }) {
  return (
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
  );
}