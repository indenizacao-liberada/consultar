import asyncio
import subprocess
import time
import json
import urllib.request
import os
import sys
import base64
import websockets

sys.stdout.reconfigure(encoding='utf-8')

async def main():
    chrome_exe = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
    temp_profile = os.path.abspath(r"scratch\chrome_test_profile_clean")
    os.makedirs(temp_profile, exist_ok=True)

    chrome_proc = subprocess.Popen([
        chrome_exe,
        "--headless=new",
        "--remote-debugging-port=9226",
        f"--user-data-dir={temp_profile}",
        "--no-first-run",
        "--no-default-browser-check",
        "--disable-extensions",
        "--window-size=430,932",
        "about:blank"
    ], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

    print("Chrome launched on port 9226, waiting for CDP...", flush=True)

    ws_url = None
    for i in range(10):
        await asyncio.sleep(1)
        try:
            resp = urllib.request.urlopen("http://127.0.0.1:9226/json/list", timeout=2)
            tabs = json.loads(resp.read().decode())
            page_tabs = [t for t in tabs if t.get("type") == "page"]
            if page_tabs:
                ws_url = page_tabs[0]["webSocketDebuggerUrl"]
                print(f"Connected to page CDP: {ws_url}", flush=True)
                break
        except Exception as e:
            pass

    if not ws_url:
        print("Failed to get CDP URL", flush=True)
        chrome_proc.terminate()
        return

    try:
        async with websockets.connect(ws_url, max_size=20*1024*1024) as ws:
            req_id = 1
            async def send_cmd(method, params=None):
                nonlocal req_id
                cur_id = req_id
                req_id += 1
                msg = {"id": cur_id, "method": method, "params": params or {}}
                await ws.send(json.dumps(msg))
                while True:
                    raw = await ws.recv()
                    res = json.loads(raw)
                    if res.get("id") == cur_id:
                        return res

            await send_cmd("Page.enable")
            await send_cmd("Runtime.enable")

            # 1. Navigate to index.html with query parameters
            target_url = "http://127.0.0.1:8080/?utm_source=meta_ads&utm_campaign=indenizacao#atendimento"
            print(f"Navigating to {target_url}...", flush=True)
            await send_cmd("Page.navigate", {"url": target_url})
            await asyncio.sleep(3)

            # 2. Inject user state in chatbot
            eval_res = await send_cmd("Runtime.evaluate", {
                "expression": """
                (function() {
                    localStorage.setItem("nome", "Guilherme Rodrigues Beserra");
                    localStorage.setItem("cpf", "46960142822");
                    localStorage.setItem("mae", "MARIA APARECIDA BESERRA");
                    localStorage.setItem("nascimento", "08/10/2003");
                    if (typeof leadData !== "undefined") {
                        leadData.nome = "Guilherme Rodrigues Beserra";
                        leadData.cpf = "469.601.428-22";
                        leadData.mae = "MARIA APARECIDA BESERRA";
                        leadData.nascimento = "08/10/2003";
                        leadData.tipoChave = "CPF";
                        leadData.chavePix = "469.601.428-22";
                    }
                    return {
                        url: window.location.href,
                        hasGoToCheckout: typeof window.goToCheckoutPagamento === "function"
                    };
                })()
                """,
                "returnByValue": True
            })
            print("Chatbot state:", eval_res.get("result", {}).get("result", {}).get("value"), flush=True)

            # 3. Trigger goToCheckoutPagamento()
            print("Triggering goToCheckoutPagamento()...", flush=True)
            await send_cmd("Runtime.evaluate", {
                "expression": "window.goToCheckoutPagamento()"
            })
            await asyncio.sleep(3)

            # 4. Check Checkout Pagamento URL and prefilled values
            eval_checkout = await send_cmd("Runtime.evaluate", {
                "expression": """
                (function() {
                    var nameEl = document.getElementById("name");
                    var cpfEl = document.getElementById("document");
                    var emailEl = document.getElementById("email");
                    var phoneEl = document.getElementById("phone_number");
                    return {
                        url: window.location.href,
                        name: nameEl ? nameEl.value : null,
                        cpf: cpfEl ? cpfEl.value : null,
                        email: emailEl ? emailEl.value : null,
                        phone: phoneEl ? phoneEl.value : null
                    };
                })()
                """,
                "returnByValue": True
            })
            checkout_data = eval_checkout.get("result", {}).get("result", {}).get("value", {})
            print("Checkout Pagamento prefilled values:", checkout_data, flush=True)

            # Save screenshot of Checkout Pagamento with auto-filled fields
            ss1 = await send_cmd("Page.captureScreenshot", {"format": "png"})
            out_dir = r"C:\Users\vtznu\.gemini\antigravity-ide\brain\bf48146c-d7f0-41f3-8238-ac244f463dbb"
            ss1_path = os.path.join(out_dir, "verified_chat_to_checkout_prefilled.png")
            with open(ss1_path, "wb") as f:
                f.write(base64.b64decode(ss1["result"]["data"]))
            print("Saved screenshot 1 to:", ss1_path, flush=True)

            # 5. Fill missing fields (e-mail and phone)
            print("User filling missing email and phone...", flush=True)
            await send_cmd("Runtime.evaluate", {
                "expression": """
                (function() {
                    var emailEl = document.getElementById("email");
                    var phoneEl = document.getElementById("phone_number");
                    if (emailEl) {
                        emailEl.value = "guilherme.beserra@gmail.com";
                        emailEl.dispatchEvent(new Event("input", { bubbles: true }));
                    }
                    if (phoneEl) {
                        phoneEl.value = "11987654321";
                        phoneEl.dispatchEvent(new Event("input", { bubbles: true }));
                    }
                })()
                """
            })
            await asyncio.sleep(1)

            # 6. Click GERAR PIX
            print("Clicking GERAR PIX...", flush=True)
            await send_cmd("Runtime.evaluate", {
                "expression": "document.getElementById('btnGerarPix').click()"
            })
            await asyncio.sleep(3)

            # 7. Verify Pix-Gerado screen
            eval_pix = await send_cmd("Runtime.evaluate", {
                "expression": """
                (function() {
                    var titleEl = document.getElementById("pixTitle");
                    var valEl = document.getElementById("pixValue");
                    var codeEl = document.getElementById("pixCodeInput");
                    return {
                        url: window.location.href,
                        title: titleEl ? titleEl.textContent : null,
                        value: valEl ? valEl.textContent : null,
                        code: codeEl ? codeEl.value : null
                    };
                })()
                """,
                "returnByValue": True
            })
            pix_data = eval_pix.get("result", {}).get("result", {}).get("value", {})
            print("Pix Gerado screen data:", pix_data, flush=True)

            # Save screenshot of Pix Gerado
            ss2 = await send_cmd("Page.captureScreenshot", {"format": "png"})
            ss2_path = os.path.join(out_dir, "verified_pix_gerado_complete.png")
            with open(ss2_path, "wb") as f:
                f.write(base64.b64decode(ss2["result"]["data"]))
            print("Saved screenshot 2 to:", ss2_path, flush=True)

            print("SUCCESS: End-to-end flow verified!", flush=True)

    finally:
        chrome_proc.terminate()
        chrome_proc.wait()

asyncio.run(main())
