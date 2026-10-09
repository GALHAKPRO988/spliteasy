import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

// Reads a receipt photo with Lovable AI and returns concept, total and date.
export const scanReceipt = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ image: z.string().startsWith("data:image/").max(8_000_000) }).parse(d))
  .handler(async ({ data }) => {
    const key = process.env["LOVABLE_API_KEY"];
    if (!key) return { error: "El escáner no está disponible." };
    const res = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
      method: "POST",
      headers: { "Lovable-API-Key": key, "X-Lovable-AIG-SDK": "fetch", "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "openai/gpt-6-astra",
        stream: true,
        store: false,
        reasoning: { effort: "low" },
        input: [
          {
            role: "user",
            content: [
              { type: "input_text", text: "Lee este ticket de compra. Devuelve el nombre del comercio o un concepto corto en español, el importe TOTAL pagado y la fecha (YYYY-MM-DD) o null si no aparece." },
              { type: "input_image", image_url: data.image },
            ],
          },
        ],
        text: {
          format: {
            type: "json_schema",
            name: "ticket",
            strict: true,
            schema: {
              type: "object",
              additionalProperties: false,
              properties: { concept: { type: "string" }, total: { type: "number" }, date: { type: ["string", "null"] } },
              required: ["concept", "total", "date"],
            },
          },
        },
      }),
    });
    if (res.status === 429) return { error: "Demasiadas peticiones, prueba en un momento." };
    if (res.status === 402) return { error: "Se acabaron los créditos de IA." };
    if (!res.ok || !res.body) { console.error("scan", res.status, await res.text()); return { error: "No se pudo leer el ticket." }; }

    // Consume the SSE stream and collect the output text.
    const reader = res.body.getReader();
    const dec = new TextDecoder();
    let buf = "", out = "";
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += dec.decode(value, { stream: true });
      const lines = buf.split("\n");
      buf = lines.pop() ?? "";
      for (const l of lines) {
        if (!l.startsWith("data:")) continue;
        const p = l.slice(5).trim();
        if (!p || p === "[DONE]") continue;
        try { const ev = JSON.parse(p); if (ev.type === "response.output_text.delta") out += ev.delta; } catch {}
      }
    }
    try {
      const a = JSON.parse(out);
      return {
        concept: String(a.concept ?? "").slice(0, 120),
        total: Number(a.total) || 0,
        date: /^\d{4}-\d{2}-\d{2}$/.test(a.date ?? "") ? (a.date as string) : null,
      };
    } catch {
      return { error: "No se pudo leer el ticket." };
    }
  });
