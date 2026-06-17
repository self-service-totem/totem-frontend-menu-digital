import { chromium } from '@playwright/test';

const browser = await chromium.launch();
const page = await browser.newPage();
const viewport = { width: 1280, height: 800 };
await page.setViewportSize(viewport);

// Navega al hub
await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });

// Espera a que los iconos sean visibles
await page.waitForSelector('.ff-hub-card-icon');

// Toma una captura
await page.screenshot({ path: '/tmp/hub_screenshot.png' });

console.log('Screenshot captured');

await browser.close();
