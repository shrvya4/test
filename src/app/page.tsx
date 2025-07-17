"use client";
import { useAuth } from "./context/authContext";
import InventoryList from "./components/InventoryList";
import ShoppingList from "./components/ShoppingList";
import InputBox from "./components/InputBox";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  if (loading) return <div className="flex justify-center items-center h-screen">Loading...</div>;
  if (!user) return null;

  return (
    <main className="max-w-2xl mx-auto p-4 space-y-6">
      <h1 className="text-2xl font-bold mb-4">Family Inventory Dashboard</h1>
      <InventoryList />
      <ShoppingList />
      <InputBox />
    </main>
  );
}
