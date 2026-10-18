import os

pix_files = [
    "checkout/Pix-Gerado/index.html",
    "checkout/Upsells/01/Pix-Gerado/index.html",
    "checkout/Upsells/02/Pix-Gerado/index.html",
    "checkout/Upsells/03/Pix-Gerado/index.html",
    "checkout/Upsells/04/Pix-Gerado/index.html"
]

polling_code = """
    // Verificação automática de status de pagamento (Polling com Pepper)
    var pixHash = params.get("pix_hash");
    if (!pixHash) {
      try { pixHash = localStorage.getItem("pix_hash"); } catch (e) {}
    }

    if (pixHash) {
      var pollInterval = setInterval(function () {
        var consultEndpoint = (function() {
          var path = window.location.pathname;
          if (path.indexOf("/Upsells/") !== -1) {
            return "../../../../api/consultar-pix.php?hash=" + encodeURIComponent(pixHash);
          }
          return "../../api/consultar-pix.php?hash=" + encodeURIComponent(pixHash);
        })();

        fetch(consultEndpoint)
          .then(function (res) { return res.ok ? res.json() : null; })
          .then(function (data) {
            if (data && (data.is_paid || data.payment_status === "paid")) {
              clearInterval(pollInterval);
              var statusBoxes = document.querySelectorAll(".bg-amber-500\\\\/10, [class*='bg-amber']");
              if (statusBoxes.length > 0) {
                var sb = statusBoxes[0];
                sb.className = "flex flex-col items-center justify-center bg-emerald-500/10 font-bold w-full px-4 py-3.5 rounded-md border border-emerald-300 shadow-sm mt-2 text-emerald-800";
                sb.innerHTML = '<span style="display:inline-flex; align-items:center; gap:8px;">✅ Pagamento Confirmado com Sucesso! Redirecionando...</span>';
              }
              setTimeout(function () {
                window.avancarEtapa();
              }, 1200);
            }
          })
          .catch(function () {});
      }, 3500);
    }
"""

for file_path in pix_files:
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()

    if "var pollInterval = setInterval" not in content:
        # Insert before window.avancarEtapa or after URL params handling
        target = 'var valor = params.get("valor");'
        if target in content:
            content = content.replace(target, target + polling_code, 1)
            with open(file_path, "w", encoding="utf-8") as f:
                f.write(content)
            print(f"SUCCESS: Added polling to {file_path}")
        else:
            print(f"WARN: Target not found in {file_path}")
    else:
        print(f"ALREADY PRESENT: {file_path}")
