import ItemRow from "./ItemRow";

export default function ItemsTable({ 
  items, 
  editingIndex, 
  editFormData, 
  onStartEdit, 
  onCancelEdit, 
  onEditChange, 
  onSaveEdit, 
  onDeleteItem 
}) {
  if (items.length === 0) {
    return (
      <p className="text-gray-400">No items yet. Speak your bill details.</p>
    );
  }

  return (
    <table className="w-full border border-gray-700 text-sm">
      <thead className="bg-gray-800 text-gray-200">
        <tr>
          <th className="p-2 border border-gray-700 text-left">Item</th>
          <th className="p-2 border border-gray-700 text-center">Qty</th>
          <th className="p-2 border border-gray-700 text-center">Price</th>
          <th className="p-2 border border-gray-700 text-center">Total</th>
          <th className="p-2 border border-gray-700 text-center">Actions</th>
        </tr>
      </thead>
      <tbody>
        {items.map((item, idx) => (
          <ItemRow
            key={idx}
            item={item}
            index={idx}
            isEditing={editingIndex === idx}
            editFormData={editFormData}
            onStartEdit={onStartEdit}
            onCancelEdit={onCancelEdit}
            onEditChange={onEditChange}
            onSaveEdit={onSaveEdit}
            onDelete={onDeleteItem}
          />
        ))}
      </tbody>
    </table>
  );
}
