"use client";

import { auth } from "@/lib/firebaseClient";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SignInPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (mode === "signup") {
        await createUserWithEmailAndPassword(auth, email, password);
        setMessage("Account created and signed in!");
        router.replace("/dashboard");
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        setMessage("Signed in successfully!");
        router.replace("/dashboard");
      }
    } catch (err: unknown) {
      const text = err instanceof Error ? err.message : "Authentication failed."
      setMessage(text);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white shadow-md rounded-lg p-8 w-full max-w-md">
        <h1 className="text-2xl font-semibold mb-4">
          {mode === "signin" ? "Sign In" : "Sign Up"}
        </h1>

        <form onSubmit={handleSubmit} className="flex flex-col space-y-4">
          <input
            type="email"
            placeholder="Email"
            className="border p-2 rounded"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            className="border p-2 rounded"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
          />

          <button
            type="submit"
            className="bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
          >
            {mode === "signin" ? "Sign In" : "Sign Up"}
          </button>
        </form>

        <p className="text-sm mt-4 text-center">
          {mode === "signin" ? "No account?" : "Already registered?"}{" "}
          <button
            className="text-blue-600 underline"
            onClick={() =>
              setMode((m) => (m === "signin" ? "signup" : "signin"))
            }
          >
            {mode === "signin" ? "Create one" : "Sign in"}
          </button>
        </p>

        {message && (
          <p className="text-sm text-center text-gray-600 mt-4">{message}</p>
        )}
      </div>
    </div>
  );
}
