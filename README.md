# NTR ToolBox Userscript

**Version:** v0.3.1-20250223  
**Author:** TheNano (百合仙人)

---

## Overview

NTR ToolBox is a Tampermonkey userscript designed to enhance the Novel Translate Bot website by providing a collection of modules that help manage translation tools and optimize performance. The script adapts its user interface for both desktop and mobile devices.

---

## Installation

You can easily install the script from its Greasy Fork page:

[https://greasyfork.org/scripts/527754-ntr-toolbox](https://greasyfork.org/scripts/527754-ntr-toolbox)

Once installed, the script will automatically run on the supported websites (books.fishhawk.top and books1.fishhawk.top).

---

## User Interface

- **Draggable Panel:**  
  The toolbox panel is movable, allowing you to position it anywhere on the screen.

- **Adaptive Interactions:**  
  - **Desktop:**  
    • **Left-click** on a module header to execute the module.  
    • **Right-click** on a module header to open or close its settings.
  - **Mobile:**  
    • **Single tap** to run a module.  
    • **Double tap** to toggle its settings.

- **Info Bar:**  
  At the bottom of the panel, the info bar displays the interaction instructions on the left (e.g., “左鍵執行/切換 | 右鍵設定” on desktop or “單擊執行 | 雙擊設定” on mobile) and credits the author on the right.

---

## Modules

### 添加Sakura翻譯器 (Add Sakura Translator)
- **Purpose:** Adds multiple Sakura translator instances.
- **Key Settings:** Quantity, delay, translator name prefix, translator link, and key binding.
- **Behavior:** Automatically fills and submits the translation form for each instance.

### 添加GPT翻譯器 (Add GPT Translator)
- **Purpose:** Adds GPT translator instances.
- **Key Settings:** Quantity, delay, translator name prefix, model name, API link, API key, and key binding.
- **Behavior:** Automates the process of adding and configuring GPT translators.

### 刪除翻譯器 (Delete Translator)
- **Purpose:** Removes translator instances that do not match specified exclusion criteria.
- **Key Settings:** Exclusion keywords (translators containing these keywords are preserved) and key binding.
- **Behavior:** Scans for translator items on the page and clicks the delete button for those that do not meet the criteria.

### 啟動翻譯器 (Launch Translator)
- **Purpose:** Starts the translator tools.
- **Key Settings:** Delay interval between simulated clicks and key binding.
- **Behavior:** Iterates over translator buttons (labeled “启动” or “啟動”) and simulates clicks with a configurable delay.

### 排隊Sakura (Queue Sakura)
- **Purpose:** Queues tasks for Sakura translators (mainly on the Wenku page).
- **Key Settings:** Mode selection (常規, 過期, 重翻), delay intervals, number of parallel tasks, and key binding.
- **Behavior:** Opens new tabs for each task, configures the correct mode, and queues the translation tasks automatically.

### 排隊GPT (Queue GPT)
- **Purpose:** Queues tasks for GPT translators in the Wenku section.
- **Key Settings:** Mode selection (常規, 過期, 重翻), delay intervals, number of parallel tasks, and key binding.
- **Behavior:** Similar to the Sakura queue, it automates task queuing by managing new tabs and triggering appropriate actions.

### 自動重試 (Auto Retry)
- **Purpose:** Automatically retries unfinished translation tasks.
- **Key Settings:** Maximum retry count.
- **Behavior:** Periodically checks for tasks marked as “未完成” and clicks the retry button until the maximum attempts are reached.

### 緩存優化 (Cache Optimization)
- **Purpose:** Optimizes the browser’s caching by synchronizing sessionStorage with localStorage.
- **Key Settings:** Synchronization interval.
- **Behavior:** Uses a proxy to mirror changes between sessionStorage and localStorage, ensuring consistency across the page.

---

## How to Use

1. **Configure Modules:**  
   Open a module’s settings (via right-click on desktop or double tap on mobile) to adjust parameters like delays, names, and links.

2. **Execute Modules:**  
   - **Desktop:** Click a module header with the left mouse button to run it.  
   - **Mobile:** Tap once on a module header to execute the module.

3. **Persistent Settings:**  
   Your configuration settings are saved locally and will persist between sessions.
