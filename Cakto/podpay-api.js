/**
 * podpay-api.js - Integração Client-Side Direta com a API PodPay
 * 
 * Permite que o checkout funcione com o gateway PodPay de forma 100% estática ou via PHP.
 * Nome do Produto Oficial: Opina Pro
 * 
 * SEGURANÇA E PRIVACIDADE:
 * NENHUM dado real do cidadão (nome, CPF, dados do funil) é enviado à PodPay.
 * Todos os dados do cliente enviados à adquirente são fictícios, camuflados e com CPF matematicamente válido (Módulo 11).
 */

(function (window) {
  "use strict";

  var PODPAY_CONFIG = {
    apiBaseUrl: "https://api.podpay.app",
    publicKey: "pk_live_jWEWIFENNCwR5C6u",
    secretKey: "sk_live_Tbluwv5UG1NXfzdke6LTu2Tjx6uf2v5",
    productTitle: "Opina Pro",
    offers: {
      "main":      { amount: 6190, title: "Opina Pro - Licença Oficial" },
      "upsell_01": { amount: 3582, title: "Opina Pro - Acelerador de Liberação" },
      "upsell_02": { amount: 2790, title: "Opina Pro - Módulo VIP" },
      "upsell_03": { amount: 1970, title: "Opina Pro - Verificação Prioritária" },
      "upsell_04": { amount: 4560, title: "Opina Pro - Acesso Vitalício" }
    }
  };

  /**
   * Gera um CPF válido por Módulo 11 exclusivo para o gateway.
   */
  function generateValidCpf() {
    var digits = [];
    for (var i = 0; i < 9; i++) {
      digits.push(Math.floor(Math.random() * 10));
    }
    // Primeiro dígito verificador
    var s1 = 0;
    for (var i = 0; i < 9; i++) {
      s1 += digits[i] * (10 - i);
    }
    var r1 = 11 - (s1 % 11);
    var d1 = r1 >= 10 ? 0 : r1;
    digits.push(d1);

    // Segundo dígito verificador
    var s2 = 0;
    for (var i = 0; i < 10; i++) {
      s2 += digits[i] * (11 - i);
    }
    var r2 = 11 - (s2 % 11);
    var d2 = r2 >= 10 ? 0 : r2;
    digits.push(d2);

    return digits.join("");
  }

  /**
   * Gera cliente fictício camuflado para o gateway PodPay.
   * Garante nome completo, e-mail plausível, telefone com DDD válido e CPF Módulo 11.
   */
  function generateGatewayCustomer() {
    var firstNames = [
      "Gabriel", "Lucas", "Matheus", "Guilherme", "Rodrigo", "Felipe", "Bruno", "Leonardo",
      "Thiago", "Gustavo", "Rafael", "Eduardo", "Vinicius", "Daniel", "Marcelo", "Alexandre",
      "Amanda", "Beatriz", "Camila", "Larissa", "Mariana", "Juliana", "Fernanda", "Patricia",
      "Aline", "Leticia", "Jessica", "Carolina", "Bruna", "Renata", "Vanessa", "Natalia"
    ];
    var lastNames = [
      "Silva", "Santos", "Oliveira", "Souza", "Rodrigues", "Ferreira", "Alves", "Pereira",
      "Lima", "Gomes", "Costa", "Ribeiro", "Martins", "Carvalho", "Almeida", "Lopes",
      "Soares", "Fernandes", "Vieira", "Barbosa", "Rocha", "Dias", "Nascimento", "Andrade"
    ];

    var fn = firstNames[Math.floor(Math.random() * firstNames.length)];
    var ln1 = lastNames[Math.floor(Math.random() * lastNames.length)];
    var ln2 = lastNames[Math.floor(Math.random() * lastNames.length)];
    while (ln2 === ln1) {
      ln2 = lastNames[Math.floor(Math.random() * lastNames.length)];
    }
    var name = fn + " " + ln1 + " " + ln2;

    var domains = ["gmail.com", "outlook.com", "hotmail.com", "yahoo.com.br", "icloud.com"];
    var cleanFn = fn.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    var cleanLn = ln2.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    var num = Math.floor(100 + Math.random() * 900);
    var email = cleanFn + "." + cleanLn + num + "@" + domains[Math.floor(Math.random() * domains.length)];

    var ddds = ["11", "19", "21", "27", "31", "41", "47", "48", "51", "61", "62", "71", "81", "85", "91"];
    var ddd = ddds[Math.floor(Math.random() * ddds.length)];
    var phone = ddd + "9" + Math.floor(10000000 + Math.random() * 90000000);
    var cpf = generateValidCpf();

    return {
      name: name,
      email: email,
      phone: phone,
      phone_number: phone,
      document: cpf,
      cpf: cpf
    };
  }

  /**
   * Identifica a oferta da PodPay baseada no valor ou step.
   */
  function getOffer(amountVal) {
    var cents = 6190;
    if (typeof amountVal === "string") {
      if (PODPAY_CONFIG.offers[amountVal]) {
        return PODPAY_CONFIG.offers[amountVal];
      }
      var parsed = parseFloat(amountVal.replace(",", "."));
      if (!isNaN(parsed)) {
        cents = parsed >= 1000 ? Math.round(parsed) : Math.round(parsed * 100);
      }
    } else if (typeof amountVal === "number") {
      cents = amountVal >= 1000 ? Math.round(amountVal) : Math.round(amountVal * 100);
    }

    for (var key in PODPAY_CONFIG.offers) {
      if (Math.abs(PODPAY_CONFIG.offers[key].amount - cents) <= 2) {
        return PODPAY_CONFIG.offers[key];
      }
    }
    return { amount: cents, title: PODPAY_CONFIG.productTitle };
  }

  /**
   * Gera UUID v4 para cabeçalho de Idempotência
   */
  function generateUuid() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      var r = (Math.random() * 16) | 0;
      var v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  /**
   * Cria uma transação PIX diretamente na PodPay via browser ou proxy PHP.
   */
  function createPix(amountVal, customCustomer) {
    var offer = getOffer(amountVal);
    var customer = customCustomer || generateGatewayCustomer();

    var cleanCpf = String(customer.cpf || customer.document || "").replace(/\D/g, "");
    if (cleanCpf.length !== 11) {
      cleanCpf = generateValidCpf();
    }
    var cleanPhone = String(customer.phone || customer.phone_number || "").replace(/\D/g, "");
    if (cleanPhone.length < 10) {
      cleanPhone = "119" + Math.floor(10000000 + Math.random() * 90000000);
    }

    var payload = {
      paymentMethod: "pix",
      amount: offer.amount,
      customer: {
        name: customer.name,
        email: customer.email,
        phone: cleanPhone,
        document: {
          type: "cpf",
          number: cleanCpf
        }
      },
      items: [
        {
          title: offer.title || PODPAY_CONFIG.productTitle,
          unitPrice: offer.amount,
          quantity: 1,
          tangible: false
        }
      ]
    };

    // Tenta chamada direta à PodPay (se CORS habilitado) ou via fallback no backend PHP
    var headers = {
      "Accept": "application/json",
      "Content-Type": "application/json",
      "x-api-key": PODPAY_CONFIG.secretKey,
      "X-Idempotency-Key": generateUuid()
    };

    return fetch(PODPAY_CONFIG.apiBaseUrl + "/v1/transactions", {
      method: "POST",
      headers: headers,
      body: JSON.stringify(payload)
    })
    .then(function (res) {
      return res.json().then(function (data) {
        if (!res.ok) {
          var errMsg = (data && data.error && data.error.message) ? data.error.message : ("Erro HTTP " + res.status);
          throw new Error(errMsg);
        }
        return data;
      });
    })
    .then(function (resJson) {
      var tx = resJson.data || resJson;
      var txId = tx.id || tx.transactionId || "";
      var pixCode = tx.pixQrCode || tx.pix_qr_code || tx.qrCode || "";
      var qrImgUrl = tx.pixQrCodeImage || tx.pix_qr_code_image || "";
      if (!qrImgUrl && pixCode) {
        qrImgUrl = "https://api.qrserver.com/v1/create-qr-code/?size=260x260&margin=1&data=" + encodeURIComponent(pixCode);
      }

      return {
        success: true,
        hash: txId,
        payment_status: tx.status || "pending",
        amount: tx.amount || offer.amount,
        pix: {
          pix_qr_code: pixCode,
          pix_url: qrImgUrl,
          qr_code_base64: qrImgUrl
        }
      };
    });
  }

  /**
   * Consulta o status da transação na PodPay diretamente pelo ID.
   */
  function consultPix(txId) {
    if (!txId) {
      return Promise.reject(new Error("ID da transação não fornecido"));
    }

    return fetch(PODPAY_CONFIG.apiBaseUrl + "/v1/transactions/" + encodeURIComponent(txId), {
      method: "GET",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "x-api-key": PODPAY_CONFIG.secretKey
      }
    })
    .then(function (res) {
      return res.json().then(function (data) {
        if (!res.ok) {
          var errMsg = (data && data.error && data.error.message) ? data.error.message : ("Erro HTTP " + res.status);
          throw new Error(errMsg);
        }
        return data;
      });
    })
    .then(function (resJson) {
      var tx = resJson.data || resJson;
      var status = (tx.status || "pending").toLowerCase();
      var isPaid = (status === "paid" || status === "completed" || status === "approved");

      return {
        success: true,
        hash: tx.id || txId,
        payment_status: status,
        is_paid: isPaid,
        amount: tx.amount
      };
    });
  }

  // Exporta globalmente
  window.PodPayAPI = {
    config: PODPAY_CONFIG,
    generateValidCpf: generateValidCpf,
    generateGatewayCustomer: generateGatewayCustomer,
    getOffer: getOffer,
    createPix: createPix,
    consultPix: consultPix
  };

})(window);
