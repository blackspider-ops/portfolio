# Portfolio Admin Extension

A Chrome extension for quick access to the tejassinghal.dev admin panel.

## Features

- 🔐 Login with Supabase Auth
- 💾 Remember email option
- 🚀 Quick links to Dashboard, Projects, Blog, Settings
- 🎨 Dark theme matching the portfolio design

## Installation

### 1. Generate PNG icons (required - one time only)

Chrome requires PNG icons. Use the included generator:

1. Open `generate-icons.html` in your browser (just double-click it)
2. Click "Download All Icons" button
3. Move the downloaded PNG files to the `icons/` folder

### 2. Load the extension in Chrome

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked"
4. Select the `portfolio-admin-extension` folder
5. The extension icon should appear in your toolbar

## Usage

1. Click the extension icon in Chrome toolbar
2. Enter your admin email and password
3. Click "Login to Admin"
4. Once logged in, use the quick links to navigate to different admin sections

## Security Notes

- Credentials are stored securely in Chrome's local storage
- Session tokens are validated on each popup open
- The extension only has permissions for tejassinghal.dev

## Troubleshooting

**"Invalid login credentials"**
- Make sure you're using the correct email/password for your Supabase admin account

**Extension not loading**
- Ensure all PNG icons exist in the `icons/` folder
- Check Chrome's extension error logs at `chrome://extensions/`

**Session expired**
- Simply log in again - the extension will refresh your session
