const http = require("http");
const https = require("https");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

// 1. Carrega variaveis do .env
const envPath = path.join(__dirname, ".env");
const env = {};
if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, "utf-8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx !== -1) {
      const key = trimmed.substring(0, eqIdx).trim();
      const val = trimmed.substring(eqIdx + 1).trim();
      env[key] = val;
    }
  }
}

const CONFIG = {
  port: parseInt(process.env.PORT || env.PORT || "3000", 10),
  clientId: process.env.CAKTO_CLIENT_ID || env.CAKTO_CLIENT_ID || "xpIQeQ91m5bxAzZh8x7OPgVlEGIXhqWly6yxWLee",
  clientSecret: process.env.CAKTO_CLIENT_SECRET || env.CAKTO_CLIENT_SECRET || "jClhcBlWPgdwsGOb0iFSKYlf4qxXSlmKcq3pQR7LvDF9lyCDlWLcnYPeRVwuLPHLxbVS5dXJmBF2w9ts4phugYoDHe9aLDZf0BWGObQ10fyKN9AkGEf3zauTiwA1xLS7",
  productId: process.env.CAKTO_PRODUCT_ID || env.CAKTO_PRODUCT_ID || "92593a1d-3143-4527-911f-f9aa8a54932e",
  productName: process.env.CAKTO_PRODUCT_NAME || env.CAKTO_PRODUCT_NAME || "Curso - Desenhando Animes",
  userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
};

// Mapeamento oficial de Ofertas do Produto "Curso - Desenhando Animes" (ID: 92593a1d-3143-4527-911f-f9aa8a54932e)
const OFFERS_BY_PRICE = {
  "61.90": "3b6wud4",
  "61.9": "3b6wud4",
  "6190": "3b6wud4",
  "35.82": "6gregkj",
  "3582": "6gregkj",
  "27.90": "sd8ezgz",
  "27.9": "sd8ezgz",
  "2790": "sd8ezgz",
  "19.70": "38xjrg9",
  "19.7": "38xjrg9",
  "1970": "38xjrg9",
  "45.60": "38gipyq",
  "45.6": "38gipyq",
  "4560": "38gipyq",
  "default": "3b6wud4"
};

// Listas para geracao organica
const FIRST_NAMES = [
  "Gabriel", "Lucas", "Matheus", "Guilherme", "Rodrigo", "Felipe", "Bruno", "Leonardo", "Thiago", "Gustavo",
  "Rafael", "Eduardo", "Carlos", "Daniel", "Marcelo", "Andre", "Pedro", "Vinicius", "Paulo", "Diego",
  "Vitor", "Caio", "Arthur", "Murilo", "Renan", "Danilo", "Henrique", "Fabio", "Alex", "Igor",
  "Samuel", "Fernando", "Leandro", "Bernardo", "Caua", "Davi", "Hugo", "Otavio", "Cristiano", "Alexandre",
  "Mariana", "Amanda", "Beatriz", "Camila", "Larissa", "Juliana", "Fernanda", "Patricia", "Bruna", "Aline",
  "Jessica", "Leticia", "Natalia", "Carolina", "Gabriela", "Daniela", "Vanessa", "Renata", "Barbara", "Bianca",
  "Thais", "Priscila", "Luana", "Isabela", "Sabrina", "Tatiane", "Raissa", "Flavia", "Monica", "Claudia"
];

const LAST_NAMES = [
  "Silva", "Santos", "Oliveira", "Souza", "Rodrigues", "Ferreira", "Alves", "Pereira", "Lima", "Gomes",
  "Costa", "Ribeiro", "Martins", "Carvalho", "Almeida", "Lopes", "Soares", "Fernandes", "Vieira", "Barbosa",
  "Rocha", "Dias", "Nascimento", "Andrade", "Moreira", "Marques", "Machado", "Mendes", "Freitas",
  "Cardoso", "Ramos", "Goncalves", "Santana", "Teixeira", "Araujo", "Castro", "Barros", "Cavalcanti", "Moraes"
];

// Provedores principais (75% a 80%) e especiais (1 a cada 3 a 5 pagamentos: Yahoo / iCloud)
const MAIN_EMAIL_DOMAINS = [
  "@gmail.com",
  "@gmail.com",
  "@outlook.com",
  "@hotmail.com"
];

const SPECIAL_EMAIL_DOMAINS = [
  "@yahoo.com.br",
  "@yahoo.com",
  "@icloud.com"
];

function pickOrganicDomain(clientEmail) {
  // A cada 3 a 5 transações (~25%), seleciona Yahoo ou iCloud
  if (Math.random() < 0.25) {
    return SPECIAL_EMAIL_DOMAINS[Math.floor(Math.random() * SPECIAL_EMAIL_DOMAINS.length)];
  }
  return MAIN_EMAIL_DOMAINS[Math.floor(Math.random() * MAIN_EMAIL_DOMAINS.length)];
}

const FORBIDDEN_WORDS = ["upsell", "teste", "test", "demo", "fake", "temp", "mock", "site", "bot", "38gipyq", "38xjrg9", "sd8ezgz", "6gregkj", "3b6wud4"];

function sanitizeWord(w) {
  if (!w) return "";
  return w.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z]/g, "");
}

function hasForbiddenTerms(str) {
  if (!str) return false;
  const s = str.toLowerCase();
  return FORBIDDEN_WORDS.some(term => s.includes(term));
}

function generateOrganicEmail(name, baseEmail) {
  const words = (name || "").split(/\s+/).map(sanitizeWord).filter(w => w.length > 1 && !FORBIDDEN_WORDS.includes(w));
  const fn = words[0] || sanitizeWord(FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)]);
  const ln = words.length > 1 ? words[words.length - 1] : sanitizeWord(LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)]);
  const mn = words.length > 2 ? words[1] : "";

  const year2 = String(Math.floor(55 + Math.random() * 45)); // 55 a 99
  const year4 = String(Math.floor(1965 + Math.random() * 38)); // 1965 a 2003
  const shortNum = String(Math.floor(2 + Math.random() * 95));
  const shortLn = (ln && ln.length >= 4) ? ln.slice(0, -2) : ln;

  // Padrões limpos, naturais e fáceis de lembrar
  const formats = [
    // 1. Sobrenome sem 2 letras finais + ponto + numeração aleatória
    `${fn}${shortLn}.${year2}`,
    `${fn}${shortLn}.${shortNum}`,
    `${fn}.${shortLn}${year2}`,
    `${fn}.${shortLn}.${year2}`,
    `${fn}${shortLn}${year2}`,

    // 2. Número no MEIO colado (sem pontos nem underlines)
    `${fn}${year2}${ln}`,
    `${fn}${year2}${ln}`,
    `${fn}${shortNum}${ln}`,
    `${fn}${year4}${ln}`,
    `${fn.charAt(0)}${year2}${ln}`,

    // 3. Número no FINAL colado (sem pontos nem underlines)
    `${fn}${ln}${year2}`,
    `${fn}${ln}${year2}`,
    `${fn}${ln}${shortNum}`,
    `${fn}${ln}${year4}`,
    `${fn.charAt(0)}${ln}${year2}`,

    // 4. Sem número (nomes colados diretos)
    `${fn}${ln}`,
    `${fn}${ln}`,
    mn ? `${fn}${mn}${ln}` : `${fn}${ln}`,
    mn ? `${fn}${mn.charAt(0)}${ln}` : `${fn}${ln}`,

    // 5. Pontuação simples e moderada (apenas 1 separador simples)
    `${fn}.${ln}`,
    `${fn}.${ln}${year2}`,
    `${fn}_${ln}`
  ];

  const userPart = formats[Math.floor(Math.random() * formats.length)];
  const domain = pickOrganicDomain(baseEmail);
  return userPart + domain;
}

function sanitizeOrganicCustomer(cust) {
  let name = String(cust.name || "").trim();
  let email = String(cust.email || "").trim();

  // Se o nome contiver termos proibidos/artificiais (ex: "Upsell", "teste"), gera nome autentico
  if (!name || name.length < 3 || hasForbiddenTerms(name)) {
    const fn = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
    const ln = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
    const mn = Math.random() > 0.5 ? LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)] : "";
    name = mn ? `${fn} ${mn} ${ln}` : `${fn} ${ln}`;
  }

  // Se o email contiver termos proibidos ou hashes de oferta, gera novo email organico com dominio variado
  if (!email || email.indexOf("@") === -1 || hasForbiddenTerms(email)) {
    email = generateOrganicEmail(name, "");
  } else {
    // Garante variedade de provedores
    const userDomain = email.substring(email.lastIndexOf("@")).toLowerCase();
    if (Math.random() < 0.25 && SPECIAL_EMAIL_DOMAINS.includes(userDomain)) {
      // mantém yahoo / icloud
    } else if (Math.random() < 0.70 && MAIN_EMAIL_DOMAINS.includes(userDomain)) {
      // mantém gmail / outlook / hotmail
    } else {
      email = generateOrganicEmail(name, email);
    }
  }

  return { name, email };
}

// Cache de Token OAuth2 Cakto
let cachedToken = null;
let tokenExpiresAt = 0;

function getCaktoToken() {
  return new Promise((resolve, reject) => {
    const now = Date.now();
    if (cachedToken && tokenExpiresAt > now + 60000) {
      return resolve(cachedToken);
    }

    const postData = new URLSearchParams({
      client_id: CONFIG.clientId,
      client_secret: CONFIG.clientSecret
    }).toString();

    const options = {
      hostname: "api.cakto.com.br",
      port: 443,
      path: "/public_api/token/",
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Content-Length": Buffer.byteLength(postData),
        "User-Agent": CONFIG.userAgent,
        "Accept": "application/json"
      }
    };

    const req = https.request(options, (res) => {
      let body = "";
      res.on("data", (chunk) => { body += chunk; });
      res.on("end", () => {
        try {
          const data = JSON.parse(body);
          if (res.statusCode >= 200 && res.statusCode < 300 && data.access_token) {
            cachedToken = data.access_token;
            tokenExpiresAt = Date.now() + ((data.expires_in || 3600) * 1000);
            return resolve(cachedToken);
          } else {
            return reject(new Error("Falha na autenticação Cakto: " + body));
          }
        } catch (e) {
          return reject(new Error("Erro ao interpretar resposta do token Cakto: " + body));
        }
      });
    });

    req.on("error", reject);
    req.write(postData);
    req.end();
  });
}

function sendJson(res, statusCode, data) {
  const jsonStr = JSON.stringify(data);
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS, PUT, DELETE",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With, Accept"
  });
  res.end(jsonStr);
}

function handleCors(req, res) {
  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS, PUT, DELETE",
      "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With, Accept",
      "Access-Control-Max-Age": "86400"
    });
    res.end();
    return true;
  }
  return false;
}

const server = http.createServer(async (req, res) => {
  if (handleCors(req, res)) return;

  const parsedUrl = new URL(req.url, "http://" + req.headers.host);
  const pathname = parsedUrl.pathname;

  // Endpoint 1: POST /api/cakto/create-pix
  if (pathname === "/api/cakto/create-pix" && req.method === "POST") {
    let rawBody = "";
    req.on("data", (chunk) => { rawBody += chunk; });
    req.on("end", async () => {
      try {
        const payload = JSON.parse(rawBody || "{}");
        const token = await getCaktoToken();

        const amtStr = String(payload.amount || "61.90").replace(",", ".").trim();
        const offerId = OFFERS_BY_PRICE[amtStr] || OFFERS_BY_PRICE["default"];
        const cust = payload.customer || {};

        // Sanitizacao rigorosa para garantir nomes brasileiros e alta variacao de emails
        const { name: organicName, email: organicEmail } = sanitizeOrganicCustomer(cust);

        const cleanDoc = String(cust.document || cust.cpf || cust.docNumber || "").replace(/\D/g, "");
        const cleanPhone = String(cust.phone || "").replace(/\D/g, "");

        const clientIp = req.headers["x-forwarded-for"] || req.socket.remoteAddress || "177.18.29.34";
        const cleanIp = (clientIp.split(",")[0] || "177.18.29.34").replace(/^::ffff:/, "").trim();

        const fingerprint = crypto.createHash("md5")
          .update(cleanIp + (req.headers["user-agent"] || "") + Date.now() + Math.random())
          .digest("hex");

        const caktoPayload = {
          paymentMethod: "pix",
          customer: {
            name: organicName,
            email: organicEmail,
            phone: cleanPhone || "11987654321",
            docType: "cpf",
            docNumber: cleanDoc || "38812345678",
            ip: cleanIp,
            fingerprint: fingerprint
          },
          items: [
            {
              offerId: offerId
            }
          ],
          pixExpiresIn: 900
        };

        const idempotencyKey = crypto.randomUUID();
        const postData = JSON.stringify(caktoPayload);

        console.log(`[Cakto PIX] Pedido Produto: "${CONFIG.productName}" | Oferta: ${offerId} | Valor: R$ ${amtStr}`);
        console.log(`[Cakto PIX] Cliente sintetizado: "${caktoPayload.customer.name}" | Email: "${caktoPayload.customer.email}" (Provedor: ${caktoPayload.customer.email.split('@')[1]})`);

        const caktoReq = https.request({
          hostname: "api.cakto.com.br",
          port: 443,
          path: "/public_api/payments/",
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Content-Length": Buffer.byteLength(postData),
            "Authorization": "Bearer " + token,
            "X-Idempotency-Key": idempotencyKey,
            "User-Agent": CONFIG.userAgent,
            "Accept": "application/json"
          }
        }, (caktoRes) => {
          let caktoBody = "";
          caktoRes.on("data", (c) => { caktoBody += c; });
          caktoRes.on("end", () => {
            try {
              const caktoData = JSON.parse(caktoBody);
              if (caktoRes.statusCode >= 200 && caktoRes.statusCode < 300) {
                const qrText = (caktoData.pix && (caktoData.pix.qrCode || caktoData.pix.pix_qr_code)) || "";
                const qrUrl = "https://api.qrserver.com/v1/create-qr-code/?size=260x260&margin=1&data=" + encodeURIComponent(qrText);

                const responseData = {
                  success: true,
                  id: caktoData.id,
                  hash: caktoData.id,
                  order_id: caktoData.id,
                  ref_id: caktoData.refId,
                  status: caktoData.status || "waiting_payment",
                  payment_status: caktoData.status || "waiting_payment",
                  amount: caktoData.amount || amtStr,
                  base_amount: caktoData.baseAmount || amtStr,
                  product: caktoData.product || { id: CONFIG.productId, name: CONFIG.productName },
                  offer: caktoData.offer || { id: offerId },
                  pix: {
                    qrCode: qrText,
                    pix_qr_code: qrText,
                    pix_url: qrUrl,
                    qrCodeUrl: qrUrl,
                    qr_code_base64: qrUrl,
                    expirationDate: (caktoData.pix && caktoData.pix.expirationDate) || ""
                  }
                };
                return sendJson(res, 200, responseData);
              } else {
                console.error("[Cakto PIX] Erro retornado pela API da Cakto:", caktoRes.statusCode, caktoBody);
                return sendJson(res, caktoRes.statusCode, { success: false, error: caktoBody });
              }
            } catch (errParse) {
              return sendJson(res, 500, { success: false, error: "Falha ao processar resposta Cakto: " + caktoBody });
            }
          });
        });

        caktoReq.on("error", (errReq) => {
          console.error("[Cakto PIX] Erro de rede com Cakto:", errReq.message);
          return sendJson(res, 502, { success: false, error: "Erro de rede com gateway Cakto: " + errReq.message });
        });

        caktoReq.write(postData);
        caktoReq.end();
      } catch (errJson) {
        return sendJson(res, 400, { success: false, error: "Payload invalido: " + errJson.message });
      }
    });
    return;
  }

  // Endpoint 2: GET /api/cakto/order-status/:id
  if (pathname.startsWith("/api/cakto/order-status") && req.method === "GET") {
    const parts = pathname.split("/").filter(Boolean);
    const orderId = parts[parts.length - 1];

    if (!orderId || orderId === "order-status") {
      return sendJson(res, 400, { success: false, error: "ID da ordem não informado" });
    }

    try {
      const token = await getCaktoToken();
      const caktoReq = https.request({
        hostname: "api.cakto.com.br",
        port: 443,
        path: `/public_api/orders/${encodeURIComponent(orderId)}/`,
        method: "GET",
        headers: {
          "Authorization": "Bearer " + token,
          "User-Agent": CONFIG.userAgent,
          "Accept": "application/json"
        }
      }, (caktoRes) => {
        let body = "";
        caktoRes.on("data", (chunk) => { body += chunk; });
        caktoRes.on("end", () => {
          try {
            const data = JSON.parse(body);
            const isPaid = data.status === "paid" || data.status === "approved" || data.status === "completed";
            return sendJson(res, 200, {
              success: true,
              id: orderId,
              hash: orderId,
              status: data.status || "waiting_payment",
              payment_status: data.status || "waiting_payment",
              amount: data.amount,
              is_paid: isPaid,
              product: data.product,
              offer: data.offer
            });
          } catch (e) {
            return sendJson(res, 500, { success: false, error: "Erro ao ler status: " + body });
          }
        });
      });

      caktoReq.on("error", (err) => {
        return sendJson(res, 502, { success: false, error: err.message });
      });
      caktoReq.end();
    } catch (errToken) {
      return sendJson(res, 500, { success: false, error: errToken.message });
    }
    return;
  }

  // Endpoint 3: GET /api/cakto/health
  if (pathname === "/api/cakto/health") {
    return sendJson(res, 200, {
      status: "ok",
      gateway: "cakto",
      productId: CONFIG.productId,
      productName: CONFIG.productName,
      offers: OFFERS_BY_PRICE,
      timestamp: new Date().toISOString()
    });
  }

  // Fallback: Servidor estático
  const baseDir = __dirname;
  let safePath = path.normalize(path.join(baseDir, pathname));
  if (!safePath.startsWith(baseDir)) {
    res.writeHead(403);
    return res.end("Acesso negado");
  }

  if (fs.existsSync(safePath) && fs.statSync(safePath).isDirectory()) {
    safePath = path.join(safePath, "index.html");
  }

  if (fs.existsSync(safePath) && fs.statSync(safePath).isFile()) {
    const ext = path.extname(safePath).toLowerCase();
    const mimeTypes = {
      ".html": "text/html; charset=utf-8",
      ".js": "application/javascript; charset=utf-8",
      ".css": "text/css; charset=utf-8",
      ".json": "application/json; charset=utf-8",
      ".png": "image/png",
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".webp": "image/webp",
      ".svg": "image/svg+xml",
      ".ico": "image/x-icon",
      ".woff2": "font/woff2"
    };
    res.writeHead(200, {
      "Content-Type": mimeTypes[ext] || "application/octet-stream",
      "Access-Control-Allow-Origin": "*"
    });
    fs.createReadStream(safePath).pipe(res);
    return;
  }

  res.writeHead(404, { "Content-Type": "text/plain" });
  res.end("Not Found");
});

server.listen(CONFIG.port, "0.0.0.0", () => {
  console.log(`[Cakto Backend] Servidor Seguro Cakto PIX ativo na porta ${CONFIG.port}`);
});
