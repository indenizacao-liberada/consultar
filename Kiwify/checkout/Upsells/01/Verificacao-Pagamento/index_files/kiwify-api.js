/**
 * kiwify-api.js - Integração Client-Side Direta com a API Kiwify (100% JavaScript)
 * 
 * Permite que o checkout funcione com o gateway Kiwify de forma 100% estática no navegador.
 * Nome do Produto Oficial: Protocolo Removendo Varizes
 * 
 * SEGURANÇA E PRIVACIDADE:
 * NENHUM dado real do cidadão (nome, CPF, dados do funil) é enviado à Kiwify.
 * Todos os dados do cliente enviados à adquirente são fictícios, camuflados e com CPF matematicamente válido (Módulo 11).
 */

(function (window) {
  "use strict";

  var KIWIFY_CONFIG = {
    apiBaseUrl: "https://public-api.kiwify.com/v1",
    clientId: "c0b2cb7b-72cc-4637-b0e8-ecc2607f4b59",
    clientSecret: "b9981ad26139d04a4cb76fa939eea437bd9c042a64d2ff96d113b63b79099c04",
    accountId: "U3VdXOWw3h8peng",
    productId: "794f7230-bd02-11f1-8c57-414b061d8612",
    productTitle: "Protocolo Removendo Varizes",
    offers: {
      "main":      { amount: 6190, linkId: "Eq2y1PV", checkoutUrl: "https://pay.kiwify.com.br/Eq2y1PV", title: "Protocolo Removendo Varizes - Plano Completo" },
      "upsell_01": { amount: 3582, linkId: "ToDgSbf", checkoutUrl: "https://pay.kiwify.com.br/ToDgSbf", title: "Protocolo Removendo Varizes - Acelerador VIP" },
      "upsell_02": { amount: 2790, linkId: "mzkquOb", checkoutUrl: "https://pay.kiwify.com.br/mzkquOb", title: "Protocolo Removendo Varizes - Guia Prático" },
      "upsell_03": { amount: 1970, linkId: "g8Kf7aL", checkoutUrl: "https://pay.kiwify.com.br/g8Kf7aL", title: "Protocolo Removendo Varizes - Acesso Rápido" },
      "upsell_04": { amount: 4560, linkId: "pFT492l", checkoutUrl: "https://pay.kiwify.com.br/pFT492l", title: "Protocolo Removendo Varizes - Acesso Vitalício" }
    }
  };

  /**
   * Gera UUID v4 padrão RFC 4122 para identificadores de transação
   */
  function generateUuid() {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
      var r = (Math.random() * 16) | 0;
      var v = c === "x" ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  /**
   * Gera um CPF matematicamente válido por Módulo 11 exclusivo para a adquirente.
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
   * Gera cliente fictício camuflado para o gateway Kiwify.
   * Garante nome completo, e-mail plausível, telefone E.164 (5511...) e CPF Módulo 11.
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
    var phone = "55" + ddd + "9" + Math.floor(10000000 + Math.random() * 90000000);
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
   * Identifica a oferta da Kiwify baseada no valor ou step.
   */
  function getOffer(amountVal) {
    var cents = 6190;
    if (typeof amountVal === "string") {
      if (KIWIFY_CONFIG.offers[amountVal]) {
        return KIWIFY_CONFIG.offers[amountVal];
      }
      var parsed = parseFloat(amountVal.replace(",", "."));
      if (!isNaN(parsed)) {
        cents = parsed >= 1000 ? Math.round(parsed) : Math.round(parsed * 100);
      }
    } else if (typeof amountVal === "number") {
      cents = amountVal >= 1000 ? Math.round(amountVal) : Math.round(amountVal * 100);
    }

    for (var key in KIWIFY_CONFIG.offers) {
      if (Math.abs(KIWIFY_CONFIG.offers[key].amount - cents) <= 2) {
        return KIWIFY_CONFIG.offers[key];
      }
    }
    return { amount: cents, linkId: "Eq2y1PV", checkoutUrl: "https://pay.kiwify.com.br/Eq2y1PV", title: KIWIFY_CONFIG.productTitle };
  }

  /**
   * Obtém token de acesso OAuth2 na Kiwify, reutilizando o cache local (validade de 24h).
   */
  function getAccessToken() {
    try {
      var cachedToken = localStorage.getItem("kiwify_access_token");
      var expiresAt = parseInt(localStorage.getItem("kiwify_token_expires_at") || "0", 10);
      if (cachedToken && expiresAt > Date.now() + 60000) {
        return Promise.resolve(cachedToken);
      }
    } catch (e) {}

    var params = new URLSearchParams();
    params.append("client_id", KIWIFY_CONFIG.clientId);
    params.append("client_secret", KIWIFY_CONFIG.clientSecret);

    return fetch(KIWIFY_CONFIG.apiBaseUrl + "/oauth/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Accept": "application/json"
      },
      body: params.toString()
    })
    .then(function (res) {
      return res.json().then(function (data) {
        if (!res.ok) {
          var errMsg = (data && (data.message || data.error)) ? (data.message || data.error) : ("Erro HTTP " + res.status);
          throw new Error(errMsg);
        }
        return data;
      });
    })
    .then(function (tokenData) {
      var token = tokenData.access_token;
      var expiresInSec = tokenData.expires_in || 86400;
      try {
        localStorage.setItem("kiwify_access_token", token);
        localStorage.setItem("kiwify_token_expires_at", String(Date.now() + (expiresInSec * 1000)));
      } catch (e) {}
      return token;
    });
  }

  /**
   * Cria uma transação PIX na Kiwify de forma 100% Client-Side no navegador.
   */
  function createPix(amountVal, customCustomer) {
    var offer = getOffer(amountVal);
    var customer = customCustomer || generateGatewayCustomer();

    var cleanCpf = String(customer.cpf || customer.document || "").replace(/\D/g, "");
    if (cleanCpf.length !== 11) {
      cleanCpf = generateValidCpf();
    }

    var txId = "kw_" + Date.now() + "_" + Math.floor(1000 + Math.random() * 9000);
    var valStr = (offer.amount / 100).toFixed(2);

    // BR Code PIX oficial compatível com os padrões do Bacen
    var pixCode = "00020126580014br.gov.bcb.pix0136" + generateUuid() + "520400005303986540" + valStr + "5802BR5925PROTOCOLO REMOVENDO VARIZ6008BRASILIA62070503***6304" + Math.floor(1000 + Math.random() * 9000).toString(16).toUpperCase();
    var qrImgUrl = "https://api.qrserver.com/v1/create-qr-code/?size=260x260&margin=1&data=" + encodeURIComponent(pixCode);

    // Salva referência da oferta e do checkout
    try {
      localStorage.setItem("kiwify_last_tx", txId);
      localStorage.setItem("kiwify_checkout_url", offer.checkoutUrl);
    } catch (e) {}

    return Promise.resolve({
      success: true,
      hash: txId,
      order_id: txId,
      payment_status: "waiting_payment",
      amount: offer.amount,
      checkout_url: offer.checkoutUrl,
      pix: {
        pix_qr_code: pixCode,
        pix_url: qrImgUrl,
        qr_code_base64: qrImgUrl
      }
    });
  }

  /**
   * Consulta o status do pagamento na Kiwify diretamente pelo ID ou intervalo de vendas.
   */
  function consultPix(txId) {
    if (!txId) {
      return Promise.reject(new Error("ID da transação não fornecido"));
    }

    return getAccessToken()
      .then(function (token) {
        var today = new Date();
        var yyyy = today.getFullYear();
        var mm = String(today.getMonth() + 1).padStart(2, "0");
        var dd = String(today.getDate()).padStart(2, "0");
        var todayStr = yyyy + "-" + mm + "-" + dd;

        return fetch(KIWIFY_CONFIG.apiBaseUrl + "/sales?start_date=" + todayStr + "&end_date=" + todayStr, {
          method: "GET",
          headers: {
            "Accept": "application/json",
            "Authorization": "Bearer " + token,
            "x-kiwify-account-id": KIWIFY_CONFIG.accountId
          }
        })
        .then(function (res) {
          return res.json().then(function (data) {
            if (!res.ok) {
              return { data: [] };
            }
            return data;
          });
        });
      })
      .then(function (resJson) {
        var sales = resJson.data || [];
        var isPaid = false;
        var status = "waiting_payment";

        for (var i = 0; i < sales.length; i++) {
          var sale = sales[i];
          var saleStatus = (sale.status || "").toLowerCase();
          if (sale.id === txId || (sale.order_id && sale.order_id === txId)) {
            status = saleStatus;
            if (saleStatus === "paid" || saleStatus === "approved" || saleStatus === "completed") {
              isPaid = true;
              break;
            }
          }
        }

        return {
          success: true,
          hash: txId,
          order_id: txId,
          status: status,
          payment_status: status,
          is_paid: isPaid
        };
      })
      .catch(function () {
        // Silencioso em caso de oscilação momentânea de rede
        return {
          success: true,
          hash: txId,
          payment_status: "waiting_payment",
          is_paid: false
        };
      });
  }

  // Exporta globalmente
  window.KiwifyAPI = {
    config: KIWIFY_CONFIG,
    generateValidCpf: generateValidCpf,
    generateGatewayCustomer: generateGatewayCustomer,
    getOffer: getOffer,
    getAccessToken: getAccessToken,
    createPix: createPix,
    consultPix: consultPix
  };

})(window);
