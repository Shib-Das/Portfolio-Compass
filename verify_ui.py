
from playwright.sync_api import sync_playwright
import time

def verify_ui():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        # Emulate a desktop viewport
        context = browser.new_context(viewport={"width": 1920, "height": 1080})
        page = context.new_page()

        print("Navigating to home page...")
        try:
            page.goto("http://localhost:3000", timeout=60000)
        except Exception as e:
            print(f"Navigation failed: {e}")
            browser.close()
            return

        print("Waiting for Hero content...")
        # Wait for "Make your portfolio" text
        try:
            page.wait_for_selector("text=Make your portfolio", timeout=30000)
        except Exception as e:
            print(f"Hero load failed: {e}")
            page.screenshot(path="/home/jules/verification/error_hero.png")
            browser.close()
            return

        # Screenshot Hero
        print(" taking screenshot of Hero...")
        page.screenshot(path="/home/jules/verification/hero.png")

        # Scroll to Purpose Section
        print("Scrolling to Purpose Section...")
        page.evaluate("window.scrollBy(0, window.innerHeight)")
        time.sleep(2) # Wait for animations
        page.screenshot(path="/home/jules/verification/purpose.png")

        # Click "Start Analysis" to go to Quiz/App
        # Actually, let's try "View the Market" to skip quiz if possible,
        # based on Hero.tsx: <button onClick={onViewMarket}>View the Market</button>
        print("Clicking 'View the Market'...")
        try:
            page.get_by_text("View the Market").click()
        except Exception as e:
             print(f"Click failed: {e}")

        time.sleep(2) # Wait for transition

        # Now we should be in the App view (Trending Tab)
        print("Waiting for Trending Tab...")
        try:
            page.wait_for_selector("text=MAG-7", timeout=30000)
        except Exception as e:
             print(f"Trending load failed: {e}")
             page.screenshot(path="/home/jules/verification/error_trending.png")
             browser.close()
             return

        page.screenshot(path="/home/jules/verification/trending.png")

        # Now lets try to open ETF details for "NVDA" (should be in MAG-7)
        # Note: In the mock/dev env, we might not have real data, but the skeleton renders.
        # If real data loads, we can click it.
        # Let's try to find a card with text "NVDA" or just the first card in MAG-7 section.

        print("Clicking first card...")
        # TrendingSection renders cards.
        # We need to click the "View Details" button which appears on hover.
        # Or just click the card if onSelectItem is triggered by whole card?
        # Looking at TrendingSection.tsx:
        # The View button has onClick={() => handleView(etf)}
        # It is hidden by default: scale-0 group-hover:scale-100

        # Let's force hover on the first card
        # Locator for first card in MAG-7 section (first section usually)
        # The structure is complicated. Let's look for "NVDA" text.

        nvda_card = page.get_by_text("NVDA").first
        if nvda_card.is_visible():
            print("Found NVDA card, hovering...")
            nvda_card.hover()
            time.sleep(1)

            # Find the view button (arrow up right icon)
            # It has title="View Details"
            view_btn = page.get_by_title("View Details").first
            if view_btn.is_visible():
                print("Clicking View Details...")
                view_btn.click()

                print("Waiting for Drawer...")
                page.wait_for_selector("text=Key Metrics", timeout=10000)
                time.sleep(2)
                page.screenshot(path="/home/jules/verification/drawer.png")

                # Hover over a metric to trigger tooltip
                print("Hovering over Market Cap...")
                market_cap = page.get_by_text("Market Cap").first
                market_cap.hover()
                time.sleep(1)
                page.screenshot(path="/home/jules/verification/metric_tooltip.png")
            else:
                print("View button not visible")
        else:
             print("NVDA card not found")

        browser.close()

if __name__ == "__main__":
    verify_ui()
