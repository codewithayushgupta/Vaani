export function startEdit(index, items, setEditingIndex, setEditFormData) {
  setEditingIndex(index);
  setEditFormData(items[index]);
}

export function cancelEdit(setEditingIndex) {
  setEditingIndex(null);
}

export function saveEdit(index, editFormData, setItems, setEditingIndex, speak) {
  const { name, qty, price } = editFormData;
  const numQty = parseFloat(qty);
  const numPrice = parseFloat(price);

  if (
    !name ||
    isNaN(numQty) ||
    isNaN(numPrice) ||
    numQty <= 0 ||
    numPrice < 0
  ) {
    speak("अमान्य डेटा। कृपया दोबारा जांच लें।");
    return;
  }

  setItems((prevItems) => {
    const updatedItems = [...prevItems];
    updatedItems[index] = {
      name,
      qty: numQty,
      price: numPrice,
      total: numQty * numPrice,
    };
    return updatedItems;
  });
  setEditingIndex(null);
  speak("आइटम अपडेट हो गया।");
}
