import { useState, useRef, useEffect } from "react";
import { addItems, deleteItems, updateItems } from "@/app/services/itemOperations";

export function useItemManagement() {
  const [items, setItems] = useState([]);
  const itemsRef = useRef([]);

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  const handleAddItems = (aiItems, speak) => {
    addItems(aiItems, setItems, speak);
  };

  const handleDeleteItems = (aiItems, speak) => {
    deleteItems(aiItems, setItems, speak);
  };

  const handleUpdateItems = (aiItems, speak) => {
    updateItems(aiItems, setItems, speak);
  };

  const clearItems = () => {
    setItems([]);
  };

  return {
    items,
    setItems,
    itemsRef,
    handleAddItems,
    handleDeleteItems,
    handleUpdateItems,
    clearItems,
  };
}
