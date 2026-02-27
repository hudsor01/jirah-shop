import { test, expect } from '@playwright/test'

test.describe('Smoke Test', () => {
  test('homepage loads and displays content', async ({ page }) => {
    await page.goto('/')

    // Verify page loads with correct title
    await expect(page).toHaveTitle(/jirah/i)

    // Verify main content area exists
    const main = page.locator('main')
    await expect(main).toBeVisible()
  })

  test('can navigate to a product page', async ({ page }) => {
    await page.goto('/')

    // Find and click the first product link
    const firstProduct = page.locator('a[href^="/products/"]').first()
    const count = await firstProduct.count()

    // Only run this test if products exist on the page
    test.skip(count === 0, 'No products on homepage — skipping product navigation')

    await firstProduct.click()

    // Verify we're on a product page
    await expect(page).toHaveURL(/\/products\//)

    // Product page should have an add to cart button
    const addToCartButton = page.getByRole('button', { name: /add to cart/i })
    await expect(addToCartButton).toBeVisible()
  })

  test('can add item to cart', async ({ page }) => {
    await page.goto('/')

    // Find the first add-to-cart button on the homepage
    const addToCartBtn = page.getByRole('button', { name: /add to cart/i }).first()
    const btnCount = await addToCartBtn.count()

    // Only run if there are add-to-cart buttons
    test.skip(btnCount === 0, 'No add-to-cart buttons on homepage — skipping cart test')

    await addToCartBtn.click()

    // Verify cart feedback appears (toast or cart drawer)
    await expect(
      page
        .getByText(/added to cart/i)
        .or(page.locator('[data-testid="cart-drawer"]'))
    ).toBeVisible({ timeout: 5000 })
  })
})
