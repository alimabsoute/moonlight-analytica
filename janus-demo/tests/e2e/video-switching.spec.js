import { test, expect } from '@playwright/test';

test.describe('Video Switching E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the Live Monitor page
    await page.goto('/');
    // Wait for the page to load
    await page.waitForSelector('h1:has-text("Live Monitor")');
  });

  test('should display the Live Monitor page', async ({ page }) => {
    await expect(page.locator('h1')).toHaveText('Live Monitor');
  });

  test('should show video library button', async ({ page }) => {
    const libraryButton = page.locator('button:has-text("Video Library")');
    await expect(libraryButton).toBeVisible();
  });

  test('should open video library modal', async ({ page }) => {
    // Click the Video Library button
    await page.click('button:has-text("Video Library")');

    // Wait for modal to appear
    await page.waitForSelector('.modal-overlay');

    // Check for modal header
    await expect(page.locator('.modal-header h2')).toContainText('Video Library');
  });

  test('should open video source modal', async ({ page }) => {
    // Click the Change Video Source button
    await page.click('button:has-text("Change Video Source")');

    // Wait for modal to appear
    await page.waitForSelector('.modal-overlay');

    // Check for source options
    await expect(page.locator('text=Demo Video / YouTube')).toBeVisible();
    await expect(page.locator('text=Live Webcam')).toBeVisible();
    await expect(page.locator('text=Procedural Demo')).toBeVisible();
  });

  test('should close modal when clicking X', async ({ page }) => {
    // Open video library
    await page.click('button:has-text("Video Library")');
    await page.waitForSelector('.modal-overlay');

    // Click close button
    await page.click('.modal-close');

    // Modal should be gone
    await expect(page.locator('.modal-overlay')).not.toBeVisible();
  });

  test('should close modal when clicking overlay', async ({ page }) => {
    // Open video library
    await page.click('button:has-text("Video Library")');
    await page.waitForSelector('.modal-overlay');

    // Click overlay (outside modal content)
    await page.click('.modal-overlay', { position: { x: 10, y: 10 } });

    // Modal should be gone
    await expect(page.locator('.modal-overlay')).not.toBeVisible();
  });

  test('should display model selection buttons', async ({ page }) => {
    await expect(page.locator('text=Model:')).toBeVisible();
    await expect(page.locator('button:has-text("yolov8n")')).toBeVisible();
    await expect(page.locator('button:has-text("yolo11n")')).toBeVisible();
    await expect(page.locator('button:has-text("yolo11s")')).toBeVisible();
  });

  test('should display tracker selection buttons', async ({ page }) => {
    await expect(page.locator('text=Tracker:')).toBeVisible();
    await expect(page.locator('button:has-text("bytetrack")')).toBeVisible();
    await expect(page.locator('button:has-text("botsort")')).toBeVisible();
  });

  test('should switch model when clicking model button', async ({ page }) => {
    // Intercept the model switch request
    let modelSwitchCalled = false;
    await page.route('**/video/model**', async (route) => {
      modelSwitchCalled = true;
      await route.fulfill({
        status: 200,
        body: JSON.stringify({ ok: true }),
      });
    });

    // Click on yolo11n model
    await page.click('button:has-text("yolo11n")');

    // Verify the request was made
    expect(modelSwitchCalled).toBeTruthy();
  });

  test('should switch tracker when clicking tracker button', async ({ page }) => {
    // Intercept the tracker switch request
    let trackerSwitchCalled = false;
    await page.route('**/video/tracker**', async (route) => {
      trackerSwitchCalled = true;
      await route.fulfill({
        status: 200,
        body: JSON.stringify({ ok: true }),
      });
    });

    // Click on botsort tracker
    await page.click('button:has-text("botsort")');

    // Verify the request was made
    expect(trackerSwitchCalled).toBeTruthy();
  });

  test('should select procedural demo option', async ({ page }) => {
    // Open video source modal
    await page.click('button:has-text("Change Video Source")');
    await page.waitForSelector('.modal-overlay');

    // Click on Procedural Demo option
    await page.click('text=Procedural Demo');

    // The radio should be selected
    const radio = page.locator('input[value="procedural"]');
    await expect(radio).toBeChecked();
  });

  test('should display KPI stats', async ({ page }) => {
    // Check that KPI stats are displayed
    await expect(page.locator('text=Current Count')).toBeVisible();
    await expect(page.locator('text=Average')).toBeVisible();
    await expect(page.locator('text=Peak')).toBeVisible();
    await expect(page.locator('text=Total Events')).toBeVisible();
  });

  test('should have auto-refresh toggle', async ({ page }) => {
    const checkbox = page.locator('input[type="checkbox"]');
    await expect(checkbox).toBeVisible();
    await expect(checkbox).toBeChecked(); // Default is on

    // Toggle it off
    await checkbox.click();
    await expect(checkbox).not.toBeChecked();

    // Toggle it back on
    await checkbox.click();
    await expect(checkbox).toBeChecked();
  });

  test('should have refresh button', async ({ page }) => {
    const refreshButton = page.locator('button:has-text("Refresh Now")');
    await expect(refreshButton).toBeVisible();
  });
});

test.describe('Video Library Modal Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('h1:has-text("Live Monitor")');
  });

  test('should show upload section in library', async ({ page }) => {
    // Mock video library response
    await page.route('**/video/library', async (route) => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({
          videos: [
            { id: 1, name: 'Test Video', description: 'A test video', file_size: 1024000, uploaded_at: '2024-01-01' },
          ],
        }),
      });
    });

    await page.click('button:has-text("Video Library")');
    await page.waitForSelector('.modal-overlay');

    await expect(page.locator('text=Upload New Video')).toBeVisible();
  });

  test('should display videos in library', async ({ page }) => {
    // Mock video library response with videos
    await page.route('**/video/library', async (route) => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({
          videos: [
            { id: 1, name: 'Sample Video 1', description: 'First sample', file_size: 1024000, uploaded_at: '2024-01-01' },
            { id: 2, name: 'Sample Video 2', description: 'Second sample', file_size: 2048000, uploaded_at: '2024-01-02' },
          ],
        }),
      });
    });

    await page.click('button:has-text("Video Library")');
    await page.waitForSelector('.modal-overlay');

    await expect(page.locator('text=Sample Video 1')).toBeVisible();
    await expect(page.locator('text=Sample Video 2')).toBeVisible();
  });

  test('should show play button for each video', async ({ page }) => {
    await page.route('**/video/library', async (route) => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({
          videos: [
            { id: 1, name: 'Test Video', description: 'Test', file_size: 1024000, uploaded_at: '2024-01-01' },
          ],
        }),
      });
    });

    await page.click('button:has-text("Video Library")');
    await page.waitForSelector('.modal-overlay');

    const playButton = page.locator('.video-card button:has-text("Play & Track")');
    await expect(playButton).toBeVisible();
  });

  test('should call play endpoint when clicking play', async ({ page }) => {
    let playEndpointCalled = false;

    await page.route('**/video/library', async (route) => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({
          videos: [
            { id: 1, name: 'Test Video', description: 'Test', file_size: 1024000, uploaded_at: '2024-01-01' },
          ],
        }),
      });
    });

    await page.route('**/video/library/1/play', async (route) => {
      playEndpointCalled = true;
      await route.fulfill({
        status: 200,
        body: JSON.stringify({ ok: true }),
      });
    });

    await page.click('button:has-text("Video Library")');
    await page.waitForSelector('.modal-overlay');

    await page.click('.video-card button:has-text("Play & Track")');

    // Wait a bit for the request to be made
    await page.waitForTimeout(500);

    expect(playEndpointCalled).toBeTruthy();
  });
});

test.describe('Procedural Demo Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('h1:has-text("Live Monitor")');
  });

  test('should show procedural demo when selected', async ({ page }) => {
    // Open video source modal
    await page.click('button:has-text("Change Video Source")');
    await page.waitForSelector('.modal-overlay');

    // Select Procedural Demo
    await page.click('text=Procedural Demo');

    // Start the demo
    await page.click('button:has-text("Start Procedural Demo")');

    // Should show the demo container
    await page.waitForSelector('.procedural-demo-container');

    // Should have 3D/2D toggle
    await expect(page.locator('text=3D Isometric View')).toBeVisible();
    await expect(page.locator('text=2D Top-Down View')).toBeVisible();
  });

  test('should toggle between 3D and 2D views', async ({ page }) => {
    // Open video source modal and start procedural demo
    await page.click('button:has-text("Change Video Source")');
    await page.waitForSelector('.modal-overlay');
    await page.click('text=Procedural Demo');
    await page.click('button:has-text("Start Procedural Demo")');
    await page.waitForSelector('.procedural-demo-container');

    // Initially 3D should be active (default)
    const btn3d = page.locator('button:has-text("3D Isometric View")');
    const btn2d = page.locator('button:has-text("2D Top-Down View")');

    // Click 2D button
    await btn2d.click();

    // Click back to 3D
    await btn3d.click();
  });

  test('should have switch to real video button', async ({ page }) => {
    // Open video source modal and start procedural demo
    await page.click('button:has-text("Change Video Source")');
    await page.waitForSelector('.modal-overlay');
    await page.click('text=Procedural Demo');
    await page.click('button:has-text("Start Procedural Demo")');
    await page.waitForSelector('.procedural-demo-container');

    // Should have the switch button
    await expect(page.locator('button:has-text("Switch to Real Video")')).toBeVisible();
  });
});
