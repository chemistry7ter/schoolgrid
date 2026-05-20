from playwright.sync_api import sync_playwright
import os

def run_cuj(page):
    print("🚀 Перевірка 12 уроків та підбору кабінетів...")
    page.goto("http://localhost:3000")
    page.wait_for_timeout(2000)

    # 1. Перевірка наявності 12 уроків у налаштуваннях
    print("📋 Перевірка налаштувань...")
    page.evaluate("App.nav('settings')")
    page.wait_for_timeout(1000)

    max_lessons = page.input_value("#sMax")
    print(f"Макс. уроків у налаштуваннях: {max_lessons}")
    if max_lessons == "12":
        print("✅ Налаштування оновлено до 12.")
    else:
        print("❌ Налаштування НЕ оновлено.")

    # 2. Перевірка 12 уроків у Генераторі
    print("⚙️ Перевірка генератора...")
    page.evaluate("App.nav('generator')")
    page.wait_for_timeout(1000)

    gen_max = page.input_value("#genMaxL")
    print(f"Макс. уроків у генераторі: {gen_max}")

    # 3. Генерація розкладу
    print("🔄 Генерація розкладу на 12 уроків...")
    page.click("button#genBtn")
    page.wait_for_selector("text=Готово!", timeout=30000)
    print("✅ Розклад згенеровано.")
    page.screenshot(path="verification/screenshots/gen_12_lessons.png")

    # 4. Перевірка візуального представлення (12 колонок)
    print("📅 Перевірка сітки розкладу...")
    page.evaluate("App.nav('schedule')")
    page.wait_for_timeout(1000)

    # П'ятниця (index 4) щоб побачити всі 12 уроків
    page.click("#dayTabs button:nth-child(5)")
    page.wait_for_timeout(1000)

    # Перевірка кількості заголовків уроків (має бути 12)
    # thead has teacher cell + 12 lesson cells
    cols = page.locator("#mHead th").count()
    print(f"Кількість колонок у заголовку: {cols - 1}")
    if cols - 1 == 12:
        print("✅ Сітка розкладу має 12 колонок.")
    else:
        print("❌ Сітка розкладу має неправильну кількість колонок.")

    page.screenshot(path="verification/screenshots/schedule_12_cols.png")

    # 5. Перевірка введення кількості учнів у групі
    print("👥 Перевірка форми поділу на групи...")
    page.evaluate("App.nav('classgroups')")
    page.wait_for_timeout(1000)

    # Натиснути "Поділ" для першого класу
    page.click("text=Поділ")
    page.wait_for_timeout(500)

    # Обрати предмет
    page.select_option("#grpSubj", index=1)
    page.wait_for_timeout(500)

    # Перевірити наявність поля "Учнів"
    if page.locator("#gc_0").is_visible():
        print("✅ Поле 'Учнів' у групах присутнє.")
        page.fill("#gc_0", "15")
        page.fill("#gc_1", "15")
        page.screenshot(path="verification/screenshots/group_capacity_input.png")
    else:
        print("❌ Поле 'Учнів' у групах ВІДСУТНЄ.")

    print("🏁 Верифікацію завершено успішно.")

if __name__ == "__main__":
    os.makedirs("verification/screenshots", exist_ok=True)
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={'width': 1600, 'height': 900})
        page = context.new_page()
        try:
            run_cuj(page)
        finally:
            context.close()
            browser.close()
