import asyncio
from playwright.async_api import async_playwright
import os
import subprocess
import time

async def run_verification():
    # Start a local server to avoid ES module CORS issues with file://
    server = subprocess.Popen(["python3", "-m", "http.server", "8080"])
    time.sleep(2) # Give server time to start

    try:
        async with async_playwright() as p:
            browser = await p.chromium.launch()
            context = await browser.new_context(viewport={'width': 1280, 'height': 800})
            page = await context.new_page()

            # Open the app
            print("Navigating to app...")
            await page.goto("http://localhost:8080/index.html")

            # Wait for App to initialize - check for a navigation link
            await page.wait_for_selector("#nb-generator", timeout=10000)

            # 1. Generate schedule
            print("Starting generation...")
            await page.click("#nb-generator")
            await page.click("#genBtn")

            # Wait for "Готово!" or "✅ Розміщено" in log
            # The selector .genlog .lok appears when finished
            await page.wait_for_selector(".genlog .lok", timeout=60000)
            await asyncio.sleep(2) # Wait for UI updates
            await page.screenshot(path="verification/screenshots/generator_done.png")

            # 2. Check Class Management (Shifts)
            print("Checking class shifts...")
            await page.click("#nb-classgroups")
            await page.click("button:has-text('Зміни та умови')")
            await asyncio.sleep(0.5)
            await page.screenshot(path="verification/screenshots/class_shifts.png")

            # 3. Check Dashboard Schedule
            print("Checking dashboard...")
            await page.click("#nb-dashboard")
            await asyncio.sleep(1)
            # Ensure the table is rendered
            await page.wait_for_selector("#dashTbody tr")
            await page.screenshot(path="verification/screenshots/dashboard_schedule.png")

            # 4. Check Schedule Week View
            print("Checking schedule week view...")
            await page.click("#nb-schedule")
            await page.click("button:has-text('Весь тиждень')")
            await asyncio.sleep(2)
            await page.screenshot(path="verification/screenshots/schedule_grid.png")

            await browser.close()
    finally:
        server.terminate()

if __name__ == "__main__":
    os.makedirs("verification/screenshots", exist_ok=True)
    asyncio.run(run_verification())
