export default function BillingControls({ 
  listening, 
  onCreateBill, 
  onStartListening, 
  onStopListening, 
  onGeneratePDF, 
  onClear 
}) {
  return (
    <div className="flex gap-4 mb-4">
      <button
        onClick={onCreateBill}
        className="px-5 py-3 bg-indigo-600 rounded-lg font-semibold hover:bg-indigo-700"
      >
        ➕ Create Bill
      </button>

      {!listening ? (
        <button
          onClick={onStartListening}
          className="px-5 py-3 bg-green-600 rounded-lg font-semibold hover:bg-green-700"
        >
          🎙️ Start Talking
        </button>
      ) : (
        <button
          onClick={onStopListening}
          className="px-5 py-3 bg-red-600 rounded-lg font-semibold hover:bg-red-700"
        >
          ⏹ Stop
        </button>
      )}

      <button
        onClick={onGeneratePDF}
        className="px-5 py-3 bg-blue-600 rounded-lg font-semibold hover:bg-blue-700"
      >
        📄 Generate PDF
      </button>

      <button
        onClick={onClear}
        className="px-4 py-3 bg-gray-700 rounded-lg font-semibold hover:bg-gray-600"
      >
        🧹 Clear
      </button>
    </div>
  );
}