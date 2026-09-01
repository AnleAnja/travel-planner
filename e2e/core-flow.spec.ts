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
    page.getByRole('heading', { name: '[Reisename]' }),
  ).toBeVisible()
  await expect(page.getByText('Willkommen in [Reiseziel]!')).toBeVisible()

  await page
    .getByLabel(isMobile ? 'Mobile Navigation' : 'Reisebereiche')
    .getByRole('button', { name: 'Packen' })
    .click()
  await expect(page.getByRole('heading', { name: 'Packliste' })).toBeVisible()
  await expect(page.getByText('[Gemeinsamer Packgegenstand]')).toBeVisible()
})

test('embeds a Google Maps location in the day plan', async ({
  page,
  isMobile,
}) => {
  await page
    .getByLabel(isMobile ? 'Mobile Navigation' : 'Reisebereiche')
    .getByRole('button', { name: 'Plan' })
    .click()

  const map = page.getByTitle('Karte für [Ankunft und Check-in]')
  await expect(map).toBeVisible()
  await expect(map).toHaveAttribute('src', /maps\.google\.com\/maps/)
})

test('shows and creates booking records', async ({ page, isMobile }) => {
  await page
    .getByLabel(isMobile ? 'Mobile Navigation' : 'Reisebereiche')
    .getByRole('button', { name: 'Buchungen' })
    .click()
  await expect(page.getByText('[Hinreise]')).toBeVisible()

  await page.getByRole('button', { name: 'Buchung', exact: true }).click()
  await page.getByLabel('Titel').fill('[Neue Buchung]')
  await page.getByLabel('Beginn / Check-in').fill('2026-09-15T13:00')
  await page.getByRole('button', { name: 'Speichern' }).click()
  await expect(page.getByRole('heading', { name: '[Neue Buchung]' })).toBeVisible()
})

test('keeps the selected section in hash navigation', async ({
  page,
  isMobile,
}) => {
  await page.goto('/#/bookings')
  await expect(
    page.getByRole('heading', { name: 'Buchungen', exact: true }),
  ).toBeVisible()

  await page
    .getByLabel(isMobile ? 'Mobile Navigation' : 'Reisebereiche')
    .getByRole('button', { name: 'Plan' })
    .click()
  await expect(page).toHaveURL(/#\/plan$/)

  await page.goBack()
  await expect(page).toHaveURL(/#\/bookings$/)
})

test('adds an evenly split expense', async ({ page, isMobile }) => {
  await page
    .getByLabel(isMobile ? 'Mobile Navigation' : 'Reisebereiche')
    .getByRole('button', { name: 'Ausgaben' })
    .click()
  await page.getByRole('button', { name: 'Ausgabe', exact: true }).click()
  await page.getByLabel('Beschreibung').fill('[Neue Ausgabe]')
  await page.getByLabel('Betrag').fill('90')
  await page.getByRole('button', { name: 'Speichern' }).click()

  await expect(page.getByText('[Neue Ausgabe]')).toBeVisible()
  await expect(page.getByText('612,00 €')).toBeVisible()
})
