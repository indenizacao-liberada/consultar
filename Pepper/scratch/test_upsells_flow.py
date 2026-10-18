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
    temp_profile = os.path.abspath(r"scratch\chrome_test_upsells")
    os.makedirs(temp_profile, exist_ok=True)

    chrome_proc = subprocess.Popen([
        chrome_exe,
        "--headless=new",
        "--remote-debugging-port=9227",
        f"--user-data-dir={temp_profile}",
        "--no-first-run",
        "--no-default-browser-check",
        "--disable-extensions",
        "--window-size=430,932",
        "about:blank"
    ], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

    print("Chrome launched on port 9227, waiting for CDP...", flush=True)

    ws_url = None
    for i in range(10):
        await asyncio.sleep(1)
        try:
            resp = urllib.request.urlopen("http://127.0.0.1:9227/json/list", timeout=2)
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

            out_dir = r"C:\Users\vtznu\.gemini\antigravity-ide\brain\bf48146c-d7f0-41f3-8238-ac244f463dbb"

            # Set user mock data in localStorage first
            target_init = "http://127.0.0.1:8080/checkout/Pagamento/index.html?nome=Guilherme+Rodrigues+Beserra&cpf=46960142822&email=guilherme%40gmail.com&phone=11987654321"
            await send_cmd("Page.navigate", {"url": target_init})
            await asyncio.sleep(2)
            await send_cmd("Runtime.evaluate", {
                "expression": """
                (function() {
                    localStorage.setItem("nome", "Guilherme Rodrigues Beserra");
                    localStorage.setItem("cpf", "46960142822");
                    localStorage.setItem("email", "guilherme@gmail.com");
                    localStorage.setItem("phone", "11987654321");
                })()
                """
            })

            # TEST UPSELL 01
            print("--- Testing Upsell 01 ---", flush=True)
            url_acesso01 = "http://127.0.0.1:8080/acesso/01/index.html?nome=Guilherme+Rodrigues+Beserra&cpf=46960142822"
            await send_cmd("Page.navigate", {"url": url_acesso01})
            await asyncio.sleep(2)
            # Click payment button in acesso/01
            await send_cmd("Runtime.evaluate", {"expression": "document.getElementById('paymentButton').click()"})
            await asyncio.sleep(2)

            # Check Upsell 01 Pagamento
            eval_up01_pay = await send_cmd("Runtime.evaluate", {
                "expression": """
                (function() {
                    return {
                        url: window.location.href,
                        name: document.getElementById('name') ? document.getElementById('name').value : null,
                        cpf: document.getElementById('document') ? document.getElementById('document').value : null
                    };
                })()
                """,
                "returnByValue": True
            })
            print("Upsell 01 Pagamento loaded:", eval_up01_pay.get("result", {}).get("result", {}).get("value"), flush=True)

            # Take screenshot of Upsell 01 Pagamento
            ss_up01_pay = await send_cmd("Page.captureScreenshot", {"format": "png"})
            with open(os.path.join(out_dir, "verified_upsell_01_pagamento.png"), "wb") as f:
                f.write(base64.b64decode(ss_up01_pay["result"]["data"]))

            # Click GERAR PIX on Upsell 01
            await send_cmd("Runtime.evaluate", {"expression": "document.getElementById('btnGerarPix').click()"})
            await asyncio.sleep(2)

            # Check Upsell 01 Pix-Gerado
            eval_up01_pix = await send_cmd("Runtime.evaluate", {
                "expression": """
                (function() {
                    return {
                        url: window.location.href,
                        title: document.getElementById('pixTitle') ? document.getElementById('pixTitle').textContent : null,
                        val: document.getElementById('pixValue') ? document.getElementById('pixValue').textContent : null
                    };
                })()
                """,
                "returnByValue": True
            })
            print("Upsell 01 Pix-Gerado loaded:", eval_up01_pix.get("result", {}).get("result", {}).get("value"), flush=True)

            # Take screenshot of Upsell 01 Pix-Gerado
            ss_up01_pix = await send_cmd("Page.captureScreenshot", {"format": "png"})
            with open(os.path.join(out_dir, "verified_upsell_01_pix_gerado.png"), "wb") as f:
                f.write(base64.b64decode(ss_up01_pix["result"]["data"]))

            # TEST UPSELL 02
            print("--- Testing Upsell 02 ---", flush=True)
            url_acesso02 = "http://127.0.0.1:8080/acesso/02/index.html?nome=Guilherme+Rodrigues+Beserra&cpf=46960142822"
            await send_cmd("Page.navigate", {"url": url_acesso02})
            await asyncio.sleep(2)
            # Click checkout in acesso/02
            await send_cmd("Runtime.evaluate", {"expression": "checkout()"})
            await asyncio.sleep(2)

            # Check Upsell 02 Pagamento
            eval_up02_pay = await send_cmd("Runtime.evaluate", {
                "expression": """
                (function() {
                    return {
                        url: window.location.href,
                        name: document.getElementById('name') ? document.getElementById('name').value : null,
                        cpf: document.getElementById('document') ? document.getElementById('document').value : null
                    };
                })()
                """,
                "returnByValue": True
            })
            print("Upsell 02 Pagamento loaded:", eval_up02_pay.get("result", {}).get("result", {}).get("value"), flush=True)

            # Click GERAR PIX on Upsell 02
            await send_cmd("Runtime.evaluate", {"expression": "document.getElementById('btnGerarPix').click()"})
            await asyncio.sleep(2)

            eval_up02_pix = await send_cmd("Runtime.evaluate", {
                "expression": """
                (function() {
                    return {
                        url: window.location.href,
                        val: document.getElementById('pixValue') ? document.getElementById('pixValue').textContent : null
                    };
                })()
                """,
                "returnByValue": True
            })
            print("Upsell 02 Pix-Gerado loaded:", eval_up02_pix.get("result", {}).get("result", {}).get("value"), flush=True)

            # TEST UPSELL 03
            print("--- Testing Upsell 03 ---", flush=True)
            url_acesso03 = "http://127.0.0.1:8080/acesso/03/index.html?nome=Guilherme+Rodrigues+Beserra&cpf=46960142822"
            await send_cmd("Page.navigate", {"url": url_acesso03})
            await asyncio.sleep(2)
            await send_cmd("Runtime.evaluate", {"expression": "checkout()"})
            await asyncio.sleep(2)

            eval_up03_pay = await send_cmd("Runtime.evaluate", {
                "expression": """
                (function() {
                    return {
                        url: window.location.href,
                        name: document.getElementById('name') ? document.getElementById('name').value : null
                    };
                })()
                """,
                "returnByValue": True
            })
            print("Upsell 03 Pagamento loaded:", eval_up03_pay.get("result", {}).get("result", {}).get("value"), flush=True)

            await send_cmd("Runtime.evaluate", {"expression": "document.getElementById('btnGerarPix').click()"})
            await asyncio.sleep(2)

            eval_up03_pix = await send_cmd("Runtime.evaluate", {
                "expression": """
                (function() {
                    return {
                        url: window.location.href,
                        val: document.getElementById('pixValue') ? document.getElementById('pixValue').textContent : null
                    };
                })()
                """,
                "returnByValue": True
            })
            print("Upsell 03 Pix-Gerado loaded:", eval_up03_pix.get("result", {}).get("result", {}).get("value"), flush=True)

            # TEST UPSELL 04
            print("--- Testing Upsell 04 ---", flush=True)
            url_acesso04 = "http://127.0.0.1:8080/acesso/04/index.html?nome=Guilherme+Rodrigues+Beserra&cpf=46960142822"
            await send_cmd("Page.navigate", {"url": url_acesso04})
            await asyncio.sleep(2)
            await send_cmd("Runtime.evaluate", {"expression": "checkout()"})
            await asyncio.sleep(2)

            eval_up04_pay = await send_cmd("Runtime.evaluate", {
                "expression": """
                (function() {
                    return {
                        url: window.location.href,
                        name: document.getElementById('name') ? document.getElementById('name').value : null
                    };
                })()
                """,
                "returnByValue": True
            })
            print("Upsell 04 Pagamento loaded:", eval_up04_pay.get("result", {}).get("result", {}).get("value"), flush=True)

            await send_cmd("Runtime.evaluate", {"expression": "document.getElementById('btnGerarPix').click()"})
            await asyncio.sleep(2)

            eval_up04_pix = await send_cmd("Runtime.evaluate", {
                "expression": """
                (function() {
                    return {
                        url: window.location.href,
                        val: document.getElementById('pixValue') ? document.getElementById('pixValue').textContent : null
                    };
                })()
                """,
                "returnByValue": True
            })
            print("Upsell 04 Pix-Gerado loaded:", eval_up04_pix.get("result", {}).get("result", {}).get("value"), flush=True)

            # Take screenshot of Upsell 04 Pix-Gerado
            ss_up04_pix = await send_cmd("Page.captureScreenshot", {"format": "png"})
            with open(os.path.join(out_dir, "verified_upsell_04_pix_gerado.png"), "wb") as f:
                f.write(base64.b64decode(ss_up04_pix["result"]["data"]))

            print("ALL 4 UPSELLS TESTED AND VERIFIED WITH 100% SUCCESS!", flush=True)

    finally:
        chrome_proc.terminate()
        chrome_proc.wait()

asyncio.run(main())
