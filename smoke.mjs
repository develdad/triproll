import { chromium } from 'playwright-core'

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox'] })
const page = await browser.newPage({ viewport: { width: 390, height: 844 } })
const errors = []
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message))
page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()) })

// Home
await page.goto('http://localhost:4173/', { waitUntil: 'networkidle' })
await page.screenshot({ path: '/tmp/home.png' })

// Quiz: answer all questions
await page.goto('http://localhost:4173/quiz', { waitUntil: 'networkidle' })
await page.getByText('Start').click()
for (let i = 0; i < 10; i++) {
  await page.waitForTimeout(250)
  const btns = page.locator('div.space-y-3 > button')
  await btns.nth(i % 4).click()
}
await page.waitForTimeout(500)
await page.screenshot({ path: '/tmp/quiz-result.png' })
const archetype = await page.locator('h1').textContent()
console.log('ARCHETYPE:', archetype)

// Roll with DNA
await page.goto('http://localhost:4173/roll', { waitUntil: 'networkidle' })
await page.waitForTimeout(4000) // globe load
await page.getByRole('button', { name: /^Roll$/ }).click()
await page.waitForTimeout(9000) // spin + land
await page.screenshot({ path: '/tmp/roll.png', fullPage: true })
const card = await page.locator('h3').first().textContent().catch(() => 'NO CARD')
console.log('ROLLED:', card)
console.log('ERRORS:', errors.length ? errors.join('\n') : 'none')
await browser.close()
