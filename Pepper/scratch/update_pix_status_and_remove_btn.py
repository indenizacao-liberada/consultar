import os
import re

files = [
    "checkout/Pix-Gerado/index.html",
    "checkout/Upsells/01/Pix-Gerado/index.html",
    "checkout/Upsells/02/Pix-Gerado/index.html",
    "checkout/Upsells/03/Pix-Gerado/index.html",
    "checkout/Upsells/04/Pix-Gerado/index.html"
]

for filepath in files:
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Remove the button container completely
    btn_pattern = re.compile(r'\s*<!-- Botão para avançar de etapa no teste/simulação -->\s*<div class="mt-3 text-center">\s*<button type="button" id="btnProximaEtapa"[\s\S]*?</button>\s*</div>', re.MULTILINE)
    content, count_btn = btn_pattern.subn('', content)
    print(f"Removed button in {filepath}: count={count_btn}")

    # 2. Add id="pixStatusBox" to the status container if not already there
    old_box = '<div class="flex flex-col items-center justify-center bg-amber-500/10 font-bold w-full px-4 py-3.5 rounded-md border border-amber-200 shadow-sm mt-2 text-amber-900">'
    new_box = '<div id="pixStatusBox" class="flex flex-col items-center justify-center bg-amber-500/10 font-bold w-full px-4 py-3.5 rounded-md border border-amber-200 shadow-sm mt-2 text-amber-900 transition-all duration-300">'
    if old_box in content:
        content = content.replace(old_box, new_box)
        print(f"Added id=pixStatusBox in {filepath}")

    # 3. Update handleSuccess inside the polling script
    old_handle_success = re.compile(r'function handleSuccess\(\) \{[\s\S]*?setTimeout\(function \(\) \{[\s\S]*?window\.avancarEtapa\(\);[\s\S]*?\}, \d+\);\s*\}')
    
    new_handle_success = '''function handleSuccess() {
          clearInterval(pollInterval);
          var statusBox = document.getElementById("pixStatusBox") || document.querySelector(".bg-amber-500\\\\/10, [class*='bg-amber']");
          if (statusBox) {
            statusBox.style.background = "#109b6c";
            statusBox.style.borderColor = "#0d845b";
            statusBox.style.color = "#ffffff";
            statusBox.className = "flex flex-col items-center justify-center font-bold w-full px-4 py-3.5 rounded-md border shadow-md mt-2 transition-all duration-300";
            statusBox.innerHTML = '' +
              '<div style="display:flex; align-items:center; justify-content:center; gap:8px;">' +
                '<div style="width:24px; height:24px; background:#ffffff; border-radius:50%; display:flex; align-items:center; justify-content:center; flex-shrink:0;">' +
                  '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#109b6c" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">' +
                    '<polyline points="20 6 9 17 4 12"></polyline>' +
                  '</svg>' +
                '</div>' +
                '<span style="font-size:1.05rem; font-weight:800; color:#ffffff; letter-spacing:0.3px;">Pagamento Confirmado!</span>' +
              '</div>' +
              '<p style="font-size:0.82rem; font-weight:500; color:#e6fcf5; margin-top:4px; margin-bottom:0;">Redirecionando para a liberação...</p>';
          }
          setTimeout(function () {
            window.avancarEtapa();
          }, 1500);
        }'''

    content, count_hs = old_handle_success.subn(new_handle_success, content)
    print(f"Updated handleSuccess in {filepath}: count={count_hs}")

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

print("Done updating Pix-Gerado files.")
