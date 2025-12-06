from playwright.sync_api import sync_playwright

def verify_frontend():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            print("Navigating to home page...")
            page.goto("http://localhost:3000")

            print("Clicking on 'Start Analysis' to start app...")
            # Using text since role might be ambiguous with icons or multiple buttons
            page.get_by_text("Start Analysis").click()

            print("Waiting for navigation to 'ETFS' tab...")
            # Click ETFS tab
            page.get_by_role("tab", name="ETFs").click()

            print("Waiting for list to load...")
            page.wait_for_timeout(5000)

            # Take screenshot
            page.screenshot(path="verification/etfs_tab.png")
            print("Screenshot saved to verification/etfs_tab.png")

        except Exception as e:
            print(f"Error: {e}")
            page.screenshot(path="verification/error.png")
        finally:
            browser.close()

if __name__ == "__main__":
    verify_frontend()
