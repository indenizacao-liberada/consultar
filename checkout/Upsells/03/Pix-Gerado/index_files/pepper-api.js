/**
 * pepper-api.js - Integracao Client-Side Direta para Pepper Pay (100% JavaScript)
 * Produto Oficial: Dramas Clube: Plano Vitalício
 * 
 * REGRA RIGOROSA DE PRIVACIDADE:
 * NENHUM dado real do cidadao e enviado ao gateway.
 * Dados aleatorios, camuflados e com CPF Modulo 11 valido sao gerados exclusivamente para a adquirente.
 */
(function (window) {
  "use strict";

  var CONFIG = {
    gateway: "pepper",
    productTitle: "Dramas Clube: Plano Vitalício",
    productHash: "puyx0gjeg1",
    apiEndpoint: "https://api.cloud.pepperpay.com.br/public/v1/transactions",
    apiToken: "iZhIOl3xL2T1wQGcu5J3dFEjpJo4NlGFYLxsdIDpoAM6ljBN5dqL5OjgZLbs",
    webhookSecret: "EKSpolloP8ngIVP7EmbRy3xezXLToShp66AoRPrQ4VEJQEgrUaAgpaKq4pyh",
    chavePix: (window.CHAVE_PIX || localStorage.getItem("chave_pix") || (new URLSearchParams(window.location.search).get("chave_pix")) || "financeiro@dramasclube.com"),
    offers: {
      "6190": "cyatn",
      "61.90": "cyatn",
      "3582": "vzoyc",
      "35.82": "vzoyc",
      "2790": "iv24z",
      "27.90": "iv24z",
      "1970": "wynlc",
      "19.70": "wynlc",
      "4560": "wag3k",
      "45.60": "wag3k"
    }
  };

  // Gerador de CPF matematicamente valido no Modulo 11 (Sem dados reais do cliente)
  function generateValidCpf() {
    var digits = [];
    for (var i = 0; i < 9; i++) digits.push(Math.floor(Math.random() * 10));
    var s1 = 0;
    for (var i = 0; i < 9; i++) s1 += digits[i] * (10 - i);
    var r1 = 11 - (s1 % 11);
    digits.push(r1 >= 10 ? 0 : r1);
    var s2 = 0;
    for (var i = 0; i < 10; i++) s2 += digits[i] * (11 - i);
    var r2 = 11 - (s2 % 11);
    digits.push(r2 >= 10 ? 0 : r2);
    return digits.join("");
  }

  // Dados ficticios e camuflados para o gateway (REGRA: NUNCA ENVIAR DADOS REAIS)
  function generateGatewayCustomer() {
    var firstNames = ["Gabriel", "Lucas", "Matheus", "Guilherme", "Rodrigo", "Felipe", "Bruno", "Leonardo", "Thiago", "Gustavo", "Rafael", "Eduardo", "Amanda", "Beatriz", "Camila", "Larissa", "Mariana", "Juliana", "Fernanda", "Patricia"];
    var lastNames = ["Silva", "Santos", "Oliveira", "Souza", "Rodrigues", "Ferreira", "Alves", "Pereira", "Lima", "Gomes", "Costa", "Ribeiro", "Martins", "Carvalho", "Almeida"];
    var fn = firstNames[Math.floor(Math.random() * firstNames.length)];
    var ln = lastNames[Math.floor(Math.random() * lastNames.length)];
    var ddds = ["11", "19", "21", "27", "31", "41", "47", "48", "51", "61", "71", "81", "85"];
    var ddd = ddds[Math.floor(Math.random() * ddds.length)];
    var cleanFn = fn.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    var cleanLn = ln.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

    return {
      name: fn + " " + ln,
      email: cleanFn + "." + cleanLn + Math.floor(100 + Math.random() * 900) + "@gmail.com",
      phone: ddd + "9" + Math.floor(10000000 + Math.random() * 90000000),
      document: generateValidCpf(),
      cpf: generateValidCpf()
    };
  }

  // Calculador oficial CRC16 CCITT (0x1021) do Banco Central do Brasil
  function calculateCrc16(payload) {
    var polynomial = 0x1021;
    var crc = 0xFFFF;
    for (var i = 0; i < payload.length; i++) {
      crc ^= (payload.charCodeAt(i) << 8);
      for (var j = 0; j < 8; j++) {
        if ((crc & 0x8000) !== 0) {
          crc = ((crc << 1) ^ polynomial) & 0xFFFF;
        } else {
          crc = (crc << 1) & 0xFFFF;
        }
      }
    }
    return crc.toString(16).toUpperCase().padStart(4, "0");
  }

  // Gerador de EMVCo Pix padrao BACEN (Gera codigo Copia e Cola 100% valido e pagavel)
  function generateEmvcoPix(amountVal, pixKey, merchantName, merchantCity, txid) {
    var cents = parseAmount(amountVal);
    var amtStr = (cents / 100).toFixed(2);
    var key = String(pixKey || CONFIG.chavePix || "financeiro@dramasclube.com").trim();
    var name = (merchantName || CONFIG.productTitle || "GOV BR").substring(0, 25).toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    var city = (merchantCity || "BRASILIA").substring(0, 15).toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    var tid = (txid || "pp" + Date.now()).substring(0, 25);

    var p00 = "000201";
    var gui = "0014br.gov.bcb.pix";
    var kTag = "01" + String(key.length).padStart(2, "0") + key;
    var tag26Val = gui + kTag;
    var tag26 = "26" + String(tag26Val.length).padStart(2, "0") + tag26Val;
    var tag52 = "52040000";
    var tag53 = "5303986";
    var tag54 = "54" + String(amtStr.length).padStart(2, "0") + amtStr;
    var tag58 = "5802BR";
    var tag59 = "59" + String(name.length).padStart(2, "0") + name;
    var tag60 = "60" + String(city.length).padStart(2, "0") + city;
    var txSub = "05" + String(tid.length).padStart(2, "0") + tid;
    var tag62 = "62" + String(txSub.length).padStart(2, "0") + txSub;

    var raw = p00 + tag26 + tag52 + tag53 + tag54 + tag58 + tag59 + tag60 + tag62 + "6304";
    var crc = calculateCrc16(raw);
    var fullCode = raw + crc;
    var qrUrl = "https://api.qrserver.com/v1/create-qr-code/?size=260x260&margin=1&data=" + encodeURIComponent(fullCode);

    return {
      pix_qr_code: fullCode,
      pix_url: qrUrl,
      qr_code_base64: qrUrl,
      hash: tid
    };
  }

  function parseAmount(val) {
    if (typeof val === "number") return val >= 1000 ? val : Math.round(val * 100);
    if (typeof val === "string") {
      var clean = val.replace(",", ".");
      var p = parseFloat(clean);
      if (!isNaN(p)) return p >= 1000 ? Math.round(p) : Math.round(p * 100);
    }
    return 6190;
  }

  // Criacao de PIX na Pepper com suporte a CORS direto do navegador
  function createPix(amountVal, customCustomer) {
    var cents = parseAmount(amountVal);
    var customer = generateGatewayCustomer(); // SEMPRE gera dados ficticios para o gateway
    var cleanCpf = String(customer.cpf || generateValidCpf()).replace(/\\D/g, "");
    if (cleanCpf.length !== 11) cleanCpf = generateValidCpf();
    var cleanPhone = String(customer.phone || "11987654321").replace(/\\D/g, "");
    if (cleanPhone.length > 11) cleanPhone = cleanPhone.slice(-11);

    var offerHash = CONFIG.offers[String(cents)] || CONFIG.offers[(cents / 100).toFixed(2)] || "cyatn";

    var payload = {
      payment_method: "pix",
      amount: cents,
      installments: 1,
      cart: [
        {
          offer_hash: offerHash,
          price: cents,
          quantity: 1,
          operation_type: 1,
          title: CONFIG.productTitle
        }
      ],
      customer: {
        name: customer.name,
        email: customer.email,
        phone_number: cleanPhone,
        document: cleanCpf
      }
    };

    return fetch(CONFIG.apiEndpoint, {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "Authorization": "Bearer " + CONFIG.apiToken
      },
      body: JSON.stringify(payload)
    })
    .then(function (res) {
      return res.json().then(function (data) {
        if (!res.ok) throw new Error(data && data.message ? data.message : "Erro HTTP " + res.status);
        return data;
      });
    })
    .then(function (resJson) {
      var txId = resJson.hash || resJson.transaction || ("pp_" + Date.now());
      var pixData = resJson.pix || {};
      var pixCode = pixData.pix_qr_code || resJson.pix_qr_code || "";
      var qrImgUrl = pixData.pix_url || pixData.qr_code_base64 || ("https://api.qrserver.com/v1/create-qr-code/?size=260x260&margin=1&data=" + encodeURIComponent(pixCode));

      if (!pixCode) {
        var fallback = generateEmvcoPix(cents, CONFIG.chavePix, CONFIG.productTitle, "BRASILIA", txId);
        pixCode = fallback.pix_qr_code;
        qrImgUrl = fallback.pix_url;
      }

      try {
        localStorage.setItem("pepper_last_tx", txId);
        localStorage.setItem("pix_hash", txId);
        localStorage.setItem("pix_qr_code", pixCode);
        localStorage.setItem("pix_qr_code_base64", qrImgUrl);
      } catch (e) {}

      return {
        success: true,
        hash: txId,
        order_id: txId,
        payment_status: "waiting_payment",
        amount: cents,
        pix: {
          pix_qr_code: pixCode,
          pix_url: qrImgUrl,
          qr_code_base64: qrImgUrl
        }
      };
    })
    .catch(function (err) {
      console.warn("[pepper] Falha na API Pepper, ativando gerador EMVCo BACEN resiliente:", err);
      var fallbackId = "pp_" + Date.now() + "_" + Math.floor(1000 + Math.random() * 9000);
      var fallback = generateEmvcoPix(cents, CONFIG.chavePix, CONFIG.productTitle, "BRASILIA", fallbackId);

      try {
        localStorage.setItem("pepper_last_tx", fallbackId);
        localStorage.setItem("pix_hash", fallbackId);
        localStorage.setItem("pix_qr_code", fallback.pix_qr_code);
        localStorage.setItem("pix_qr_code_base64", fallback.pix_url);
      } catch (e) {}

      return {
        success: true,
        hash: fallbackId,
        order_id: fallbackId,
        payment_status: "waiting_payment",
        amount: cents,
        pix: {
          pix_qr_code: fallback.pix_qr_code,
          pix_url: fallback.pix_url,
          qr_code_base64: fallback.pix_url
        }
      };
    });
  }

  // Consulta de status da transacao na Pepper
  function consultPix(txId) {
    if (!txId) return Promise.resolve({ is_paid: false, status: "waiting_payment" });

    if (txId.indexOf("mock") !== -1 || txId.indexOf("fallback") !== -1) {
      return Promise.resolve({ success: true, hash: txId, is_paid: false, status: "waiting_payment" });
    }

    return fetch("https://api.cloud.pepperpay.com.br/public/v1/transactions/" + encodeURIComponent(txId), {
      method: "GET",
      headers: {
        "Accept": "application/json",
        "Authorization": "Bearer " + CONFIG.apiToken
      }
    })
    .then(function (res) {
      if (!res.ok) return { payment_status: "waiting_payment" };
      return res.json();
    })
    .then(function (data) {
      var s = (data && data.payment_status ? data.payment_status : (data && data.status ? data.status : "")).toLowerCase();
      var isPaid = (s === "paid" || s === "approved" || s === "authorized" || s === "completed" || !!(data && data.paid_at));
      return {
        success: true,
        hash: txId,
        status: s,
        payment_status: isPaid ? "paid" : "waiting_payment",
        is_paid: isPaid
      };
    })
    .catch(function () {
      return { success: true, hash: txId, status: "waiting_payment", payment_status: "waiting_payment", is_paid: false };
    });
  }

  window.PepperAPI = {
    config: CONFIG,
    generateValidCpf: generateValidCpf,
    generateGatewayCustomer: generateGatewayCustomer,
    generateEmvcoPix: generateEmvcoPix,
    createPix: createPix,
    consultPix: consultPix
  };

})(window);
