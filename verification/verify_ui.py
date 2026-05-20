from playwright.sync_api import sync_playwright
import os

def run_verify(page):
    page.goto("http://localhost:3000")
    page.wait_for_timeout(2000)

    # Target topbar specifically
    topbar = page.locator(".topbar")
    topbar.screenshot(path="verification/screenshots/topbar_new.png")

    # Hover over one of the buttons to see the effect
    page.hover(".tbr .bs:first-child")
    page.wait_for_timeout(500)
    topbar.screenshot(path="verification/screenshots/topbar_hover.png")

    print("✅ Screenshots captured.")

if __name__ == "__main__":
    os.makedirs("verification/screenshots", exist_ok=True)
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={'width': 1280, 'height': 800})
        page = context.new_page()
        try:
            run_verify(page)
        finally:
            context.close()
            browser.close()
