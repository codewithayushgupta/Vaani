export default function ItemRow({ 
  item, 
  index, 
  isEditing, 
  editFormData, 
  onStartEdit, 
  onCancelEdit, 
  onEditChange, 
  onSaveEdit, 
  onDelete 
}) {
  if (isEditing) {
    return (
      <tr>
        <td className="p-1 border border-gray-700">
          <input
            type="text"
            name="name"
            value={editFormData.name}
            onChange={onEditChange}
            className="w-full bg-gray-700 text-white p-1 rounded"
          />
        </td>
        <td className="p-1 border border-gray-700 text-center">
          <input
            type="number"
            name="qty"
            value={editFormData.qty}
            onChange={onEditChange}
            className="w-16 bg-gray-700 text-white p-1 rounded"
          />
        </td>
        <td className="p-1 border border-gray-700 text-center">
          <input
            type="number"
            name="price"
            value={editFormData.price}
            onChange={onEditChange}
            className="w-20 bg-gray-700 text-white p-1 rounded"
          />
        </td>
        <td className="p-2 border border-gray-700 text-center">
          ₹{parseFloat(editFormData.qty) * parseFloat(editFormData.price) || 0}
        </td>
        <td className="p-1 border border-gray-700 text-center">
          <button
            onClick={() => onSaveEdit(index)}
            className="px-2 py-1 text-green-400 hover:text-green-300"
            title="Save"
          >
            ✔️
          </button>
          <button
            onClick={onCancelEdit}
            className="px-2 py-1 text-gray-400 hover:text-gray-300"
            title="Cancel"
          >
            ❌
          </button>
        </td>
      </tr>
    );
  }

  return (
    <tr>
      <td className="p-2 border border-gray-700">{item.name}</td>
      <td className="p-2 border border-gray-700 text-center">{item.qty}</td>
      <td className="p-2 border border-gray-700 text-center">₹{item.price}</td>
      <td className="p-2 border border-gray-700 text-center">₹{item.total}</td>
      <td className="p-2 border border-gray-700 text-center">
        <button
          onClick={() => onStartEdit(index)}
          className="px-2 py-1 text-yellow-400 hover:text-yellow-300"
          title="Edit"
        >
          ✏️
        </button>
        <button
          onClick={() => onDelete(index)}
          className="px-2 py-1 text-red-400 hover:text-red-300"
          title="Delete"
        >
          🗑️
        </button>
      </td>
    </tr>
  );
}
