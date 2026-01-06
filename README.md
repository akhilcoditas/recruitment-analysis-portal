# DataFlow - Secure Google Sheets Dashboard

A sleek, modern dashboard that displays data from your **private** Google Spreadsheet using Apps Script.

## 🔒 Privacy First

Your spreadsheet **stays private** - it's never published to the web. Data is securely fetched through a Google Apps Script that only you control.

## 🚀 Quick Start

### Step 1: Set Up Apps Script (One-time)

1. Open your Google Sheet
2. Go to **Extensions → Apps Script**
3. Delete any existing code
4. Copy and paste the contents of `apps-script-code.js`
5. Click **Deploy → New deployment**
6. Select type: **Web app**
7. Set "Who has access" to **Anyone**
8. Click **Deploy** and authorize when prompted
9. Copy the **Web app URL**

### Step 2: Deploy to GitHub Pages

1. Push this repository to GitHub
2. Go to Settings → Pages
3. Select "Deploy from a branch" → `main` → `/ (root)`
4. Your site will be live at `https://yourusername.github.io/repo-name`

### Step 3: Connect Your Sheet

1. Open your deployed dashboard
2. Click **Connect Google Sheet**
3. Paste your Web app URL
4. Click **Connect**

## ✨ Features

- 🔒 **Private data** - Spreadsheet never published publicly
- 📊 Auto-generated statistics
- 🔍 Real-time search filtering
- 📱 Fully responsive design
- 🌙 Beautiful dark theme
- ⚡ Fast & lightweight (no dependencies)

## 📁 Project Structure

```
├── index.html              # Main HTML file
├── apps-script-code.js     # Copy this to Apps Script
├── css/
│   └── style.css           # Styles
├── js/
│   ├── config.js           # Configuration handler
│   ├── sheets.js           # Data fetcher
│   └── app.js              # Main application logic
└── README.md
```

## 🛠️ Local Development

Open `index.html` in your browser, or use a local server:

```bash
# Python 3
python -m http.server 8000

# Node.js
npx serve
```

## 📋 Spreadsheet Requirements

- First row should contain column headers
- Data should start from row 2

## License

MIT
