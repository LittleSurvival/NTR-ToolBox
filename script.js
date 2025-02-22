// ==UserScript==
// @name         NTR ToolBox
// @namespace    http://tampermonkey.net/
// @version      v0.1-20250222
// @author       TheNano(百合仙人)
// @description  ToolBox for Novel Translate bot website
// @match        https://books.fishhawk.top/*
// @match        https://books1.fishhawk.top/*
// @grant        none
// @icon         https://raw.githubusercontent.com/LittleSurvival/NTRTools/refs/heads/main/icon.jpg
// ==/UserScript==

(async function () {
    'use strict';

    const style = document.createElement('style');
    style.textContent = `
    #ntr-panel {
        position: fixed;
        left: 20px;
        top: 70px;
        z-index: 9999;
        background: #1E1E1E;
        color: #BBB;
        padding: 8px;
        border-radius: 8px;
        font-family: Arial, sans-serif;
        width: 320px;
        box-shadow: 2px 2px 12px rgba(0,0,0,0.5);
        border: 1px solid #333;
    }
    .ntr-titlebar {
        font-weight: bold;
        padding: 10px;
        cursor: move;
        background: #292929;
        border-radius: 6px;
        color: #CCC;
    }
    .ntr-panel-body {
        padding: 6px;
        background: #232323;
        border-radius: 4px;
    }
    .ntr-module-container {
        margin-bottom: 12px;
        border: 1px solid #444;
        border-radius: 4px;
    }
    .ntr-module-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        background: #2E2E2E;
        padding: 6px 8px;
        border-radius: 3px 3px 0 0;
        border-bottom: 1px solid #333;
        cursor: pointer;
        transition: background 0.3s;
    }
    .ntr-module-header:hover {
        background: #3a3a3a;
    }
    .ntr-settings-container {
        padding: 6px;
        background: #1C1C1C;
        display: none;
    }
    .ntr-input {
        width: 120px;
        padding: 4px;
        border: 1px solid #555;
        border-radius: 4px;
        background: #2A2A2A;
        color: #FFF;
    }
    .ntr-number-input {
        width: 60px;
        padding: 4px;
        border: 1px solid #555;
        border-radius: 4px;
        background: #2A2A2A;
        color: #FFF;
    }
    .ntr-bind-button {
        padding: 4px 8px;
        border: 1px solid #555;
        border-radius: 4px;
        background: #2A2A2A;
        color: #FFF;
        cursor: pointer;
    }
    .ntr-info {
        text-align: center;
        font-size: 10px;
        color: #888;
        margin-top: 8px;
    }
    `;
    document.head.appendChild(style);

    function newBooleanSetting(settingName, defaultValue) {
        return { name: settingName, type: 'boolean', value: Boolean(defaultValue) };
    }
    function newNumberSetting(settingName, defaultValue) {
        return { name: settingName, type: 'number', value: Number(defaultValue || 0) };
    }
    function newStringSetting(settingName, defaultValue) {
        return { name: settingName, type: 'string', value: String(defaultValue == null ? '' : defaultValue) };
    }
    function getModuleSetting(moduleConfig, key) {
        if (!moduleConfig.settings) return undefined;
        const setting = moduleConfig.settings.find(s => s.name === key);
        return setting ? setting.value : undefined;
    }

    const CONFIG_VERSION = 3;
    const CONFIG_STORAGE_KEY = 'NTR_ToolBox_Config';
    const domainAllowed = ['books.fishhawk.top', 'books1.fishhawk.top'].includes(location.hostname);

    // Module: 添加翻譯器
    const moduleAddTranslator = {
        name: '添加翻譯器',
        settings: [
            newNumberSetting('數量', 5),
            newStringSetting('名稱', 'NTR translator '),
            newStringSetting('鏈接', 'https://127.0.0.1:8080'),
            newStringSetting('bind', 'none')
        ],
        run: async function (moduleConfig) {
            const totalTranslators = getModuleSetting(moduleConfig, '數量') || 1;
            const namePrefix = getModuleSetting(moduleConfig, '名稱') || '';
            const translatorLink = getModuleSetting(moduleConfig, '鏈接') || '';
            const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
            let currentIndex = 1;
            async function closeTranslatorTab() {
                const closeButton = document.querySelector(
                    'button[aria-label="close"].n-base-close,button.n-base-close[aria-label="close"],button.n-base-close.n-base-close--absolute.n-card-header__close'
                );
                if (closeButton) closeButton.click();
            }
            async function openAddTranslatorTab() {
                const button = Array.prototype.slice
                    .call(document.querySelectorAll('button.n-button'))
                    .find(btn => {
                        const text = (btn.querySelector('.n-button__content') || {}).textContent || '';
                        return text.trim().indexOf('添加翻译器') !== -1;
                    });
                if (button) button.click();
            }
            async function fillForm() {
                const nameInput = document.querySelector('input.n-input__input-el[placeholder="给你的翻译器起个名字"]');
                const linkInput = document.querySelector('input.n-input__input-el[placeholder="翻译器的链接"]');
                const segmentInput = document.querySelectorAll('input.n-input__input-el[placeholder="请输入"]')[0];
                const prefixInput = document.querySelectorAll('input.n-input__input-el[placeholder="请输入"]')[1];
                const addButton = Array.prototype.slice
                    .call(document.querySelectorAll('button.n-button.n-button--primary-type'))
                    .find(btn => {
                        const text = (btn.querySelector('.n-button__content') || {}).textContent || '';
                        return text.trim().indexOf('添加') !== -1;
                    });
                if (nameInput && linkInput && segmentInput && prefixInput && addButton) {
                    nameInput.value = namePrefix + currentIndex;
                    nameInput.dispatchEvent(new Event('input', { bubbles: true }));
                    linkInput.value = translatorLink;
                    linkInput.dispatchEvent(new Event('input', { bubbles: true }));
                    segmentInput.dispatchEvent(new InputEvent('input', { data: '500' }));
                    prefixInput.dispatchEvent(new InputEvent('input', { data: '500' }));
                    addButton.click();
                    currentIndex++;
                    if (currentIndex <= totalTranslators) {
                        await delay(200);
                        await openAddTranslatorTab();
                        await delay(100);
                        await fillForm();
                    }
                }
            }
            await openAddTranslatorTab();
            await delay(100);
            await fillForm();
            await delay(100);
            await closeTranslatorTab();
        }
    };

    // Module: 刪除翻譯器
    const moduleDeleteTranslator = {
        name: '刪除翻譯器',
        settings: [
            newStringSetting('排除', '共享,本机,AutoDL'),
            newStringSetting('bind', 'none')
        ],
        run: async function (moduleConfig) {
            const excludeString = getModuleSetting(moduleConfig, 'exclude') || '';
            const excludeList = excludeString.split(',').filter(item => item);
            const moduleItems = document.querySelectorAll('.n-list-item');
            Array.prototype.forEach.call(moduleItems, item => {
                const titleElement = item.querySelector('.n-thing-header__title');
                if (!titleElement) return;
                const titleText = titleElement.textContent.trim();
                const shouldKeep = excludeList.some(exclude => titleText.indexOf(exclude) !== -1);
                if (!shouldKeep) {
                    const deleteButton = item.querySelector('.n-button--error-type');
                    if (deleteButton) deleteButton.click();
                }
            });
        }
    };

    // Module: 啟動翻譯器
    const moduleLaunchTranslator = {
        name: '啟動翻譯器',
        settings: [
            newNumberSetting('延遲間隔', 50),
            newStringSetting('bind', 'none')
        ],
        run: async function (moduleConfig) {
            const delayInterval = getModuleSetting(moduleConfig, '延遲間隔') || 50;
            const allButtons = document.querySelectorAll('button');
            const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
            let buttonIndex = 0;
            async function clickNextButton() {
                while (buttonIndex < allButtons.length) {
                    const button = allButtons[buttonIndex];
                    buttonIndex++;
                    if (button.textContent.indexOf('启动') !== -1 || button.textContent.indexOf('啟動') !== -1) {
                        button.click();
                        await delay(delayInterval);
                    }
                }
            }
            await clickNextButton();
        }
    };

    const defaultModules = [
        moduleAddTranslator,
        moduleDeleteTranslator,
        moduleLaunchTranslator
    ];

    function loadConfiguration() {
        let storedConfig;
        try {
            storedConfig = JSON.parse(localStorage.getItem(CONFIG_STORAGE_KEY));
        } catch (e) {}
        if (!storedConfig || storedConfig.version !== CONFIG_VERSION) {
            return { version: CONFIG_VERSION, modules: JSON.parse(JSON.stringify(defaultModules)) };
        }
        return storedConfig;
    }
    function saveConfiguration(configObj) {
        localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(configObj));
    }

    let configuration = loadConfiguration();
    if (configuration.modules.length !== defaultModules.length) {
        configuration = { version: CONFIG_VERSION, modules: JSON.parse(JSON.stringify(defaultModules)) };
        saveConfiguration(configuration);
    } else {
        const defaultNames = defaultModules.map(mod => mod.name).sort().join(',');
        const storedNames = configuration.modules.map(mod => mod.name).sort().join(',');
        if (defaultNames !== storedNames) {
            configuration = { version: CONFIG_VERSION, modules: JSON.parse(JSON.stringify(defaultModules)) };
            saveConfiguration(configuration);
        }
    }

    configuration.modules.forEach(moduleConfig => {
        const defaultModule = defaultModules.find(dm => dm.name === moduleConfig.name);
        if (defaultModule && typeof defaultModule.run === 'function') {
            moduleConfig.run = async ref => { await defaultModule.run(ref); };
        }
    });

    const activeModules = configuration.modules;
    document.addEventListener('keydown', event => {
        if (event.ctrlKey || event.altKey || event.metaKey) return;
        const pressedKey = event.key.toLowerCase();
        for (let i = 0; i < activeModules.length; i++) {
            const moduleItem = activeModules[i];
            const keyBinding = getModuleSetting(moduleItem, 'bind');
            if (keyBinding && keyBinding !== 'none' && keyBinding.toLowerCase() === pressedKey) {
                event.preventDefault();
                if (typeof moduleItem.run === 'function') moduleItem.run(moduleItem);
            }
        }
    });

    const panel = document.createElement('div');
    panel.id = 'ntr-panel';

    // New Feature: Restore saved panel position
    const savedPosition = localStorage.getItem('ntr-panel-position');
    if (savedPosition) {
        try {
            const pos = JSON.parse(savedPosition);
            if (pos.left && pos.top) {
                panel.style.left = pos.left;
                panel.style.top = pos.top;
            }
        } catch(e) {}
    }

    let dragging = false, dragOffsetX = 0, dragOffsetY = 0;
    function handleMouseDown(e) {
        dragging = true;
        dragOffsetX = e.clientX - panel.offsetLeft;
        dragOffsetY = e.clientY - panel.offsetTop;
        e.preventDefault();
    }
    function handleMouseMove(e) {
        if (!dragging) return;
        panel.style.left = (e.clientX - dragOffsetX) + 'px';
        panel.style.top = (e.clientY - dragOffsetY) + 'px';
    }
    function handleMouseUp() { dragging = false; }
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    const titleBarDiv = document.createElement('div');
    titleBarDiv.className = 'ntr-titlebar';
    titleBarDiv.textContent = 'NTR ToolBox';
    titleBarDiv.addEventListener('mousedown', handleMouseDown);
    panel.appendChild(titleBarDiv);

    const panelBody = document.createElement('div');
    panelBody.className = 'ntr-panel-body';
    panel.appendChild(panelBody);

    activeModules.forEach(moduleItem => {
        const moduleContainer = document.createElement('div');
        moduleContainer.className = 'ntr-module-container';

        const moduleHeader = document.createElement('div');
        moduleHeader.className = 'ntr-module-header';
        if (!domainAllowed) {
            moduleHeader.style.opacity = '0.6';
            moduleHeader.style.cursor = 'default';
        }
        const nameSpan = document.createElement('span');
        nameSpan.textContent = moduleItem.name;
        moduleHeader.appendChild(nameSpan);

        const launchIcon = document.createElement('span');
        launchIcon.textContent = '▶';
        launchIcon.style.marginLeft = '8px';
        moduleHeader.appendChild(launchIcon);

        const moduleSettingsContainer = document.createElement('div');
        moduleSettingsContainer.className = 'ntr-settings-container';
        moduleSettingsContainer.style.display = 'none';

        moduleHeader.oncontextmenu = function (e) {
            e.preventDefault();
            const currentDisplay = moduleSettingsContainer.style.display || window.getComputedStyle(moduleSettingsContainer).display;
            moduleSettingsContainer.style.display = currentDisplay === 'none' ? 'block' : 'none';
        };
        moduleHeader.onclick = function (e) {
            if (e.button === 0 && !e.ctrlKey && !e.altKey && !e.shiftKey && domainAllowed) {
                if (e.target.classList.contains('ntr-bind-button')) return;
                if (typeof moduleItem.run === 'function') moduleItem.run(moduleItem);
            }
        };

        if (Array.isArray(moduleItem.settings)) {
            moduleItem.settings.forEach(setting => {
                const settingRow = document.createElement('div');
                settingRow.style.marginBottom = '8px';

                const label = document.createElement('label');
                label.style.display = 'inline-block';
                label.style.minWidth = '70px';
                label.style.color = '#ccc';
                label.textContent = setting.name + ': ';
                settingRow.appendChild(label);

                let inputElement;
                if (setting.type === 'boolean') {
                    inputElement = document.createElement('input');
                    inputElement.type = 'checkbox';
                    inputElement.checked = Boolean(setting.value);
                    inputElement.onchange = function () {
                        setting.value = inputElement.checked;
                        saveConfiguration(configuration);
                    };
                } else if (setting.type === 'number') {
                    inputElement = document.createElement('input');
                    inputElement.type = 'number';
                    inputElement.value = setting.value;
                    inputElement.className = 'ntr-number-input';
                    inputElement.onchange = function () {
                        setting.value = Number(inputElement.value) || 0;
                        saveConfiguration(configuration);
                    };
                } else if (setting.type === 'string' && setting.name === 'bind') {
                    inputElement = document.createElement('button');
                    inputElement.className = 'ntr-bind-button';
                    inputElement.textContent = (setting.value === 'none') ? '(None)' : '[' + setting.value.toUpperCase() + ']';
                    inputElement.onclick = function () {
                        inputElement.textContent = '(Press any key)';
                        function handleKey(ev) {
                            ev.preventDefault();
                            if (ev.key === 'Escape') {
                                setting.value = 'none';
                                inputElement.textContent = '(None)';
                                saveConfiguration(configuration);
                                document.removeEventListener('keydown', handleKey, true);
                                ev.stopPropagation();
                                return;
                            }
                            const keyChar = ev.key.toLowerCase();
                            setting.value = keyChar;
                            inputElement.textContent = '[' + keyChar.toUpperCase() + ']';
                            saveConfiguration(configuration);
                            document.removeEventListener('keydown', handleKey, true);
                            ev.stopPropagation();
                        }
                        document.addEventListener('keydown', handleKey, true);
                    };
                } else if (setting.type === 'string') {
                    inputElement = document.createElement('input');
                    inputElement.type = 'text';
                    inputElement.value = setting.value;
                    inputElement.className = 'ntr-input';
                    inputElement.onchange = function () {
                        setting.value = inputElement.value;
                        saveConfiguration(configuration);
                    };
                } else {
                    inputElement = document.createElement('span');
                    inputElement.style.color = '#999';
                    inputElement.textContent = String(setting.value);
                }
                settingRow.appendChild(inputElement);
                moduleSettingsContainer.appendChild(settingRow);
            });
        }
        moduleContainer.appendChild(moduleHeader);
        moduleContainer.appendChild(moduleSettingsContainer);
        panelBody.appendChild(moduleContainer);
    });

    const infoText = document.createElement('div');
    infoText.className = 'ntr-info';
    infoText.textContent = '左鍵執行 | 右鍵設定';
    panel.appendChild(infoText);

    document.body.appendChild(panel);

    document.addEventListener('mouseup', function() {
        localStorage.setItem('ntr-panel-position', JSON.stringify({
            left: panel.style.left,
            top: panel.style.top
        }));
    });
})();
