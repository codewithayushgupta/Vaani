export default function SpeechBuffer({ speechBuffer }) {
  return (
    <div className="w-full max-w-xl bg-gray-800 rounded-xl p-4 border border-gray-600 mb-4">
      <h2 className="text-sm font-semibold mb-2 text-yellow-400">
        🧠 AI Buffer (What will be parsed next):
      </h2>
      <p className="text-gray-200 text-sm min-h-[20px] italic">
        {speechBuffer || "Waiting for 2s pause..."}
      </p>
    </div>
  );
}