// netlify/functions/call.js
const { api: zadarmaApi } = require("@trieb.work/zadarma");

const isE164 = (n) => /^\+\d{8,15}$/.test(n);
const isSipExt = (n) => /^\d{2,6}$/.test(n);

exports.handler = async (event) => {
  try {
    if (event.httpMethod !== "POST") {
      return { statusCode: 405, body: "Method Not Allowed" };
    }

    const { phone } = JSON.parse(event.body || "{}");
    if (!phone) {
      return { statusCode: 400, body: JSON.stringify({ error: "phone mancante" }) };
    }

    const from = (process.env.STUDIO_FROM || "").trim();
    const to = (phone || "").trim();

    if (!(isE164(to))) {
      return { statusCode: 400, body: JSON.stringify({ ok:false, error: "Numero paziente non valido. Usa formato +3933..." }) };
    }
    if (!(isE164(from) || isSipExt(from))) {
      return { statusCode: 400, body: JSON.stringify({ ok:false, error: "STUDIO_FROM non valido. Metti interno (101) o numero +39..." }) };
    }

    const params = { from, to };
    console.log("Zadarma params", params);

    const zadarma = await zadarmaApi({
      api_method: "/v1/request/callback/",
      api_user_key: process.env.ZADARMA_USER_KEY,
      api_secret_key: process.env.ZADARMA_SECRET_KEY,
      params
    });

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ok: true, zadarma, debug: `Chiamata inviata con from=${from}, to=${to}` })
    };
  } catch (err) {
    console.error("Zadarma error", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ ok: false, error: err?.message || "Errore", debug: "Controlla i Logs su Netlify" })
    };
  }
};