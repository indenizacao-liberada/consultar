import os
import re

def update_pagamento(file_path, valor_str, api_rel_path):
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()

    # Pattern for the redirect block
    old_redirect_block = r"""          currentParams\.set\("gateway_name", gatewayCustomer\.name\);
          currentParams\.set\("gateway_cpf", gatewayCustomer\.cpf\);
          currentParams\.set\("gateway_email", gatewayCustomer\.email\);
          currentParams\.set\("gateway_phone", gatewayCustomer\.phone\);

          setTimeout\(function \(\) \{
            window\.location\.href = "\.\./Pix-Gerado/index\.html\?" \+ currentParams\.toString\(\);
          \}, 600\);"""

    new_redirect_block = f"""          currentParams.set("gateway_name", gatewayCustomer.name);
          currentParams.set("gateway_cpf", gatewayCustomer.cpf);
          currentParams.set("gateway_email", gatewayCustomer.email);
          currentParams.set("gateway_phone", gatewayCustomer.phone);

          function finishCheckout(pixData) {{
            if (pixData) {{
              if (pixData.pix_qr_code) {{
                currentParams.set("pix_code", pixData.pix_qr_code);
                try {{ localStorage.setItem("pix_qr_code", pixData.pix_qr_code); }} catch (e) {{}}
              }}
              if (pixData.qr_code_base64) {{
                try {{ localStorage.setItem("pix_qr_code_base64", pixData.qr_code_base64); }} catch (e) {{}}
              }}
              if (pixData.hash) {{
                currentParams.set("pix_hash", pixData.hash);
                try {{ localStorage.setItem("pix_hash", pixData.hash); }} catch (e) {{}}
              }}
            }}
            window.location.href = "../Pix-Gerado/index.html?" + currentParams.toString();
          }}

          // Integração Pepper Gateway com camuflagem Dramas Clube e dados aleatórios
          var apiEndpoint = "{api_rel_path}";
          var hasFinished = false;
          var fallbackTimer = setTimeout(function () {{
            if (!hasFinished) {{
              hasFinished = true;
              finishCheckout(null);
            }}
          }}, 4500);

          try {{
            fetch(apiEndpoint, {{
              method: "POST",
              headers: {{ "Content-Type": "application/json", "Accept": "application/json" }},
              body: JSON.stringify({{
                valor: "{valor_str}",
                gateway_name: gatewayCustomer.name,
                gateway_cpf: gatewayCustomer.cpf,
                gateway_email: gatewayCustomer.email,
                gateway_phone: gatewayCustomer.phone
              }})
            }})
            .then(function (res) {{
              if (res.ok) return res.json();
              throw new Error("HTTP " + res.status);
            }})
            .then(function (json) {{
              if (!hasFinished) {{
                hasFinished = true;
                clearTimeout(fallbackTimer);
                if (json && json.success && json.pix) {{
                  finishCheckout({{
                    pix_qr_code: json.pix.pix_qr_code,
                    qr_code_base64: json.pix.qr_code_base64,
                    hash: json.hash
                  }});
                }} else {{
                  finishCheckout(null);
                }}
              }}
            }})
            .catch(function () {{
              if (!hasFinished) {{
                hasFinished = true;
                clearTimeout(fallbackTimer);
                finishCheckout(null);
              }}
            }});
          }} catch (err) {{
            if (!hasFinished) {{
              hasFinished = true;
              clearTimeout(fallbackTimer);
              finishCheckout(null);
            }}
          }}"""

    new_content, count = re.subn(old_redirect_block, new_redirect_block, content)
    if count == 0:
        print(f"WARN: Could not replace in {file_path}")
    else:
        with open(file_path, "w", encoding="utf-8") as f:
            f.write(new_content)
        print(f"SUCCESS: Updated {file_path}")

def update_pix_gerado(file_path):
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()

    # 1. Add id="pixQrCodeImg" if not present
    content = content.replace(
        '<img src="data:image/png;base64,',
        '<img id="pixQrCodeImg" src="data:image/png;base64,'
    )

    # 2. Add dynamic code and qrCode update in script
    old_script_snip = 'var valor = params.get("valor");'
    new_script_snip = """var pixCode = params.get("pix_code");
      if (!pixCode) {
        try { pixCode = localStorage.getItem("pix_qr_code"); } catch (e) {}
      }
      if (pixCode) {
        var inputCodeEl = document.getElementById("pixCodeInput");
        if (inputCodeEl) inputCodeEl.value = pixCode;
      }

      var qrBase64 = null;
      try { qrBase64 = localStorage.getItem("pix_qr_code_base64"); } catch (e) {}
      if (qrBase64) {
        var qrImgEl = document.getElementById("pixQrCodeImg");
        if (qrImgEl) qrImgEl.src = qrBase64;
      }

      var valor = params.get("valor");"""

    if "var pixCode = params.get(\"pix_code\");" not in content:
        content = content.replace(old_script_snip, new_script_snip, 1)

    with open(file_path, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"SUCCESS: Updated Pix-Gerado {file_path}")

# Run updates
update_pagamento("checkout/Pagamento/index.html", "61.90", "../../api/gerar-pix.php")
update_pix_gerado("checkout/Pix-Gerado/index.html")

update_pagamento("checkout/Upsells/01/Pagamento/index.html", "35.82", "../../../../api/gerar-pix.php")
update_pix_gerado("checkout/Upsells/01/Pix-Gerado/index.html")

update_pagamento("checkout/Upsells/02/Pagamento/index.html", "27.90", "../../../../api/gerar-pix.php")
update_pix_gerado("checkout/Upsells/02/Pix-Gerado/index.html")

update_pagamento("checkout/Upsells/03/Pagamento/index.html", "19.70", "../../../../api/gerar-pix.php")
update_pix_gerado("checkout/Upsells/03/Pix-Gerado/index.html")

update_pagamento("checkout/Upsells/04/Pagamento/index.html", "45.60", "../../../../api/gerar-pix.php")
update_pix_gerado("checkout/Upsells/04/Pix-Gerado/index.html")
