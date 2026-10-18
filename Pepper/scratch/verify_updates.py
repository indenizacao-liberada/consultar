from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 390, "height": 844})
    page.goto("http://127.0.0.1:8080/index.html?nome=FERNANDA%20RIBEIRO%20ALVES&cpf=12345678909", wait_until="networkidle")
    print("Page title:", page.title())
    
    # Check if page loads and goToAtendimento works
    page.evaluate("goToAtendimento()")
    page.wait_for_timeout(1000)
    
    # Check comprovante generation
    page.evaluate('''
        leadData.nome = "FERNANDA RIBEIRO ALVES";
        leadData.cpf = "123.456.789-09";
        requestComprovante();
    ''')
    page.wait_for_timeout(4500)
    
    # Check comprovante img
    img_src = page.evaluate('''
        var img = document.querySelector(".comprovante-img-wrapper img");
        img ? img.src.substring(0, 50) : "not found";
    ''')
    print("Comprovante img src:", img_src)
    
    # Screenshot of comprovante in chat
    page.screenshot(path="scratch/chat_comprovante_verified.png")
    print("Saved scratch/chat_comprovante_verified.png")
    
    # Check checkout Pagamento banner
    page.goto("http://127.0.0.1:8080/checkout/Pagamento/index.html", wait_until="networkidle")
    has_banner = page.evaluate("Boolean(document.querySelector('img[src*=\"4kono67hzeonbq4ylqfgrsp1f\"]'))")
    print("Checkout Pagamento has banner:", has_banner)
    
    # Check checkout Pix-Gerado banner
    page.goto("http://127.0.0.1:8080/checkout/Pix-Gerado/index.html", wait_until="networkidle")
    has_pix_banner = page.evaluate("Boolean(document.querySelector('img[src*=\"4kono67hzeonbq4ylqfgrsp1f\"]'))")
    print("Checkout Pix-Gerado has banner:", has_pix_banner)
    
    browser.close()
