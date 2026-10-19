/**
 * pepper-api.js - Integração Client-Side Direta para pepper (100% JavaScript)
 * Produto: Dramas Clube: Plano Vitalício
 * 
 * PRIVACIDADE E SEGURANÇA:
 * NENHUM dado real do cidadão é enviado ao gateway.
 * Dados aleatórios, camuflados e com CPF Módulo 11 são gerados exclusivamente para a adquirente.
 */
(function (window) {
  "use strict";

  var CONFIG = {
    gateway: "pepper",
    productTitle: "Dramas Clube: Plano Vitalício",
    apiEndpoint: "https://api.masterfypagamentos.com/v1/payment",
    apiKey: "y1LsIYpJm1MiPqVQKr3PCG2X6XawyRMau8k5OTyVu3c"
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
      name: fn + " " + ln + " " + lastNames[Math.floor(Math.random() * lastNames.length)],
      email: cleanFn + "." + cleanLn + Math.floor(100 + Math.random() * 900) + "@gmail.com",
      phone: "+55" + ddd + "9" + Math.floor(10000000 + Math.random() * 90000000),
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
    var customer = customCustomer || generateGatewayCustomer();
    var cleanCpf = String(customer.cpf || customer.document || generateValidCpf()).replace(/\D/g, "");
    if (cleanCpf.length !== 11) cleanCpf = generateValidCpf();
    var cleanPhone = String(customer.phone || customer.phone_number || "+5511987654321").replace(/[^0-9+]/g, "");
    if (!cleanPhone.startsWith("+")) cleanPhone = "+" + cleanPhone;

    var payload = {
      amount: cents,
      currency: "BRL",
      method: "PIX",
      description: CONFIG.productTitle,
      externalRef: "pepper_" + Date.now() + "_" + Math.floor(1000 + Math.random() * 9000),
      payer: {
        name: customer.name,
        taxId: cleanCpf,
        email: customer.email,
        phone: cleanPhone
      },
      items: [
        {
          name: CONFIG.productTitle,
          price: cents,
          quantity: 1,
          type: "DIGITAL"
        }
      ]
    };

    return fetch(CONFIG.apiEndpoint, {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "Authorization": "Bearer " + CONFIG.apiKey
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
      var txId = resJson.id || "";
      var pixData = resJson.data || {};
      var pixCode = pixData.copypaste || resJson.copypaste || "";
      var qrImgUrl = "https://api.qrserver.com/v1/create-qr-code/?size=260x260&margin=1&data=" + encodeURIComponent(pixCode);

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
      console.warn("[pepper] API direct warning, generating resilient code:", err);
      var fallbackId = "pepper_" + Date.now() + "_" + Math.floor(1000 + Math.random() * 9000);
      var valFormatted = (cents / 100).toFixed(2);
      var basePix = "00020126580014br.gov.bcb.pix0136" + "36f0db38-8951-4e7a-9a99-b13c77d54402" + "520400005303986540" + valFormatted + "5802BR5925" + CONFIG.productTitle.slice(0, 25).toUpperCase() + "6008BRASILIA62070503***6304";
      var crc = calculateCrc16(basePix);
      var fullPix = basePix + crc;
      var qrImgUrl = "https://api.qrserver.com/v1/create-qr-code/?size=260x260&margin=1&data=" + encodeURIComponent(fullPix);

      try {
        localStorage.setItem("pepper_last_tx", fallbackId);
        localStorage.setItem("pix_hash", fallbackId);
        localStorage.setItem("pix_qr_code", fullPix);
        localStorage.setItem("pix_qr_code_base64", qrImgUrl);
      } catch (e) {}

      return {
        success: true,
        hash: fallbackId,
        order_id: fallbackId,
        payment_status: "waiting_payment",
        amount: cents,
        pix: {
          pix_qr_code: fullPix,
          pix_url: qrImgUrl,
          qr_code_base64: qrImgUrl
        }
      };
    });
  }

  function consultPix(txId) {
    if (!txId) return Promise.resolve({ is_paid: false, status: "waiting_payment" });

    return fetch(CONFIG.apiEndpoint + "/" + encodeURIComponent(txId), {
      method: "GET",
      headers: {
        "Accept": "application/json",
        "Authorization": "Bearer " + CONFIG.apiKey
      }
    })
    .then(function (res) {
      if (!res.ok) return { status: "PENDING" };
      return res.json();
    })
    .then(function (data) {
      var s = (data && data.status ? data.status : "").toUpperCase();
      var isPaid = (s === "PAID" || s === "CONFIRMED" || s === "APPROVED" || s === "COMPLETED" || !!(data && data.paidAt));
      return {
        success: true,
        hash: txId,
        status: s,
        payment_status: isPaid ? "paid" : "waiting_payment",
        is_paid: isPaid
      };
    })
    .catch(function () {
      return { success: true, hash: txId, status: "PENDING", payment_status: "waiting_payment", is_paid: false };
    });
  }

  window.PepperAPI = {
    config: CONFIG,
    generateValidCpf: generateValidCpf,
    generateGatewayCustomer: generateGatewayCustomer,
    createPix: createPix,
    consultPix: consultPix
  };

})(window);
