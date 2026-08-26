# DM Grid Share

A lightweight, completely offline, and serverless dual-screen image and caption sharing tool designed specifically for tabletop Gamemasters.

If you play games like Dungeons & Dragons in person with a second TV or monitor facing your players, this single-file tool lets you instantly paste screenshots or drag-and-drop local files to display them in a beautifully organized grid.

## Key Features

- **10 Independent Slots:** Prepare your maps, NPC portraits, and monster statblocks in advance.
- **Privacy-First Workflow:** Newly pasted or dropped images are hidden from your players by default. You can quietly add captions and prepare slots, pushing them to the player screen only when you click the green `'Show'` button.
- **Live Captioning:** Type real-time titles or labels that instantly display below the images on the players' screen.
- **Intelligent Grid Scaling:** The player screen automatically calculates the best layout to maximize screen space for up to 9 active images (automatically organizing them into structured 2x2, 2x3, or 3x3 grids).
- **Frictionless Uploads:** Quickly select a slot and press `'Ctrl + V'` to paste a screenshot, or simply drag and drop an image file directly from your computer.
- **Master Blackout:** Instantly hide the players' screen with a single click, keeping your active layouts ready to restore at a second's notice.
- **100% Offline & Private:** Uses your browser's built-in `'BroadcastChannel'` technology. It requires no servers, no internet connection, and never uploads your images anywhere.

---

## How to Set It Up

Because this tool is built entirely into a single file, setup takes less than a minute:

1. **Save the Code:** Save the HTML code as `'share.html'` on your computer.
2. **Launch the DM Control Panel:** Double-click `'share.html'` to open it in your browser (Chrome, Edge, Firefox, or Safari). Click **'DM (Sender)'**. Keep this window on your main monitor.
3. **Launch the Player View:** Open a second browser window, drag it over to your players' monitor or TV, and open `'share.html'` there as well. Click **'Players (Receiver)'** and press `'F11'` to make the browser fullscreen.

---

## How to Use It

### 1. Adding Images

- Click once on any slot card (it will highlight with a blue outline) and press `'Ctrl + V'` to paste a screenshot.
- Alternatively, drag any image file from your computer's folders and drop it directly onto the slot card.

### 2. Managing the Display

- When an image is first loaded, it will appear in your control panel but remain hidden from the players.
- Click the grey `'Show'` button to push it to the players' screen. The card will highlight green to confirm they can see it.
- Click `'Hide'` to temporarily take it off their screen while keeping it saved in your slot.
- Click `'Remove'` to delete the image and caption completely from the slot.

### 3. Adding Captions

- Type into the text input box below any loaded image.
- The caption will instantly display in a styled black-and-glass overlay right below the image on the players' screen.

### 4. Grid Rules

The players' screen will dynamically adjust to maximize space depending on how many images you have set to `'Show'`:

- **1 Image:** Full screen.
- **2 Images:** 1 row, 2 columns (side-by-side).
- **3 or 4 Images:** Clean 2x2 grid.
- **5 or 6 Images:** 2 rows, 3 columns.
- **7 or 8 Images:** 2 rows, 4 columns.
- **9 Images:** 3x3 grid.
- _Note: A 10th active image will be safely ignored on the player screen to keep the grid looking clean._
