"use client";
import { useEffect, useState } from "react";
import { db } from "@/firebase";
import { useAuth } from "../context/authContext";
import { collection, onSnapshot, doc, updateDoc, deleteDoc, setDoc } from "firebase/firestore";

interface Item {
  id: string;
  name: string;
}

export default function ShoppingList() {
  const { user } = useAuth();
  const [items, setItems] = useState<Item[]>([]);

  useEffect(() => {
    if (!user) return;
    const ref = collection(db, `users/${user.uid}/shoppingList`);
    const unsub = onSnapshot(ref, (snap) => {
      setItems(snap.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Item)));
    });
    return () => unsub();
  }, [user]);

  const markBought = async (id: string, name: string) => {
    if (!user) return;
    // Remove from shoppingList, add to inventory
    await deleteDoc(doc(db, `users/${user.uid}/shoppingList`, id));
    await setDoc(doc(db, `users/${user.uid}/inventory`, id), { name, available: true });
  };

  const deleteItem = async (id: string) => {
    if (!user) return;
    await deleteDoc(doc(db, `users/${user.uid}/shoppingList`, id));
  };

  return (
    <section>
      <h2 className="text-xl font-semibold mb-2">Shopping List</h2>
      <ul className="space-y-2">
        {items.length === 0 && <li className="text-gray-500">No items in shopping list.</li>}
        {items.map((item) => (
          <li key={item.id} className="flex items-center justify-between bg-gray-100 rounded px-3 py-2">
            <span>{item.name}</span>
            <div className="space-x-2">
              <button onClick={() => markBought(item.id, item.name)} className="text-green-600 hover:underline">Bought</button>
              <button onClick={() => deleteItem(item.id)} className="text-red-600 hover:underline">Delete</button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
} 