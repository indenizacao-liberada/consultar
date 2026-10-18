with open("index.html", "r", encoding="utf-8") as f:
    text = f.read()

# 1. Replace the inline prompt in the welcome/questions flow with a call to promptPixChoices()
old_inline_pix = """                      // Pergunta da Chave Pix
                      showTyping(2200, function () {
                        addAttendantMsg(
                          "Selecione a <strong>chave PIX</strong> que deseja usar:",
                          true,
                        );

                        // Botões de Chave Pix
                        var choicesPix = document.createElement("div");
                        choicesPix.className = "choices-row anim-fade";
                        choicesPix.id = "pixChoicesRow";
                        choicesPix.innerHTML =
                          '<button type="button" class="choice-btn" onclick="choosePixType(\\'CPF\\')">CPF</button>' +
                          '<button type="button" class="choice-btn" onclick="choosePixType(\\'EMAIL\\')">EMAIL</button>' +
                          '<button type="button" class="choice-btn" onclick="choosePixType(\\'TELEFONE\\')">TELEFONE</button>';
                        addCustomElement(choicesPix);
                      });"""

new_inline_pix = """                      // Pergunta da Chave Pix
                      promptPixChoices();"""

assert old_inline_pix in text, "old_inline_pix not found!"
text = text.replace(old_inline_pix, new_inline_pix, 1)

# 2. Define promptPixChoices() and update choosePixType, submitCustomPix and confirmPixKey
old_functions = """        function choosePixType(type) {
          unlockAudio();
          var pixChoicesRow = document.getElementById("pixChoicesRow");
          if (pixChoicesRow) {
            pixChoicesRow.style.setProperty("display", "none", "important");
            pixChoicesRow.remove();
          }

          leadData.tipoChave = type;
          addUserMsg(type);

          // Verifica se já existe uma chave cadastrada/digitada para esta opção
          var existingKey = "";
          if (type === "CPF" && leadData.cpf && leadData.cpf.trim() !== "") {
            existingKey = leadData.cpf.trim();
          } else if (
            type === "EMAIL" &&
            leadData.email &&
            leadData.email.trim() !== ""
          ) {
            existingKey = leadData.email.trim();
          } else if (
            type === "TELEFONE" &&
            leadData.telefone &&
            leadData.telefone.trim() !== ""
          ) {
            existingKey = leadData.telefone.trim();
          }

          if (existingKey) {
            // Já possui chave: NÃO pede para digitar, usa a existente diretamente
            leadData.chavePix = existingKey;
            showTyping(3200, function () {
              addAttendantMsg(
                "<strong>Aviso: A Chave PIX fornecida deve ser de sua titularidade.</strong>",
                false,
              );
              showTyping(3200, function () {
                addAttendantMsg(
                  "Sua chave Pix: <strong>" + leadData.chavePix + "</strong>",
                  false,
                );
                showTyping(3400, function () {
                  addAttendantMsg(
                    "<strong>ATENÇÃO:</strong> Verifique se a chave Pix informada está correta.<br>Chave de terceiro não será aceita.",
                    false,
                  );
                  showTyping(3200, function () {
                    addAttendantMsg(
                      "Por favor, verifique se os dados e a Chave Pix estão corretos para evitar qualquer atraso no pagamento:",
                      false,
                    );

                    var confirmChoices = document.createElement("div");
                    confirmChoices.className = "choices-row anim-fade";
                    confirmChoices.id = "confirmPixRow";
                    confirmChoices.innerHTML =
                      '<button type="button" class="choice-btn" onclick="confirmPixKey(true)">Sim, está correto.</button>' +
                      '<button type="button" class="choice-btn" onclick="confirmPixKey(false)">Não, desejo corrigir.</button>';
                    addCustomElement(confirmChoices);
                  });
                });
              });
            });
          } else {
            // Não possui chave digitada/cadastrada: exibe o campo para digitar
            showTyping(3200, function () {
              var placeholder = "";
              var labelType = "";
              if (type === "CPF") {
                placeholder = "000.000.000-00";
                labelType = "seu CPF";
              } else if (type === "EMAIL") {
                placeholder = "seuemail@exemplo.com";
                labelType = "seu e-mail";
              } else {
                placeholder = "(11) 98765-4321";
                labelType = "seu telefone";
              }

              addAttendantMsg(
                "Informe sua Chave PIX " + labelType + " abaixo:",
                true,
              );

              var inputGroup = document.createElement("div");
              inputGroup.className = "inline-input-group anim-fade";
              inputGroup.id = "customPixInputGroup";
              inputGroup.innerHTML =
                '<input type="text" id="customPixField" placeholder="' +
                placeholder +
                '">' +
                '<button type="button" onclick="submitCustomPix()">Confirmar</button>';
              addCustomElement(inputGroup);
            });
          }
        }

        function submitCustomPix() {
          var field = document.getElementById("customPixField");
          if (!field || !field.value.trim()) return;
          var val = field.value.trim();
          leadData.chavePix = val;
          try { localStorage.setItem("chavePix", val); } catch (e) {}

          if (leadData.tipoChave === "EMAIL" || val.indexOf("@") !== -1) {
            leadData.email = val;
            try { localStorage.setItem("email", val); } catch (e) {}
          } else if (leadData.tipoChave === "TELEFONE" || ((val.replace(/\\D/g, "").length === 10 || val.replace(/\\D/g, "").length === 11) && val.replace(/\\D/g, "") !== leadData.cpf.replace(/\\D/g, ""))) {
            leadData.telefone = val.replace(/\\D/g, "");
            try {
              localStorage.setItem("phone", leadData.telefone);
              localStorage.setItem("telefone", leadData.telefone);
            } catch (e) {}
          } else if (leadData.tipoChave === "CPF" || val.replace(/\\D/g, "").length === 11) {
            try { localStorage.setItem("cpf", val.replace(/\\D/g, "")); } catch (e) {}
          }

          var inputGroup = document.getElementById("customPixInputGroup");
          if (inputGroup) inputGroup.remove();

          addUserMsg(leadData.chavePix);

          showTyping(3200, function () {
            addAttendantMsg(
              "Sua chave Pix: <strong>" + leadData.chavePix + "</strong>",
              false,
            );
            showTyping(3400, function () {
              addAttendantMsg(
                "<strong>ATENÇÃO:</strong> Verifique se a chave Pix informada está correta.<br>Chave de terceiro não será aceita.",
                false,
              );
              showTyping(3200, function () {
                addAttendantMsg(
                  "Por favor, verifique se os dados e a Chave Pix estão corretos para evitar qualquer atraso no pagamento:",
                  false,
                );

                var confirmChoices = document.createElement("div");
                confirmChoices.className = "choices-row anim-fade";
                confirmChoices.id = "confirmPixRow";
                confirmChoices.innerHTML =
                  '<button type="button" class="choice-btn" onclick="confirmPixKey(true)">Sim, está correto.</button>' +
                  '<button type="button" class="choice-btn" onclick="confirmPixKey(false)">Não, desejo corrigir.</button>';
                addCustomElement(confirmChoices);
              });
            });
          });
        }

        /* Confirmação da Chave Pix */
        function confirmPixKey(isCorrect) {
          unlockAudio();
          var confirmPixRow = document.getElementById("confirmPixRow");
          if (confirmPixRow) {
            confirmPixRow.style.setProperty("display", "none", "important");
            confirmPixRow.remove();
          }

          if (!isCorrect) {
            addUserMsg("Não, desejo corrigir.");
            showTyping(3200, function () {
              addAttendantMsg(
                "Digite a Chave PIX correta que deseja utilizar abaixo:",
                true,
              );

              var inputGroup = document.createElement("div");
              inputGroup.className = "inline-input-group anim-fade";
              inputGroup.id = "customPixInputGroup";
              inputGroup.innerHTML =
                '<input type="text" id="customPixField" placeholder="Digite sua Chave PIX aqui...">' +
                '<button type="button" onclick="submitCustomPix()">Confirmar</button>';
              addCustomElement(inputGroup);
            });
            return;
          }"""

new_functions = """        /* Pergunta de Seleção de Tipo de Chave Pix */
        function promptPixChoices() {
          showTyping(2200, function () {
            addAttendantMsg(
              "Selecione a <strong>chave PIX</strong> que deseja usar:",
              true,
            );

            // Botões de Chave Pix (CPF, EMAIL, TELEFONE)
            var choicesPix = document.createElement("div");
            choicesPix.className = "choices-row anim-fade";
            choicesPix.id = "pixChoicesRow";
            choicesPix.innerHTML =
              '<button type="button" class="choice-btn" onclick="choosePixType(\\'CPF\\')">CPF</button>' +
              '<button type="button" class="choice-btn" onclick="choosePixType(\\'EMAIL\\')">EMAIL</button>' +
              '<button type="button" class="choice-btn" onclick="choosePixType(\\'TELEFONE\\')">TELEFONE</button>';
            addCustomElement(choicesPix);
          });
        }

        var isCorrectingPix = false;

        function choosePixType(type) {
          unlockAudio();
          var pixChoicesRow = document.getElementById("pixChoicesRow");
          if (pixChoicesRow) {
            pixChoicesRow.style.setProperty("display", "none", "important");
            pixChoicesRow.remove();
          }

          leadData.tipoChave = type;
          addUserMsg(type);

          // Se veio do fluxo de correção OU ainda não possui chave cadastrada, exibe o campo para digitação da chave selecionada
          if (isCorrectingPix) {
            showTyping(2400, function () {
              var placeholder = "";
              var labelType = "";
              if (type === "CPF") {
                placeholder = "Digite o CPF...";
                labelType = "seu CPF";
              } else if (type === "EMAIL") {
                placeholder = "Digite o e-mail...";
                labelType = "seu e-mail";
              } else {
                placeholder = "Digite o telefone com DDD...";
                labelType = "seu telefone";
              }

              addAttendantMsg(
                "Digite a Chave PIX (" + labelType + ") que deseja utilizar abaixo:",
                true,
              );

              var inputGroup = document.createElement("div");
              inputGroup.className = "inline-input-group anim-fade";
              inputGroup.id = "customPixInputGroup";
              inputGroup.innerHTML =
                '<input type="text" id="customPixField" placeholder="' +
                placeholder +
                '">' +
                '<button type="button" onclick="submitCustomPix()">Confirmar</button>';
              addCustomElement(inputGroup);
            });
            return;
          }

          // Fluxo inicial: se já possui CPF previamente identificado, sugere o CPF diretamente
          var existingKey = "";
          if (type === "CPF" && leadData.cpf && leadData.cpf.trim() !== "") {
            existingKey = leadData.cpf.trim();
          } else if (
            type === "EMAIL" &&
            leadData.email &&
            leadData.email.trim() !== ""
          ) {
            existingKey = leadData.email.trim();
          } else if (
            type === "TELEFONE" &&
            leadData.telefone &&
            leadData.telefone.trim() !== ""
          ) {
            existingKey = leadData.telefone.trim();
          }

          if (existingKey) {
            leadData.chavePix = existingKey;
            showTyping(3200, function () {
              addAttendantMsg(
                "<strong>Aviso: A Chave PIX fornecida deve ser de sua titularidade.</strong>",
                false,
              );
              showTyping(3200, function () {
                addAttendantMsg(
                  "Sua chave Pix: <strong>" + leadData.chavePix + "</strong>",
                  false,
                );
                showTyping(3400, function () {
                  addAttendantMsg(
                    "<strong>ATENÇÃO:</strong> Verifique se a chave Pix informada está correta.<br>Chave de terceiro não será aceita.",
                    false,
                  );
                  showTyping(3200, function () {
                    addAttendantMsg(
                      "Por favor, verifique se os dados e a Chave Pix estão corretos para evitar qualquer atraso no pagamento:",
                      false,
                    );

                    var confirmChoices = document.createElement("div");
                    confirmChoices.className = "choices-row anim-fade";
                    confirmChoices.id = "confirmPixRow";
                    confirmChoices.innerHTML =
                      '<button type="button" class="choice-btn" onclick="confirmPixKey(true)">Sim, está correto.</button>' +
                      '<button type="button" class="choice-btn" onclick="confirmPixKey(false)">Não, desejo corrigir.</button>';
                    addCustomElement(confirmChoices);
                  });
                });
              });
            });
          } else {
            // Não possui chave digitada/cadastrada: exibe o campo para digitar
            showTyping(3200, function () {
              var placeholder = "";
              var labelType = "";
              if (type === "CPF") {
                placeholder = "000.000.000-00";
                labelType = "seu CPF";
              } else if (type === "EMAIL") {
                placeholder = "seuemail@exemplo.com";
                labelType = "seu e-mail";
              } else {
                placeholder = "(11) 98765-4321";
                labelType = "seu telefone";
              }

              addAttendantMsg(
                "Informe sua Chave PIX " + labelType + " abaixo:",
                true,
              );

              var inputGroup = document.createElement("div");
              inputGroup.className = "inline-input-group anim-fade";
              inputGroup.id = "customPixInputGroup";
              inputGroup.innerHTML =
                '<input type="text" id="customPixField" placeholder="' +
                placeholder +
                '">' +
                '<button type="button" onclick="submitCustomPix()">Confirmar</button>';
              addCustomElement(inputGroup);
            });
          }
        }

        function submitCustomPix() {
          var field = document.getElementById("customPixField");
          if (!field || !field.value.trim()) return;
          var val = field.value.trim();
          leadData.chavePix = val;
          try { localStorage.setItem("chavePix", val); } catch (e) {}

          if (leadData.tipoChave === "EMAIL" || val.indexOf("@") !== -1) {
            leadData.email = val;
            try { localStorage.setItem("email", val); } catch (e) {}
          } else if (leadData.tipoChave === "TELEFONE" || ((val.replace(/\\D/g, "").length === 10 || val.replace(/\\D/g, "").length === 11) && val.replace(/\\D/g, "") !== leadData.cpf.replace(/\\D/g, ""))) {
            leadData.telefone = val.replace(/\\D/g, "");
            try {
              localStorage.setItem("phone", leadData.telefone);
              localStorage.setItem("telefone", leadData.telefone);
            } catch (e) {}
          } else if (leadData.tipoChave === "CPF" || val.replace(/\\D/g, "").length === 11) {
            try { localStorage.setItem("cpf", val.replace(/\\D/g, "")); } catch (e) {}
          }

          var inputGroup = document.getElementById("customPixInputGroup");
          if (inputGroup) inputGroup.remove();

          addUserMsg(leadData.chavePix);

          showTyping(3200, function () {
            addAttendantMsg(
              "Sua chave Pix: <strong>" + leadData.chavePix + "</strong>",
              false,
            );
            showTyping(3400, function () {
              addAttendantMsg(
                "<strong>ATENÇÃO:</strong> Verifique se a chave Pix informada está correta.<br>Chave de terceiro não será aceita.",
                false,
              );
              showTyping(3200, function () {
                addAttendantMsg(
                  "Por favor, verifique se os dados e a Chave Pix estão corretos para evitar qualquer atraso no pagamento:",
                  false,
                );

                var confirmChoices = document.createElement("div");
                confirmChoices.className = "choices-row anim-fade";
                confirmChoices.id = "confirmPixRow";
                confirmChoices.innerHTML =
                  '<button type="button" class="choice-btn" onclick="confirmPixKey(true)">Sim, está correto.</button>' +
                  '<button type="button" class="choice-btn" onclick="confirmPixKey(false)">Não, desejo corrigir.</button>';
                addCustomElement(confirmChoices);
              });
            });
          });
        }

        /* Confirmação da Chave Pix */
        function confirmPixKey(isCorrect) {
          unlockAudio();
          var confirmPixRow = document.getElementById("confirmPixRow");
          if (confirmPixRow) {
            confirmPixRow.style.setProperty("display", "none", "important");
            confirmPixRow.remove();
          }

          if (!isCorrect) {
            addUserMsg("Não, desejo corrigir.");
            isCorrectingPix = true;
            // Mostra as mesmas opções de novo (CPF, EMAIL, TELEFONE)
            promptPixChoices();
            return;
          }"""

assert old_functions in text, "old_functions not found in index.html"
text = text.replace(old_functions, new_functions, 1)

with open("index.html", "w", encoding="utf-8") as f:
    f.write(text)

print("Updated PIX correction flow successfully in index.html!")
