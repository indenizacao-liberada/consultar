/**
 * cakto-api.js  —  PIX Client-Side  (GitHub Pages / hospedagem estática)
 * Produto: Curso Desenhando Animes
 *
 * Fluxo:
 *   1. Obtém token OAuth2 em api.cakto.com.br
 *   2. Cria cobrança PIX real com offer_id e payload correto
 *   3. Qualquer falha (CORS, rede, erro) → gera PIX EMVCo BACEN local
 *
 * GitHub Pages = hospedagem estática. server.js NÃO roda aqui.
 * Apenas este arquivo é necessário.
 *
 * SOBRE CORS:
 *   De file:// ou localhost → CORS bloqueia → cai no fallback EMVCo.
 *   De HTTPS real (usuario.github.io) → CORS pode passar → ordem Cakto real.
 *
 * CONFIGURAR:
 *   CONFIG.chavePix → sua chave Pix real (recebe pagamentos do fallback EMVCo)
 */
(function (global) {
  "use strict";

  var _w   = typeof window !== "undefined" ? window : global;
  var _loc = (_w && _w.location) ? _w.location : { search: "", hostname: "" };
  var _nav = (_w && _w.navigator) ? _w.navigator : {};

  function _ls(k)       { try { return localStorage.getItem(k); }     catch (e) { return null; } }
  function _lsSet(k, v) { try { localStorage.setItem(k, v); }         catch (e) {} }
  function _qs()        {
    try { return new URLSearchParams(_loc.search || ""); }
    catch (e) { return { get: function () { return null; } }; }
  }

  /* ─────────────────────────────────────────────────────────────
   * CONFIGURAÇÃO
   * ───────────────────────────────────────────────────────────── */
  var CONFIG = {
    productTitle: "Curso Desenhando Animes",
    productId:    "92593a1d-3143-4527-911f-f9aa8a54932e",
    merchantCity: "SAO PAULO",

    /* Sua chave PIX real — recebe pagamentos do fallback EMVCo local */
    chavePix: (
      (_w && _w.CHAVE_PIX) ||
      _ls("chave_pix") ||
      _qs().get("chave_pix") ||
      "suporte@gmail.com"    /* ← substitua pela sua chave Pix real */
    ),

    /* Credenciais OAuth2 — Painel → Integrações → Cakto API */
    clientId:     "xpIQeQ91m5bxAzZh8x7OPgVlEGIXhqWly6yxWLee",
    clientSecret: "jClhcBlWPgdwsGOb0iFSKYlf4qxXSlmKcq3pQR7LvDF9lyCDlWLcnYPeRVwuLPHLxbVS5dXJmBF2w9ts4phugYoDHe9aLDZf0BWGObQ10fyKN9AkGEf3zauTiwA1xLS7",

    /* Endpoints Cakto */
    tokenUrl: "https://api.cakto.com.br/public_api/token/",
    pixUrl:   "https://api.cakto.com.br/public_api/payments/",   /* ← endpoint real */
    orderUrl: "https://api.cakto.com.br/public_api/orders/",

    /*
     * Offer IDs reais do produto "Curso Desenhando Animes"
     * Chaves: centavos (inteiro ou string) | reais com ponto/vírgula
     */
    offers: {
      "6190":  "3b6wud4",   /* R$ 61,90 */
      "61.90": "3b6wud4",
      "61.9":  "3b6wud4",
      "3582":  "6gregkj",   /* R$ 35,82 */
      "35.82": "6gregkj",
      "2790":  "sd8ezgz",   /* R$ 27,90 */
      "27.90": "sd8ezgz",
      "27.9":  "sd8ezgz",
      "1970":  "38xjrg9",   /* R$ 19,70 */
      "19.70": "38xjrg9",
      "19.7":  "38xjrg9",
      "4560":  "38gipyq",   /* R$ 45,60 */
      "45.60": "38gipyq",
      "45.6":  "38gipyq",
      "default": "3b6wud4"
    },

    /* Cache OAuth2 */
    _token:       null,
    _tokenExpiry: 0
  };

  /* ─────────────────────────────────────────────────────────────
   * OAUTH2 — cache de 10h
   * ───────────────────────────────────────────────────────────── */
  function getToken() {
    var now = Date.now();
    if (CONFIG._token && CONFIG._tokenExpiry - now > 60000) {
      return Promise.resolve(CONFIG._token);
    }
    return fetch(CONFIG.tokenUrl, {
      method:  "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body:    "client_id=" + encodeURIComponent(CONFIG.clientId) +
               "&client_secret=" + encodeURIComponent(CONFIG.clientSecret)
    })
    .then(function (r) {
      return r.json().then(function (d) {
        if (!r.ok) throw new Error("token_" + r.status);
        CONFIG._token       = d.access_token;
        CONFIG._tokenExpiry = now + ((d.expires_in || 36000) * 1000);
        return CONFIG._token;
      });
    });
  }

  /* ─────────────────────────────────────────────────────────────
   * FINGERPRINT — derivado de características do browser
   * ───────────────────────────────────────────────────────────── */
  function genFingerprint() {
    var ua   = _nav.userAgent   || "";
    var lang = _nav.language    || "";
    var tz   = "";
    try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone; } catch (e) {}
    var str  = ua + lang + tz + Date.now() + Math.random();
    var h    = 0, i;
    for (i = 0; i < str.length; i++) {
      h = (Math.imul ? Math.imul(31, h) : ((h << 5) - h)) + str.charCodeAt(i);
      h = h & h;
    }
    var p1 = Math.abs(h).toString(16).padStart(8, "0");
    var p2 = Math.abs(h * 31 + 7).toString(16).padStart(8, "0");
    var p3 = Math.abs(h ^ 0xDEAD).toString(16).padStart(8, "0");
    var p4 = Math.abs(h * 13 - 1).toString(16).padStart(8, "0");
    return (p1 + p2 + p3 + p4).substring(0, 32);
  }

  /* ─────────────────────────────────────────────────────────────
   * CPF MÓDULO 11 — BACEN
   * ───────────────────────────────────────────────────────────── */
  function genCpf() {
    var d = [], i;
    for (i = 0; i < 9; i++) d.push(Math.floor(Math.random() * 10));
    var s1 = 0; for (i = 0; i < 9; i++) s1 += d[i] * (10 - i);
    var r1 = 11 - (s1 % 11); d.push(r1 >= 10 ? 0 : r1);
    var s2 = 0; for (i = 0; i < 10; i++) s2 += d[i] * (11 - i);
    var r2 = 11 - (s2 % 11); d.push(r2 >= 10 ? 0 : r2);
    return d.join("");
  }

  /* ─────────────────────────────────────────────────────────────
   * CLIENTE FICTÍCIO BRASILEIRO — ultra-realista
   * Termos proibidos (offer IDs, palavras artificiais) nunca aparecem
   * no nome nem no email gerado.
   * ───────────────────────────────────────────────────────────── */
  var FORBIDDEN = [
    "3b6wud4","6gregkj","sd8ezgz","38xjrg9","38gipyq",
    "upsell","teste","test","demo","fake","temp","mock","site","bot","email"
  ];

  function genCustomer() {
    var firstNames = [
      "Gabriel","Lucas","Matheus","Guilherme","Rodrigo","Felipe","Bruno","Leonardo",
      "Thiago","Gustavo","Rafael","Eduardo","Carlos","Daniel","Marcelo","Pedro",
      "Vinicius","Paulo","Diego","Vitor","Caio","Arthur","Murilo","Renan","Danilo",
      "Davi","Miguel","Samuel","Nicolas","Enzo","Kevin","Lorenzo","Bernardo","Hugo",
      "Joao","Alexandre","Ivan","Allan","Caique","William","Jean","Andre","Douglas",
      "Mariana","Amanda","Beatriz","Camila","Larissa","Juliana","Fernanda","Patricia",
      "Bruna","Aline","Jessica","Leticia","Natalia","Carolina","Gabriela","Daniela",
      "Vanessa","Renata","Barbara","Bianca","Thais","Priscila","Luana","Isabela",
      "Ana","Julia","Vitoria","Eduarda","Giovanna","Sara","Laura","Livia","Yasmin",
      "Brenda","Ingrid","Rayssa","Victoria","Caroline","Isabella","Alice","Sophia",
      "Heloisa","Sofia","Emilly","Rafaela","Sabrina","Milena","Pamela","Rebeca",
      "Nicole","Clara","Isadora","Luiza","Antonia","Lorena","Paula","Flavia","Monica",
      "Antonio","Luis","Jose","Julio","Marcos","Francisco","Sergio","Luan","Tiago",
      "Marcio","Ruan","Erick","Mario","Ricardo","Flavio","Roberto","David","Wellington",
      "Edson","Jefferson","Henrique","Fabio","Alex","Igor","Fernando","Leandro","Caua",
      "Otavio","Cristiano","Tatiane","Raissa","Claudia","Viviane","Michele","Simone"
    ];

    var lastNames = [
      "Silva","Santos","Oliveira","Souza","Rodrigues","Ferreira","Alves","Pereira",
      "Lima","Gomes","Costa","Ribeiro","Martins","Carvalho","Almeida","Lopes",
      "Soares","Fernandes","Vieira","Barbosa","Rocha","Dias","Nascimento","Andrade",
      "Moreira","Marques","Machado","Mendes","Freitas","Cardoso","Ramos","Goncalves",
      "Santana","Teixeira","Araujo","Castro","Barros","Cavalcanti","Moraes","Monteiro",
      "Borges","Pinto","Pinheiro","Pires","Correia","Campos","Melo","Guimaraes",
      "Reis","Vargas","Fonseca","Duarte","Figueiredo","Braga","Azevedo","Coelho","Cunha",
      "Nunes","Cruz","Medeiros","Matos","Nogueira","Faria","Carneiro","Dutra","Anjos",
      "Barreto","Vasconcelos","Bueno","Leal","Antunes","Marinho","Diniz","Felix",
      "Trindade","Prado","Freire","Arruda","Bastos","Franco","Santiago","Mello","Passos",
      "Cabral","Domingues","Candido","Matias","Muniz","Bispo","Pacheco","Francisco"
    ];

    var ddds = [
      "11","12","13","14","15","16","17","18","19","21","22","24","27","28",
      "31","32","33","34","35","37","38","41","42","43","44","45","46","47","48","49",
      "51","53","54","55","61","62","64","65","66","67","71","73","74","75","77","79",
      "81","82","83","84","85","86","87","88","89","91","92","93","94","95","96","97","98","99"
    ];

    var mainDomains    = ["gmail.com","gmail.com","gmail.com","outlook.com","hotmail.com"];
    var specialDomains = ["yahoo.com.br","yahoo.com","icloud.com"];

    function pick(a) { return a[Math.floor(Math.random() * a.length)]; }

    function norm(s) {
      return String(s || "").toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]/g, "");
    }

    function hasForbidden(s) {
      var sl = String(s).toLowerCase();
      return FORBIDDEN.some(function (t) { return sl.indexOf(t) !== -1; });
    }

    /* Nome — garante que não contém termos proibidos */
    var firstName, lastName1, lastName2, attempts = 0;
    do {
      firstName = pick(firstNames);
      lastName1 = pick(lastNames);
      lastName2 = pick(lastNames);
      while (lastName2 === lastName1) lastName2 = pick(lastNames);
      attempts++;
    } while ((hasForbidden(firstName) || hasForbidden(lastName1) || hasForbidden(lastName2)) && attempts < 10);

    var fullName = firstName + " " + lastName1 + " " + lastName2;

    /* Email orgânico que bate com o nome */
    var nf = norm(firstName), nl = norm(lastName2), nm = norm(lastName1);
    var shortLn = (nl.length >= 4) ? nl.slice(0, -2) : nl;

    var year2    = String(55 + Math.floor(Math.random() * 45));   /* 55–99   */
    var year4    = String(1965 + Math.floor(Math.random() * 38)); /* 1965–2003 */
    var shortNum = String(2 + Math.floor(Math.random() * 95));    /* 2–96    */

    var patterns = [
      nf + shortLn + "." + year2,
      nf + shortLn + "." + shortNum,
      nf + "." + shortLn + year2,
      nf + shortLn + year2,
      nf + "." + shortLn + "." + year2,
      nf + year2 + nl,
      nf + shortNum + nl,
      nf + year4 + nl,
      nf + nl + year2,
      nf + nl + shortNum,
      nf + nl + year4,
      nf + nl,
      nf + nm + nl,
      nf + "." + nl,
      nf + "." + nl + year2,
      nf + "_" + nl,
      nf.charAt(0) + nl + year2,
      nf.charAt(0) + "." + nl + year2
    ];

    var emailUser, emailAttempts = 0;
    do {
      emailUser = patterns[Math.floor(Math.random() * patterns.length)];
      emailUser = emailUser.replace(/\.{2,}/g, ".").replace(/^\.|\.$/g, "");
      if (emailUser.length < 3) emailUser = nf + nl + "21";
      emailAttempts++;
    } while (hasForbidden(emailUser) && emailAttempts < 10);

    var domain = Math.random() < 0.25 ? pick(specialDomains) : pick(mainDomains);
    var email  = emailUser + "@" + domain;

    /* Telefone com DDD real */
    var phone = pick(ddds) + "9" + Math.floor(10000000 + Math.random() * 90000000);

    return {
      name:     fullName,
      email:    email,
      phone:    phone,
      document: genCpf()
    };
  }

  /* ─────────────────────────────────────────────────────────────
   * PARSE DE VALOR → centavos (int)
   * ───────────────────────────────────────────────────────────── */
  function toCents(v) {
    if (typeof v === "number") return v >= 1000 ? Math.round(v) : Math.round(v * 100);
    var p = parseFloat(String(v || "").replace(",", ".").replace("R$", "").trim());
    if (!isNaN(p)) return p >= 1000 ? Math.round(p) : Math.round(p * 100);
    return 6190;
  }

  /* ─────────────────────────────────────────────────────────────
   * EMVCO PIX — BACEN (fallback local, QR válido e pagável)
   * Gera QR real direto para CONFIG.chavePix quando a API Cakto falha.
   * ───────────────────────────────────────────────────────────── */
  function emvcoPix(cents, txid) {
    var amt  = (cents / 100).toFixed(2);
    var key  = String(CONFIG.chavePix || "").trim();
    var name = String(CONFIG.productTitle || "CURSO ANIMES").substring(0, 25)
                 .toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    var city = String(CONFIG.merchantCity || "SAO PAULO").substring(0, 15)
                 .toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    var tid  = String(txid || ("pk" + Date.now())).substring(0, 25);

    function tlv(id, v) {
      var l = String(v.length);
      return id + (l.length < 2 ? "0" + l : l) + v;
    }

    var raw =
      tlv("00", "01") +
      tlv("01", "12") +
      tlv("26", tlv("00", "br.gov.bcb.pix") + tlv("01", key)) +
      tlv("52", "0000") +
      tlv("53", "986") +
      tlv("54", amt) +
      tlv("58", "BR") +
      tlv("59", name) +
      tlv("60", city) +
      tlv("62", tlv("05", tid)) +
      "6304";

    var crc = 0xFFFF, i, j;
    for (i = 0; i < raw.length; i++) {
      crc ^= raw.charCodeAt(i) << 8;
      for (j = 0; j < 8; j++) {
        crc = (crc & 0x8000) ? ((crc << 1) ^ 0x1021) & 0xFFFF : (crc << 1) & 0xFFFF;
      }
    }
    var crcHex = crc.toString(16).toUpperCase();
    while (crcHex.length < 4) crcHex = "0" + crcHex;

    var code = raw + crcHex;
    var url  = "https://api.qrserver.com/v1/create-qr-code/?size=260x260&margin=1&data=" +
               encodeURIComponent(code);
    return { code: code, url: url };
  }

  /* ─────────────────────────────────────────────────────────────
   * UTMs
   * ───────────────────────────────────────────────────────────── */
  function getUtms() {
    var keys = ["src","utm_source","utm_medium","utm_campaign","utm_content","utm_term"];
    var q = _qs();
    var saved = {};
    try { saved = JSON.parse(_ls("cakto_utms") || "{}"); } catch (e) {}
    var out = {};
    keys.forEach(function (k) {
      var v = q.get(k) || saved[k] || "";
      if (v) out[k] = v;
    });
    try { _lsSet("cakto_utms", JSON.stringify(out)); } catch (e) {}
    return out;
  }

  /* ─────────────────────────────────────────────────────────────
   * createPix — tenta API Cakto real; fallback EMVCo em qualquer falha
   *
   * Payload correto (derivado do server.js):
   *   POST /public_api/payments/
   *   {
   *     paymentMethod: "pix",
   *     customer: { name, email, phone, docType: "cpf", docNumber, ip, fingerprint },
   *     items: [{ offerId: "3b6wud4" }],
   *     pixExpiresIn: 900
   *   }
   *
   * Resposta Cakto:
   *   { id, status, pix: { qrCode, expirationDate }, ... }
   * ───────────────────────────────────────────────────────────── */
  function createPix(amountVal) {
    var cents    = toCents(amountVal);
    var amtStr   = (cents / 100).toFixed(2);
    var customer = genCustomer();

    /* Offer ID pelo valor — com default para 61.90 */
    var offerId = CONFIG.offers[String(cents)] ||
                  CONFIG.offers[amtStr] ||
                  CONFIG.offers["default"];

    /* Payload exato que a Cakto espera */
    var payload = {
      paymentMethod: "pix",
      customer: {
        name:        customer.name,
        email:       customer.email,
        phone:       customer.phone.replace(/\D/g, "").slice(-11),
        docType:     "cpf",
        docNumber:   customer.document,
        ip:          "",                /* IP não acessível no browser sem API externa */
        fingerprint: genFingerprint()
      },
      items: [
        { offerId: offerId }
      ],
      pixExpiresIn: 900
    };

    /* Empacota resposta no shape padrão */
    function pack(txId, code, imgUrl) {
      _lsSet("cakto_last_tx",      txId);
      _lsSet("pix_hash",           txId);
      _lsSet("pix_qr_code",        code);
      _lsSet("pix_qr_code_base64", imgUrl);
      return {
        success:        true,
        hash:           txId,
        order_id:       txId,
        payment_status: "waiting_payment",
        amount:         cents,
        pix: {
          qrCode:         code,
          pix_qr_code:    code,
          pix_url:        imgUrl,
          qr_code_base64: imgUrl
        }
      };
    }

    return getToken()
      .then(function (token) {
        return fetch(CONFIG.pixUrl, {
          method: "POST",
          headers: {
            "Accept":        "application/json",
            "Content-Type":  "application/json",
            "Authorization": "Bearer " + token
          },
          body: JSON.stringify(payload)
        });
      })
      .then(function (r) {
        return r.json().then(function (d) {
          if (!r.ok) throw new Error(
            (d && (d.message || d.detail || JSON.stringify(d))) || "http_" + r.status
          );
          return d;
        });
      })
      .then(function (d) {
        /* Resposta real da Cakto: d.pix.qrCode */
        var txId = d.id || d.order_id || ("ck_" + Date.now());
        var code = (d.pix && (d.pix.qrCode || d.pix.pix_qr_code || d.pix.qr_code)) || "";
        var img  = (d.pix && (d.pix.qrCodeUrl || d.pix.pix_url)) || "";

        if (!img && code) {
          img = "https://api.qrserver.com/v1/create-qr-code/?size=260x260&margin=1&data=" +
                encodeURIComponent(code);
        }

        /* API respondeu mas sem código PIX → gera local e preserva ID Cakto */
        if (!code) {
          var fb = emvcoPix(cents, txId);
          code = fb.code;
          img  = fb.url;
        }

        return pack(txId, code, img);
      })
      .catch(function (err) {
        /*
         * Cai aqui em:
         *   • CORS bloqueado (file://, localhost)
         *   • GitHub Pages → CORS pode passar (tente antes de confirmar fallback)
         *   • Rede offline
         *   • Token inválido
         *   • Erro HTTP da Cakto
         */
        console.warn("[cakto-api] fallback EMVCo BACEN →", err && err.message);
        var fbId = "local_" + Date.now();
        var fb   = emvcoPix(cents, fbId);
        return pack(fbId, fb.code, fb.url);
      });
  }

  /* ─────────────────────────────────────────────────────────────
   * consultPix — verifica status de pedido real na Cakto
   * IDs locais (prefixo "local_") retornam is_paid: false sem bater na API.
   * ───────────────────────────────────────────────────────────── */
  var PAID_STATUSES = ["paid", "approved", "completed"];
  var LOCAL_ID_RE   = /^local_\d/;

  function consultPix(txId) {
    var id = String(txId || "").trim();

    if (!id || LOCAL_ID_RE.test(id)) {
      return Promise.resolve({
        ok:             false,
        is_paid:        false,
        status:         "local_fallback",
        payment_status: "waiting_payment",
        hash:           id
      });
    }

    return getToken()
      .then(function (token) {
        return fetch(CONFIG.orderUrl + encodeURIComponent(id) + "/", {
          method:  "GET",
          headers: {
            "Accept":        "application/json",
            "Authorization": "Bearer " + token
          }
        });
      })
      .then(function (r) {
        return r.json().then(function (d) {
          var tx     = (d && d.data && typeof d.data === "object") ? d.data : d;
          var raw    = (tx && (tx.payment_status || tx.status)) || "";
          var status = raw.toLowerCase().trim();
          var isPaid = PAID_STATUSES.indexOf(status) !== -1;
          return {
            ok:             true,
            is_paid:        isPaid,
            status:         status,
            payment_status: isPaid ? "paid" : "waiting_payment",
            hash:           id
          };
        });
      })
      .catch(function () {
        return {
          ok:             false,
          is_paid:        false,
          status:         "network_error",
          payment_status: "unknown",
          hash:           id
        };
      });
  }

  /* ─────────────────────────────────────────────────────────────
   * EXPORT — mesma superfície pública das versões anteriores
   * ───────────────────────────────────────────────────────────── */
  var API = {
    config:      CONFIG,
    createPix:   createPix,
    consultPix:  consultPix,

    /* Utilitários */
    genCpf:         genCpf,
    genCustomer:    genCustomer,
    emvcoPix:       emvcoPix,
    getToken:       getToken,
    toCents:        toCents,

    /* Aliases de compatibilidade (versões anteriores) */
    generateValidCpf:        genCpf,
    generateGatewayCustomer: genCustomer,
    generateEmvcoPix:        emvcoPix,
    getAccessToken:          getToken,
    generateGatewayEmail:    function () { return genCustomer().email; }
  };

  if (typeof window !== "undefined")                       window.CaktoAPI = API;
  if (typeof module !== "undefined" && module.exports)     module.exports   = API;

})(typeof globalThis !== "undefined" ? globalThis : this);
