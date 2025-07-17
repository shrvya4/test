import { NextRequest, NextResponse } from "next/server";
import { db } from "@/firebase";
import OpenAI from "openai";
import { doc, setDoc, deleteDoc } from "firebase/firestore";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: NextRequest) {
  const { message, userId } = await req.json();
  if (!message || !userId) return NextResponse.json({ error: "Missing message or userId" }, { status: 400 });

  // Call OpenAI to extract intent and item
  const prompt = `Extract the intent and item from the following message. Reply as JSON with keys 'intent' and 'item'.\nMessage: "${message}"`;
  const completion = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: [
      { role: "system", content: "You are a helpful assistant that extracts intent and item from user messages." },
      { role: "user", content: prompt },
    ],
    temperature: 0,
  });
  let intent = "";
  let item = "";
  try {
    const response = completion.choices[0].message?.content || "";
    const parsed = JSON.parse(response);
    intent = parsed.intent;
    item = parsed.item;
  } catch {
    return NextResponse.json({ error: "Could not parse OpenAI response" }, { status: 500 });
  }

  // Firestore logic
  const inventoryRef = doc(db, `users/${userId}/inventory`, item.toLowerCase());
  const shoppingRef = doc(db, `users/${userId}/shoppingList`, item.toLowerCase());

  if (intent === "add to inventory" || intent === "bought") {
    await setDoc(inventoryRef, { name: item, available: true });
    await deleteDoc(shoppingRef);
  } else if (intent === "move to shopping list" || intent === "not available") {
    await setDoc(shoppingRef, { name: item });
    await deleteDoc(inventoryRef);
  } else if (intent === "add to shopping list") {
    await setDoc(shoppingRef, { name: item });
  }

  return NextResponse.json({ intent, item });
} 