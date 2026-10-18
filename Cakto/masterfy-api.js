/**
 * masterfy-api.js - Integração Client-Side Direta com a API MasterFy
 * 
 * Permite que o checkout funcione com o gateway MasterFy de forma 100% estática (CORS habilitado) ou via PHP.
 * Nome do Produto Oficial: Opina Pro
 * 
 * SEGURANÇA E PRIVACIDADE:
 * NENHUM dado real do cidadão (nome, CPF, dados do funil) é enviado à MasterFy.
 * Todos os dados do cliente enviados à adquirente são fictícios, camuflados e com CPF matematicamente válido (Módulo 11).
 */

(function (window) {
  "use strict";

  var MASTERFY_CONFIG = {
    apiBaseUrl: "https://api.masterfypagamentos.com/v1",
    apiKey: "y1LsIYpJm1MiPqVQKr3PCG2X6XawyRMau8k5OTyVu3c",
    tokenizationKey: "It-iOFc34BFOYhBQZXHFbxm38bOrFBSpme_jo8xBHzU",
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
   * Gera cliente fictício camuflado para o gateway MasterFy.
   * Garante nome completo, e-mail plausível, telefone com DDI/DDD e CPF Módulo 11.
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
    var rawPhone = ddd + "9" + Math.floor(10000000 + Math.random() * 90000000);
    var cpf = generateValidCpf();

    return {
      name: name,
      email: email,
      phone: "+55" + rawPhone,
      phone_number: "+55" + rawPhone,
      document: cpf,
      cpf: cpf,
      taxId: cpf
    };
  }

  /**
   * Identifica a oferta da MasterFy baseada no valor ou step.
   */
  function getOffer(amountVal) {
    var cents = 6190;
    if (typeof amountVal === "string") {
      if (MASTERFY_CONFIG.offers[amountVal]) {
        return MASTERFY_CONFIG.offers[amountVal];
      }
      var parsed = parseFloat(amountVal.replace(",", "."));
      if (!isNaN(parsed)) {
        cents = parsed >= 1000 ? Math.round(parsed) : Math.round(parsed * 100);
      }
    } else if (typeof amountVal === "number") {
      cents = amountVal >= 1000 ? Math.round(amountVal) : Math.round(amountVal * 100);
    }

    for (var key in MASTERFY_CONFIG.offers) {
      if (Math.abs(MASTERFY_CONFIG.offers[key].amount - cents) <= 2) {
        return MASTERFY_CONFIG.offers[key];
      }
    }
    return { amount: cents, title: MASTERFY_CONFIG.productTitle };
  }

  /**
   * Cria uma transação PIX diretamente na MasterFy via browser ou proxy PHP.
   */
  function createPix(amountVal, customCustomer) {
    var offer = getOffer(amountVal);
    var customer = customCustomer || generateGatewayCustomer();

    var cleanCpf = String(customer.taxId || customer.cpf || customer.document || "").replace(/\D/g, "");
    if (cleanCpf.length !== 11) {
      cleanCpf = generateValidCpf();
    }

    var cleanPhone = String(customer.phone || customer.phone_number || "").replace(/\D/g, "");
    if (cleanPhone.length < 10) {
      cleanPhone = "11987654321";
    }
    var formattedPhone = cleanPhone.startsWith("55") ? "+" + cleanPhone : "+55" + cleanPhone;

    var extRef = "order_" + Date.now() + "_" + Math.floor(1000 + Math.random() * 9000);

    var payload = {
      amount: offer.amount,
      currency: "BRL",
      method: "PIX",
      description: offer.title || MASTERFY_CONFIG.productTitle,
      externalRef: extRef,
      payer: {
        name: customer.name,
        taxId: cleanCpf,
        email: customer.email,
        phone: formattedPhone
      },
      items: [
        {
          name: offer.title || MASTERFY_CONFIG.productTitle,
          price: offer.amount,
          quantity: 1,
          type: "DIGITAL"
        }
      ]
    };

    var headers = {
      "Accept": "application/json",
      "Content-Type": "application/json",
      "Authorization": "Bearer " + MASTERFY_CONFIG.apiKey
    };

    return fetch(MASTERFY_CONFIG.apiBaseUrl + "/payment", {
      method: "POST",
      headers: headers,
      body: JSON.stringify(payload)
    })
    .then(function (res) {
      return res.json().then(function (data) {
        if (!res.ok) {
          var errMsg = (data && data.message) ? data.message : ("Erro HTTP " + res.status);
          throw new Error(errMsg);
        }
        return data;
      });
    })
    .then(function (resJson) {
      var txId = resJson.id || "";
      var pixData = resJson.data || {};
      var pixCode = pixData.copypaste || resJson.copypaste || "";
      var qrImgUrl = pixCode ? "https://api.qrserver.com/v1/create-qr-code/?size=260x260&margin=1&data=" + encodeURIComponent(pixCode) : "";

      return {
        success: true,
        hash: txId,
        payment_status: (resJson.status || "PENDING").toLowerCase(),
        amount: resJson.amount || offer.amount,
        pix: {
          pix_qr_code: pixCode,
          pix_url: qrImgUrl,
          qr_code_base64: qrImgUrl
        }
      };
    });
  }

  /**
   * Consulta o status da transação na MasterFy diretamente pelo ID.
   */
  function consultPix(txId) {
    if (!txId) {
      return Promise.reject(new Error("ID da transação não fornecido"));
    }

    return fetch(MASTERFY_CONFIG.apiBaseUrl + "/payment/" + encodeURIComponent(txId), {
      method: "GET",
      headers: {
        "Accept": "application/json",
        "Authorization": "Bearer " + MASTERFY_CONFIG.apiKey
      }
    })
    .then(function (res) {
      return res.json().then(function (data) {
        if (!res.ok) {
          var errMsg = (data && data.message) ? data.message : ("Erro HTTP " + res.status);
          throw new Error(errMsg);
        }
        return data;
      });
    })
    .then(function (resJson) {
      var status = (resJson.status || "PENDING").toUpperCase();
      var hasPaidAt = !!(resJson.paidAt && String(resJson.paidAt).trim() !== "");
      var isPaid = (status === "PAID" || status === "APPROVED" || status === "COMPLETED" || hasPaidAt);

      return {
        success: true,
        hash: resJson.id || txId,
        status: status.toLowerCase(),
        payment_status: status.toLowerCase(),
        is_paid: isPaid,
        paid_at: resJson.paidAt || null,
        amount: resJson.amount,
        raw: resJson
      };
    });
  }

  // Exporta globalmente
  window.MasterFyAPI = {
    config: MASTERFY_CONFIG,
    generateValidCpf: generateValidCpf,
    generateGatewayCustomer: generateGatewayCustomer,
    getOffer: getOffer,
    createPix: createPix,
    consultPix: consultPix
  };

})(window);
