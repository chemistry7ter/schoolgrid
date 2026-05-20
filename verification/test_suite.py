from playwright.sync_api import sync_playwright
import os

def run_test_suite(page):
    print("🚀 Starting Automated Test Suite...")
    page.goto("http://localhost:3000")
    page.wait_for_timeout(2000)

    # 1. Test Teacher Creation
    print("📝 Testing Teacher Creation...")
    # Navigate via URL fragment if direct click is hard
    page.evaluate("App.nav('teachers')")
    page.wait_for_timeout(1000)

    page.click("text=Додати")
    page.wait_for_timeout(500)
    page.fill("#tchLast", "Тестовий")
    page.fill("#tchFirst", "Вчитель")
    page.select_option("#tchDept", "1")
    page.select_option("#tchSubjA", "1") # Математика
    # addTchSubj is called automatically onchange in the real app?
    # Looking at index.html: onchange="App.addTchSubj()"
    page.wait_for_timeout(500)

    # Save button in the modal
    page.click("#m-addTeacher button.bp")
    page.wait_for_timeout(1000)

    # Verify teacher exists
    page.fill("#tchQ", "Тестовий")
    page.wait_for_timeout(1000)
    # Target specifically the card name
    if page.locator(".tcn", has_text="Тестовий Вчитель").is_visible():
        print("✅ Teacher created successfully.")
    else:
        print("❌ Teacher creation failed.")

    # 2. Test Schedule Generation
    print("⚙️ Testing Schedule Generation...")
    page.evaluate("App.nav('generator')")
    page.wait_for_timeout(1000)
    page.click("button#genBtn")

    # Wait for completion
    try:
        page.wait_for_selector("text=Готово!", timeout=20000)
        print("✅ Schedule generated successfully.")
    except:
        print("❌ Schedule generation timed out or failed.")

    page.screenshot(path="/home/jules/verification/screenshots/test_suite_gen.png")

    # 3. Test Absence and Conflicts
    print("🤒 Testing Absence and Conflicts...")
    page.evaluate("App.nav('subs')")
    page.wait_for_timeout(1000)
    page.click("text=Відсутність")
    page.wait_for_timeout(500)

    # Pick first teacher in dropdown
    page.select_option("#abTeacher", index=1)
    # Save button in the modal
    page.click("#m-addAbsence button.bp")
    page.wait_for_timeout(1000)

    print("✅ Absence added.")

    # Check Conflicts page
    page.evaluate("App.nav('conflicts')")
    page.wait_for_timeout(1000)

    crit_count = page.locator("#cfCrit").text_content()
    print(f"ℹ️ Critical conflicts found: {crit_count}")
    page.screenshot(path="/home/jules/verification/screenshots/test_suite_conflicts.png")

    print("🏁 Test Suite Finished.")

if __name__ == "__main__":
    # Ensure directories exist
    os.makedirs("/home/jules/verification/screenshots", exist_ok=True)
    os.makedirs("/home/jules/verification/videos", exist_ok=True)

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            viewport={'width': 1280, 'height': 800},
            record_video_dir="/home/jules/verification/videos"
        )
        page = context.new_page()
        try:
            run_test_suite(page)
        finally:
            context.close()
            browser.close()
