from playwright.sync_api import sync_playwright
import os

def run_verify(page):
    print("🎨 Візуальна перевірка розкладу...")
    page.goto("http://localhost:3000")
    page.wait_for_timeout(2000)

    # 1. Скріншот дашборду
    page.screenshot(path="verification/screenshots/visual_dashboard.png")

    # 2. Скріншот тижневого розкладу
    page.evaluate("App.nav('schedule')")
    page.wait_for_timeout(1000)
    page.screenshot(path="verification/screenshots/visual_week_schedule.png")

    # 3. Скріншот денного розкладу з підсвічуванням кабінетів
    page.click("#dayTabs button:nth-child(1)") # Пн
    page.wait_for_timeout(1000)
    page.screenshot(path="verification/screenshots/visual_day_schedule.png")

    print("✅ Скріншоти збережено.")

if __name__ == "__main__":
    os.makedirs("verification/screenshots", exist_ok=True)
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={'width': 1600, 'height': 900})
        page = context.new_page()
        try:
            run_verify(page)
        finally:
            context.close()
            browser.close()
