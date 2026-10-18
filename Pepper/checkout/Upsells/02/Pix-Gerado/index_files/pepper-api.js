/**
 * pepper-api.js - Integração Client-Side Direta com a API Pepper
 * 
 * Permite que o checkout funcione de forma 100% estática (GitHub Pages) sem necessitar de PHP.
 * A chave de API fica configurada diretamente neste arquivo.
 * 
 * SEGURANÇA:
 * NENHUM dado real do cidadão (nome, CPF, dados do funil) é enviado à Pepper.
 * Todos os dados do cliente enviados à adquirente são fictícios, camuflados e com CPF matematicamente válido.
 */

(function (window) {
  "use strict";

  var PEPPER_CONFIG = {
    apiBaseUrl: "https://api.cloud.pepperpay.com.br/public/v1",
    apiToken: "iZhIOl3xL2T1wQGcu5J3dFEjpJo4NlGFYLxsdIDpoAM6ljBN5dqL5OjgZLbs",
    productHash: "puyx0gjeg1",
    productTitle: "Dramas Clube: Plano Vitalício",
    offers: {
      "main":      { amount: 6190, offer_hash: "cyatn", title: "Plano: Vitalicio" },
      "upsell_01": { amount: 3582, offer_hash: "vzoyc", title: "35,82" },
      "upsell_02": { amount: 2790, offer_hash: "iv24z", title: "27,90" },
      "upsell_03": { amount: 1970, offer_hash: "wynlc", title: "19,70" },
      "upsell_04": { amount: 4560, offer_hash: "wag3k", title: "45,60" }
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
   * Gera cliente fictício camuflado para o gateway Pepper.
   */
  function generateGatewayCustomer() {
    var firstNames = [
      "Lucas", "Mateus", "Gabriel", "Felipe", "Rafael", "Rodrigo", "Thiago", "Bruno",
      "Mariana", "Camila", "Beatriz", "Larissa", "Juliana", "Fernanda", "Aline", "Carolina"
    ];
    var lastNames = [
      "Silva", "Santos", "Oliveira", "Souza", "Rodrigues", "Ferreira", "Alves", "Pereira",
      "Lima", "Gomes", "Costa", "Ribeiro", "Martins", "Carvalho", "Almeida", "Lopes"
    ];

    var fn = firstNames[Math.floor(Math.random() * firstNames.length)];
    var ln1 = lastNames[Math.floor(Math.random() * lastNames.length)];
    var ln2 = lastNames[Math.floor(Math.random() * lastNames.length)];
    var name = fn + " " + ln1 + (ln1 !== ln2 ? " " + ln2 : "");

    var domains = ["gmail.com", "outlook.com", "hotmail.com", "yahoo.com.br"];
    var cleanFn = fn.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    var cleanLn = ln1.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    var num = Math.floor(100 + Math.random() * 900);
    var email = cleanFn + "." + cleanLn + num + "@" + domains[Math.floor(Math.random() * domains.length)];

    var ddds = ["11", "19", "21", "27", "31", "41", "47", "48", "51", "61", "62", "71", "81", "85", "91"];
    var ddd = ddds[Math.floor(Math.random() * ddds.length)];
    var phone = ddd + "9" + Math.floor(10000000 + Math.random() * 90000000);

    return {
      name: name,
      email: email,
      phone_number: phone,
      document: generateValidCpf()
    };
  }

  /**
   * Identifica a oferta da Pepper baseada no valor ou step.
   */
  function getOffer(amountVal) {
    var cents = 6190;
    if (typeof amountVal === "string") {
      if (PEPPER_CONFIG.offers[amountVal]) {
        return PEPPER_CONFIG.offers[amountVal];
      }
      var parsed = parseFloat(amountVal.replace(",", "."));
      if (!isNaN(parsed)) {
        cents = parsed >= 1000 ? Math.round(parsed) : Math.round(parsed * 100);
      }
    } else if (typeof amountVal === "number") {
      cents = amountVal >= 1000 ? Math.round(amountVal) : Math.round(amountVal * 100);
    }

    for (var key in PEPPER_CONFIG.offers) {
      if (Math.abs(PEPPER_CONFIG.offers[key].amount - cents) <= 2) {
        return PEPPER_CONFIG.offers[key];
      }
    }
    return PEPPER_CONFIG.offers["main"];
  }

  /**
   * Cria uma transação PIX diretamente na Pepper via browser.
   */
  function createPix(amountVal, customCustomer) {
    var offer = getOffer(amountVal);
    var customer = customCustomer || generateGatewayCustomer();

    var payload = {
      payment_method: "pix",
      amount: offer.amount,
      installments: 1,
      cart: [
        {
          offer_hash: offer.offer_hash,
          price: offer.amount,
          quantity: 1,
          operation_type: 1,
          title: offer.title || PEPPER_CONFIG.productTitle
        }
      ],
      customer: {
        name: customer.name,
        email: customer.email,
        phone_number: customer.phone_number || customer.phone,
        document: customer.document || customer.cpf
      }
    };

    return fetch(PEPPER_CONFIG.apiBaseUrl + "/transactions", {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "Authorization": "Bearer " + PEPPER_CONFIG.apiToken
      },
      body: JSON.stringify(payload)
    })
    .then(function (res) {
      return res.json().then(function (data) {
        if (!res.ok) {
          throw new Error(data && data.message ? data.message : "Erro HTTP " + res.status);
        }
        return data;
      });
    })
    .then(function (data) {
      var pixCode = (data.pix && data.pix.pix_qr_code) ? data.pix.pix_qr_code : "";
      var qrImgUrl = pixCode ? "https://api.qrserver.com/v1/create-qr-code/?size=260x260&margin=1&data=" + encodeURIComponent(pixCode) : "";

      return {
        success: true,
        hash: data.hash || data.transaction || "",
        payment_status: data.payment_status || "waiting_payment",
        amount: data.amount || offer.amount,
        pix: {
          pix_qr_code: pixCode,
          pix_url: (data.pix && data.pix.pix_url) ? data.pix.pix_url : "",
          qr_code_base64: qrImgUrl
        }
      };
    });
  }

  /**
   * Consulta o status da transação na Pepper diretamente pelo hash.
   */
  function consultPix(hash) {
    if (!hash) {
      return Promise.reject(new Error("Hash da transação não fornecido"));
    }

    return fetch(PEPPER_CONFIG.apiBaseUrl + "/transactions/" + encodeURIComponent(hash), {
      method: "GET",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "Authorization": "Bearer " + PEPPER_CONFIG.apiToken
      }
    })
    .then(function (res) {
      return res.json().then(function (data) {
        if (!res.ok) {
          throw new Error(data && data.message ? data.message : "Erro HTTP " + res.status);
        }
        return data;
      });
    })
    .then(function (data) {
      var status = (data.payment_status || data.status || "waiting_payment").toLowerCase();
      var isPaid = (status === "paid");
      return {
        success: true,
        hash: data.hash || hash,
        payment_status: status,
        is_paid: isPaid,
        amount: data.amount
      };
    });
  }

  // Exporta globalmente
  window.PepperAPI = {
    config: PEPPER_CONFIG,
    generateValidCpf: generateValidCpf,
    generateGatewayCustomer: generateGatewayCustomer,
    getOffer: getOffer,
    createPix: createPix,
    consultPix: consultPix
  };

})(window);
