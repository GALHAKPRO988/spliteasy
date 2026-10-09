import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

// Reads a receipt photo with Lovable AI and returns concept, total and date.
export const scanReceipt = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ image: z.string().startsWith("data:image/").max(8_000_000) }).parse(d))
  .handler(async ({ data }) => {
    const key = process.env["LOVABLE_API_KEY"];
    if (!key) return { error: "El escáner no está disponible." };
    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: "Lee este ticket de compra. Devuelve el nombre del comercio o un concepto corto en español, el importe TOTAL pagado y la fecha (YYYY-MM-DD) si aparece." },
              { type: "image_url", image_url: { url: data.image } },
            ],
          },
        ],
        tools: [{
          type: "function",
          function: {
            name: "ticket",
            parameters: {
              type: "object",
              properties: { concept: { type: "string" }, total: { type: "number" }, date: { type: "string" } },
              required: ["concept", "total"],
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "ticket" } },
      }),
    });
    if (res.status === 429) return { error: "Demasiadas peticiones, prueba en un momento." };
    if (res.status === 402) return { error: "Se acabaron los créditos de IA." };
    if (!res.ok) { console.error("scan", res.status, await res.text()); return { error: "No se pudo leer el ticket." }; }
    const j = await res.json();
    try {
      const a = JSON.parse(j.choices[0].message.tool_calls[0].function.arguments);
      return {
        concept: String(a.concept ?? "").slice(0, 120),
        total: Number(a.total) || 0,
        date: /^\d{4}-\d{2}-\d{2}$/.test(a.date ?? "") ? (a.date as string) : null,
      };
    } catch {
      return { error: "No se pudo leer el ticket." };
    }
  });
