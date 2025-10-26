import { useState } from "react";
import {
  startEdit,
  cancelEdit,
  saveEdit,
} from "@/app/services/itemEditService";
import { deleteItemByIndex } from "@/app/services/itemOperations";

export function useItemEdit(items, setItems, speak) {
  const [editingIndex, setEditingIndex] = useState(null);
  const [editFormData, setEditFormData] = useState({
    name: "",
    qty: 0,
    price: 0,
  });

  const handleStartEdit = (index) => {
    startEdit(index, items, setEditingIndex, setEditFormData);
  };

  const handleCancelEdit = () => {
    cancelEdit(setEditingIndex);
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveEdit = (index) => {
    saveEdit(index, editFormData, setItems, setEditingIndex, speak);
  };

  const handleDeleteItem = (index) => {
    deleteItemByIndex(index, setItems, speak);
  };

  return {
    editingIndex,
    editFormData,
    handleStartEdit,
    handleCancelEdit,
    handleEditChange,
    handleSaveEdit,
    handleDeleteItem,
  };
}
