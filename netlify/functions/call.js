
const { api: zadarmaApi } = require("@trieb.work/zadarma");

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }
  const { phone } = JSON.parse(event.body || "{}");
  if (!phone) return { statusCode: 400, body: "phone mancante" };

  const from = (process.env.STUDIO_FROM || "").trim();
  const to = phone.trim();
  const params = { from, to };

  try {
    const zadarma = await zadarmaApi({
      api_method: "/v1/request/callback/",
      api_user_key: process.env.ZADARMA_USER_KEY,
      api_secret_key: process.env.ZADARMA_SECRET_KEY,
      params
    });
    return { statusCode: 200, body: JSON.stringify({ ok:true, zadarma }) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ ok:false, error: err.message }) };
  }
};
