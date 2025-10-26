export function addItems(aiItems, setItems, speak) {
  const validItems = aiItems.filter((i) => {
    if (!i.name) return false;
    const qtyValid =
      i.quantity !== undefined &&
      !isNaN(Number(i.quantity)) &&
      Number(i.quantity) > 0;
    const rateValid =
      i.rate !== undefined &&
      !isNaN(Number(i.rate)) &&
      Number(i.rate) > 0;
    return qtyValid && rateValid;
  });

  if (validItems.length > 0) {
    setItems((prev) => [
      ...prev,
      ...validItems.map((i) => ({
        name: i.name,
        qty: Number(i.quantity),
        price: Number(i.rate),
        total: Number(i.quantity) * Number(i.rate),
      })),
    ]);
    const added = validItems.map((i) => `${i.name}`).join(", ");
    speak(`${added} जोड़ दिया गया है।`);
  } else {
    speak("कृपया मात्रा और कीमत दोनों बताएं।");
  }
}

export function deleteItems(aiItems, setItems, speak) {
  const namesToDelete = aiItems.map((i) => i.name).filter(Boolean);
  if (namesToDelete.length === 0) {
    speak("कौन सा आइटम हटाना है?");
    return;
  }

  setItems((prev) =>
    prev.filter(
      (it) =>
        !namesToDelete.some((del) =>
          it.name.toLowerCase().includes(del.toLowerCase())
        )
    )
  );
  speak(`${namesToDelete.join(", ")} हटा दिया गया है।`);
}

export function updateItems(aiItems, setItems, speak) {
  if (aiItems.length === 0) {
    speak("कौन सा आइटम अपडेट करना है?");
    return;
  }

  let foundMatch = false;
  setItems((prev) => {
    const updatedList = prev.map((it) => {
      const match = aiItems.find(
        (a) => a.name && it.name.toLowerCase().includes(a.name.toLowerCase())
      );
      if (!match) return it;

      foundMatch = true;

      const qtyProvided =
        match.quantity !== undefined &&
        !isNaN(Number(match.quantity)) &&
        Number(match.quantity) > 0;
      const newQty = qtyProvided ? Number(match.quantity) : Number(it.qty);

      const rateProvided =
        match.rate !== undefined &&
        !isNaN(Number(match.rate)) &&
        Number(match.rate) > 0;
      const newRate = rateProvided ? Number(match.rate) : Number(it.price);

      return {
        ...it,
        qty: newQty,
        price: newRate,
        total: newQty * newRate,
      };
    });

    if (foundMatch) speak("आइटम अपडेट कर दिया गया है।");
    else speak("कोई मेल खाता आइटम नहीं मिला।");

    return updatedList;
  });
}

export function deleteItemByIndex(index, setItems, speak) {
  setItems((prevItems) => prevItems.filter((_, i) => i !== index));
  speak("आइटम हटा दिया।");
}
