"use client";
import { useEffect, useState } from "react";
import { db } from "@/firebase";
import { useAuth } from "../context/authContext";
import { collection, onSnapshot, doc, setDoc, deleteDoc } from "firebase/firestore";

interface Item {
  id: string;
  name: string;
  available: boolean;
}

export default function InventoryList() {
  const { user } = useAuth();
  const [items, setItems] = useState<Item[]>([]);

  useEffect(() => {
    if (!user) return;
    const ref = collection(db, `users/${user.uid}/inventory`);
    const unsub = onSnapshot(ref, (snap) => {
      setItems(snap.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Item)));
    });
    return () => unsub();
  }, [user]);

  const markNotAvailable = async (id: string, name: string) => {
    if (!user) return;
    // Remove from inventory, add to shoppingList
    await deleteDoc(doc(db, `users/${user.uid}/inventory`, id));
    await setDoc(doc(db, `users/${user.uid}/shoppingList`, id), { name });
  };

  const deleteItem = async (id: string) => {
    if (!user) return;
    await deleteDoc(doc(db, `users/${user.uid}/inventory`, id));
  };

  return (
    <section>
      <h2 className="text-xl font-semibold mb-2">Inventory</h2>
      <ul className="space-y-2">
        {items.length === 0 && <li className="text-gray-500">No items in inventory.</li>}
        {items.map((item) => (
          <li key={item.id} className="flex items-center justify-between bg-gray-100 rounded px-3 py-2">
            <span>{item.name}</span>
            <div className="space-x-2">
              <button onClick={() => markNotAvailable(item.id, item.name)} className="text-yellow-600 hover:underline">Not available</button>
              <button onClick={() => deleteItem(item.id)} className="text-red-600 hover:underline">Delete</button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
} 