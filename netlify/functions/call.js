// netlify/functions/call.js
const { api: zadarmaApi } = require("@trieb.work/zadarma");

// validatori semplici
const isE164 = (n) => /^\+\d{8,15}$/.test(n);

exports.handler = async (event) => {
  try {
    if (event.httpMethod !== "POST") {
      return { statusCode: 405, body: "Method Not Allowed" };
    }

    const { phone } = JSON.parse(event.body || "{}");
    if (!phone) {
      return { statusCode: 400, body: JSON.stringify({ ok:false, error: "phone mancante" }) };
    }

    const from = (process.env.STUDIO_FROM || "").trim();         // cellulare studio, es. +39351...
    const to   = (phone || "").trim();                           // numero paziente in +39...
    const callerId = (process.env.CALLER_ID_FROM || from).trim(); // numero mostrato al paziente

    // validazioni
    if (!isE164(from)) return { statusCode: 400, body: JSON.stringify({ ok:false, error: "STUDIO_FROM deve essere in formato +39..." }) };
    if (!isE164(to))   return { statusCode: 400, body: JSON.stringify({ ok:false, error: "Numero paziente non valido (+39...)" }) };
    if (!isE164(callerId)) return { statusCode: 400, body: JSON.stringify({ ok:false, error: "CALLER_ID_FROM non valido (+39...)" }) };
    if (from === to) return { statusCode: 400, body: JSON.stringify({ ok:false, error: "from e to non possono essere lo stesso numero" }) };

    // parametri per /v1/request/callback/
    const params = {
      from,        // chiamiamo prima il tuo cellulare
      to,          // poi il paziente
      caller_id: callerId // il paziente vede il tuo numero verde
      // NON usiamo 'sip' qui
    };

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
      body: JSON.stringify({ ok: true, zadarma, debug: `from=${from} to=${to} caller_id=${callerId}` })
    };
  } catch (err) {
    console.error("Zadarma error", err);
    return { statusCode: 500, body: JSON.stringify({ ok:false, error: err?.message || "Errore" }) };
  }
};
