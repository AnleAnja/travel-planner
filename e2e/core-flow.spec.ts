import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => localStorage.clear())
  await page.reload()
})

test('shows the travel dashboard and switches sections', async ({
  page,
  isMobile,
}) => {
  await expect(
    page.getByRole('heading', { name: '[Trip name]' }),
  ).toBeVisible()
  await expect(page.getByText('Welcome to [Destination]!')).toBeVisible()

  await page
    .getByLabel(isMobile ? 'Mobile navigation' : 'Trip sections')
    .getByRole('button', { name: 'Packing' })
    .click()
  await expect(page.getByRole('heading', { name: 'Packing list' })).toBeVisible()
  await expect(page.getByText('[Shared packing item]')).toBeVisible()
})

test('embeds a Google Maps location in the day plan', async ({
  page,
  isMobile,
}) => {
  await page
    .getByLabel(isMobile ? 'Mobile navigation' : 'Trip sections')
    .getByRole('button', { name: 'Plan' })
    .click()

  const map = page.getByTitle('Map for [Arrival and check-in]')
  await expect(map).toBeVisible()
  await expect(map).toHaveAttribute('src', /maps\.google\.com\/maps/)
})

test('shows and creates booking records', async ({ page, isMobile }) => {
  await page
    .getByLabel(isMobile ? 'Mobile navigation' : 'Trip sections')
    .getByRole('button', { name: 'Bookings' })
    .click()
  await expect(page.getByText('[Outbound trip]')).toBeVisible()

  await page.getByRole('button', { name: 'Booking', exact: true }).click()
  await page.getByLabel('Title').fill('[New booking]')
  await page.getByLabel('Start / check-in').fill('2026-09-15T13:00')
  await page.getByRole('button', { name: 'Save' }).click()
  await expect(page.getByRole('heading', { name: '[New booking]' })).toBeVisible()
})

test('keeps the selected section in hash navigation', async ({
  page,
  isMobile,
}) => {
  await page.goto('/#/bookings')
  await expect(
    page.getByRole('heading', { name: 'Bookings', exact: true }),
  ).toBeVisible()

  await page
    .getByLabel(isMobile ? 'Mobile navigation' : 'Trip sections')
    .getByRole('button', { name: 'Plan' })
    .click()
  await expect(page).toHaveURL(/#\/plan$/)

  await page.goBack()
  await expect(page).toHaveURL(/#\/bookings$/)
})

test('adds an evenly split expense', async ({ page, isMobile }) => {
  await page
    .getByLabel(isMobile ? 'Mobile navigation' : 'Trip sections')
    .getByRole('button', { name: 'Expenses' })
    .click()
  await page.getByRole('button', { name: 'Expense', exact: true }).click()
  await page.getByLabel('Description').fill('[New expense]')
  await page.getByLabel('Amount').fill('90')
  await page.getByRole('button', { name: 'Save' }).click()

  await expect(page.getByText('[New expense]')).toBeVisible()
  await expect(page.getByText('€612.00')).toBeVisible()
})

test('shows the same guest name in the header and people list', async ({
  page,
  isMobile,
}) => {
  await expect(page.locator('.profile strong')).toHaveText('Guest')

  if (isMobile) {
    await page.getByLabel('Open menu').click()
    await page.getByRole('button', { name: 'People' }).click()
  } else {
    await page
      .getByLabel('Trip sections')
      .getByRole('button', { name: 'People' })
      .click()
  }

  await expect(page.getByText('Guest (You)')).toBeVisible()
})
