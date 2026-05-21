from playwright.sync_api import sync_playwright

def run(page):
    page.goto("http://localhost:3000")
    page.wait_for_timeout(1000)
    # Check Dashboard
    page.screenshot(path="verification/screenshots/dashboard_final.png")

    # Check Schedule (Week View)
    page.locator('.topbar').get_by_role("button", name="Розклад").click()
    page.wait_for_timeout(1000)
    # Ensure scrolled to top
    page.evaluate("document.querySelector('.swrap.mh').scrollTop = 0")
    page.screenshot(path="verification/screenshots/schedule_week_final.png")

    # Check Generator
    page.locator('.topbar').get_by_role("button", name="Генератор").click()
    page.wait_for_timeout(1000)
    page.screenshot(path="verification/screenshots/generator_final.png")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch()
        context = browser.new_context(record_video_dir="verification/videos", viewport={'width': 1280, 'height': 800})
        page = context.new_page()
        run(page)
        context.close()
        browser.close()
