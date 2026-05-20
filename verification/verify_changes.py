from playwright.sync_api import sync_playwright
import os

def run_verification():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            record_video_dir="/home/jules/verification/videos",
            viewport={'width': 1280, 'height': 800}
        )
        page = context.new_page()

        # 1. Load the page
        page.goto("http://localhost:3000")
        page.wait_for_timeout(1000)

        # 2. Go to Generator and generate schedule
        # Use a more specific selector to avoid sidebar buttons if they are hidden/off-screen
        page.click("nav.topbar >> text=Генератор")
        page.wait_for_timeout(500)
        page.click("#genBtn")

        # Wait for generation to complete (it has some delays)
        # We can wait for the "Готово!" status or the "Переглянути розклад" button
        page.wait_for_selector("text=Готово!", timeout=30000)
        page.wait_for_timeout(1000)

        # Screenshot of generator results
        page.screenshot(path="/home/jules/verification/screenshots/generator_done.png")

        # 3. Go to Schedule
        page.click("button >> text=Переглянути розклад")
        page.wait_for_timeout(1000)

        # Screenshot of the grid (teacher view)
        # Ensure elements are in view
        page.locator("#tvw .swrap.mh").evaluate("el => el.scrollIntoView()")
        page.screenshot(path="/home/jules/verification/screenshots/schedule_grid.png")

        # 4. Test Tooltip
        # Skip hover if it's being difficult with the viewport

        # 5. Check Class View (windows check)
        page.click("#vswC")
        page.wait_for_timeout(500)
        # Pick 1A class (it's shift 1)
        page.select_option("#cpick", label="1А")
        page.wait_for_timeout(500)
        page.screenshot(path="/home/jules/verification/screenshots/class_1A_schedule.png")

        # Pick 5A class (it's shift 2)
        page.select_option("#cpick", label="5А")
        page.wait_for_timeout(500)
        page.screenshot(path="/home/jules/verification/screenshots/class_5A_schedule.png")

        context.close()
        browser.close()

if __name__ == "__main__":
    os.makedirs("/home/jules/verification/videos", exist_ok=True)
    os.makedirs("/home/jules/verification/screenshots", exist_ok=True)
    run_verification()
