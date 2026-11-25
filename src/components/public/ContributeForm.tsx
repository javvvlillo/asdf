"use client";

import { useState, type FormEvent } from "react";

export function ContributeForm({ itemId }: { itemId: string }) {
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/contributions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemId,
          guestName,
          guestEmail,
          message: message || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Algo salió mal. Intenta de nuevo.");
        setLoading(false);
        return;
      }

      window.location.href = data.redirectUrl;
    } catch {
      setError("No pudimos conectar con el servidor. Intenta de nuevo.");
      setLoading(false);
    }
  }

  const inputClass = "campo";
  const labelClass = "flex flex-col gap-1 text-sm font-bold uppercase";

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <label className={labelClass}>
        Tu nombre
        <input
          required
          value={guestName}
          onChange={(e) => setGuestName(e.target.value)}
          className={inputClass}
          placeholder="María González"
        />
      </label>
      <label className={labelClass}>
        Tu email
        <input
          required
          type="email"
          value={guestEmail}
          onChange={(e) => setGuestEmail(e.target.value)}
          className={inputClass}
          placeholder="maria@correo.cl"
        />
      </label>
      <label className={labelClass}>
        Mensaje (opcional)
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={3}
          className={inputClass}
          placeholder="¡Que vivan los novios!"
        />
      </label>
      {error && <p className="text-sm font-bold text-red-700">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="boton mt-2"
      >
        {loading ? "Redirigiendo a pago…" : "Ir a pagar"}
      </button>
    </form>
  );
}
