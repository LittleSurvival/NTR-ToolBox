// ==UserScript==
// @name         NTR ToolBox
// @namespace    http://tampermonkey.net/
// @version      v0.2.2-20250223
// @author       TheNano(百合仙人)
// @description  ToolBox for Novel Translate bot website
// @match        https://books.fishhawk.top/*
// @match        https://books1.fishhawk.top/*
// @grant        none
// @icon         https://raw.githubusercontent.com/LittleSurvival/NTRTools/refs/heads/main/icon.jpg
// @license      All Rights Reserved
// 
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
    .ntr-module-header.active {
        background: #63E2B7 !important;
        color: #fff !important;
    }
    `;
    document.head.appendChild(style);

    function newBooleanSetting(nameDefault, boolDefault) {
        return { name: nameDefault, type: 'boolean', value: Boolean(boolDefault) };
    }
    function newNumberSetting(nameDefault, numDefault) {
        return { name: nameDefault, type: 'number', value: Number(numDefault || 0) };
    }
    function newStringSetting(nameDefault, strDefault) {
        return { name: nameDefault, type: 'string', value: String(strDefault == null ? '' : strDefault) };
    }
    function newSelectSetting(nameDefault, arrOptions, valDefault) {
        return { name: nameDefault, type: 'select', value: valDefault, options: arrOptions };
    }
    function getModuleSetting(moduleObj, key) {
        if (!moduleObj.settings) return;
        const found = moduleObj.settings.find(x => x.name === key);
        return found ? found.value : undefined;
    }

    const CONFIG_VERSION = 7;
    const CONFIG_STORAGE_KEY = 'NTR_ToolBox_Config';
    const domainAllowed = ['books.fishhawk.top', 'books1.fishhawk.top'].includes(location.hostname);

    const moduleAddSakuraTranslator = {
        name: '添加Sakura翻譯器',
        type: 'onclick',
        whitelist: '/workspace/sakura',
        settings: [
            newNumberSetting('數量', 5),
            newNumberSetting('延遲', 5),
            newStringSetting('名稱', 'NTR translator '),
            newStringSetting('鏈接', 'https://127.0.0.1:8080'),
            newStringSetting('bind', 'none'),
        ],
        run: async function (configObj) {
            const totalCount = getModuleSetting(configObj, '數量') || 1;
            const namePrefix = getModuleSetting(configObj, '名稱') || '';
            const linkValue = getModuleSetting(configObj, '鏈接') || '';
            const delayValue = getModuleSetting(configObj, '延遲') || 5;
            const delay = ms => new Promise(r => setTimeout(r, ms));
            let currentIndex = 1;
            async function closeTab() {
                const closeButton = document.querySelector(
                    'button[aria-label="close"].n-base-close,button.n-base-close[aria-label="close"],button.n-base-close.n-base-close--absolute.n-card-header__close'
                );
                if (closeButton) closeButton.click();
            }
            async function openAddTab() {
                const addBtn = [...document.querySelectorAll('button.n-button')]
                    .find(btn => {
                        const txt = (btn.querySelector('.n-button__content') || {}).textContent || '';
                        return txt.trim().indexOf('添加翻译器') !== -1;
                    });
                if (addBtn) addBtn.click();
            }
            async function fillForm() {
                const nameInput = document.querySelector('input.n-input__input-el[placeholder="给你的翻译器起个名字"]');
                const linkInput = document.querySelector('input.n-input__input-el[placeholder="翻译器的链接"]');
                const segInput = document.querySelectorAll('input.n-input__input-el[placeholder="请输入"]')[0];
                const preInput = document.querySelectorAll('input.n-input__input-el[placeholder="请输入"]')[1];
                const addBtn = [...document.querySelectorAll('button.n-button.n-button--primary-type')]
                    .find(btn => {
                        const txt = (btn.querySelector('.n-button__content') || {}).textContent || '';
                        return txt.trim().indexOf('添加') !== -1;
                    });
                if (nameInput && linkInput && segInput && preInput && addBtn) {
                    nameInput.value = namePrefix + currentIndex;
                    nameInput.dispatchEvent(new Event('input', { bubbles: true }));
                    linkInput.value = linkValue;
                    linkInput.dispatchEvent(new Event('input', { bubbles: true }));
                    segInput.dispatchEvent(new InputEvent('input', { data: '500' }));
                    preInput.dispatchEvent(new InputEvent('input', { data: '500' }));
                    addBtn.click();
                    currentIndex++;
                    if (currentIndex <= totalCount) {
                        await delay(delayValue);
                        await fillForm();
                    }
                }
            }
            await openAddTab();
            await delay(300);
            await fillForm();
            await delay(100);
            await closeTab();
        }
    };

    const moduleAddGPTTranslator = {
        name: '添加GPT翻譯器',
        type: 'onclick',
        whitelist: '/workspace/gpt',
        settings: [
            newNumberSetting('數量', 5),
            newNumberSetting('延遲', 5),
            newStringSetting('名稱', 'NTR translator '),
            newStringSetting('模型', 'deepseek-chat'),
            newStringSetting('鏈接', 'https://api.deepseek.com'),
            newStringSetting('Key', 'sk-wait-for-input'),
            newStringSetting('bind', 'none'),
        ],
        run: async function (configObj) {
            const countVal = getModuleSetting(configObj, '數量') || 1;
            const namePrefixVal = getModuleSetting(configObj, '名稱') || '';
            const modelVal = getModuleSetting(configObj, '模型') || '';
            const apiKeyVal = getModuleSetting(configObj, 'Key') || '';
            const apiUrlVal = getModuleSetting(configObj, '鏈接') || '';
            const delayValue = getModuleSetting(configObj, '延遲') || 5;
            const delay = ms => new Promise(r => setTimeout(r, ms));
            let currentIndex = 1;
            async function closeTab() {
                const cBtn = document.querySelector(
                    'button[aria-label="close"].n-base-close,button.n-base-close[aria-label="close"],button.n-base-close.n-base-close--absolute.n-card-header__close'
                );
                if (cBtn) cBtn.click();
            }
            async function openAddTab() {
                const addBtn = [...document.querySelectorAll('button.n-button')]
                    .find(btn => {
                        const txt = (btn.querySelector('.n-button__content') || {}).textContent || '';
                        return txt.trim().indexOf('添加翻译器') !== -1;
                    });
                if (addBtn) addBtn.click();
            }
            async function fillForm() {
                const nameInput = document.querySelector('input.n-input__input-el[placeholder="给你的翻译器起个名字"]');
                const modelInput = document.querySelector('input.n-input__input-el[placeholder="模型名称"]');
                const urlInput = document.querySelector('input.n-input__input-el[placeholder="兼容OpenAI的API链接，默认使用deepseek"]');
                const keyInput = document.querySelector('input.n-input__input-el[placeholder="请输入Api key"]');
                const confirmBtn = [...document.querySelectorAll('button.n-button.n-button--primary-type')]
                    .find(btn => {
                        const txt = (btn.querySelector('.n-button__content') || {}).textContent || '';
                        return txt.trim().indexOf('添加') !== -1;
                    });
                if (nameInput && modelInput && urlInput && keyInput && confirmBtn) {
                    nameInput.value = namePrefixVal + currentIndex;
                    nameInput.dispatchEvent(new Event('input', { bubbles: true }));
                    modelInput.value = modelVal;
                    modelInput.dispatchEvent(new Event('input', { bubbles: true }));
                    urlInput.value = apiUrlVal;
                    urlInput.dispatchEvent(new Event('input', { bubbles: true }));
                    keyInput.value = apiKeyVal;
                    keyInput.dispatchEvent(new Event('input', { bubbles: true }));
                    confirmBtn.click();
                    currentIndex++;
                    if (currentIndex <= countVal) {
                        await delay(delayValue);
                        await fillForm();
                    }
                }
            }
            await openAddTab();
            await delay(300);
            await fillForm();
            await delay(100);
            await closeTab();
        }
    };

    const moduleDeleteTranslator = {
        name: '刪除翻譯器',
        type: 'onclick',
        whitelist: '/workspace',
        settings: [
            newStringSetting('排除', '共享,本机,AutoDL'),
            newStringSetting('bind', 'none'),
        ],
        run: async function (configObj) {
            const excludeStr = getModuleSetting(configObj, '排除') || '';
            const excludeArr = excludeStr.split(',').filter(x => x);
            const listItems = document.querySelectorAll('.n-list-item');
            [...listItems].forEach(li => {
                const titleEl = li.querySelector('.n-thing-header__title');
                if (!titleEl) return;
                const titleText = titleEl.textContent.trim();
                const keep = excludeArr.some(x => titleText.indexOf(x) !== -1);
                if (!keep) {
                    const delBtn = li.querySelector('.n-button--error-type');
                    const parentEl = delBtn?.parentElement;
                    if (parentEl) {
                        const siblingBtns = parentEl.querySelectorAll('button');
                        if (siblingBtns.length === 5 && delBtn) delBtn.click();
                    }
                }
            });
        }
    };

    const moduleLaunchTranslator = {
        name: '啟動翻譯器',
        type: 'onclick',
        whitelist: '/workspace',
        settings: [
            newNumberSetting('延遲間隔', 50),
            newStringSetting('bind', 'none'),
        ],
        run: async function (configObj) {
            const intervalVal = getModuleSetting(configObj, '延遲間隔') || 50;
            const allBtns = document.querySelectorAll('button');
            const delay = ms => new Promise(r => setTimeout(r, ms));
            let idx = 0;
            async function nextClick() {
                while (idx < allBtns.length) {
                    const btn = allBtns[idx];
                    idx++;
                    if (btn.textContent.indexOf('启动') !== -1 || btn.textContent.indexOf('啟動') !== -1) {
                        btn.click();
                        await delay(intervalVal);
                    }
                }
            }
            await nextClick();
        }
    };

    const moduleQueueSakura = {
        name: '排隊Sakura',
        type: 'onclick',
        whitelist: '/wenku',
        settings: [
            newSelectSetting('模式', ['常規', '過期', '重翻'], '常規'),
            newStringSetting('bind', 'none'),
        ],
        run: async function (configObj) {
            const mode = getModuleSetting(configObj, '模式');
            const delay = ms => new Promise(r => setTimeout(r, ms));
            const modeMap = {
                '常規': '常规',
                '過期': '过期',
                '重翻': '重翻'
            };
            const cnMode = modeMap[mode];
            const tags = document.querySelectorAll('.n-tag__content');
            for (const tag of tags) {
                if (tag.textContent === cnMode) {
                    tag.click();
                    break;
                }
            }
            const allButtons = document.querySelectorAll('button');
            for (const btn of allButtons) {
                if (btn.textContent.includes('排队Sakura')) {
                    btn.click();
                    await delay(10);
                }
            }
        }
    };

    const moduleQueueGPT = {
        name: '排隊GPT',
        type: 'onclick',
        whitelist: '/wenku',
        settings: [
            newSelectSetting('模式', ['常規', '過期', '重翻'], '常規'),
            newStringSetting('bind', 'none'),
        ],
        run: async function (configObj) {
            const mode = getModuleSetting(configObj, '模式');
            const delay = ms => new Promise(r => setTimeout(r, ms));
            const modeMap = {
                '常規': '常规',
                '過期': '过期',
                '重翻': '重翻'
            };
            const cnMode = modeMap[mode];
            const tags = document.querySelectorAll('.n-tag__content');
            for (const tag of tags) {
                if (tag.textContent === cnMode) {
                    tag.click();
                    break;
                }
            }
            const allButtons = document.querySelectorAll('button');
            for (const btn of allButtons) {
                if (btn.textContent.includes('排队GPT')) {
                    btn.click();
                    await delay(10);
                }
            }
        }
    };

    const moduleKeepExample = {
        name: '自動重試',
        type: 'keep',
        whitelist: '/workspace/*',
        settings: [
            newNumberSetting('最大重試次數', 3),
            newStringSetting('bind', 'none'),
        ],
        _keepIntervalId: null,
        _keepActive: false,
        _attempts: 0,
        run: function (configObj) {
            if (!this._keepActive) {
                this._keepActive = true;
                const maxAttempts = getModuleSetting(configObj, '最大重試次數');
                document.addEventListener('click', (e) => {
                    if (e.target.tagName === 'BUTTON') {
                        this._attempts = 0;
                    }
                });

                this._keepIntervalId = setInterval(() => {
                    const listItems = document.querySelectorAll('.n-list-item');
                    const unfinishedItems = Array.from(listItems).filter(item => {
                        const descriptionText = item.querySelector('.n-thing-main__description');
                        return descriptionText && descriptionText.textContent.includes('未完成');
                    });

                    if (unfinishedItems.length > 0 && this._attempts < maxAttempts) {
                        const hasStopButton = Array.from(document.querySelectorAll('button')).some(btn => 
                            btn.textContent === '停止'
                        );

                        if (!hasStopButton) {
                            const retryButtons = Array.from(document.querySelectorAll('button')).filter(btn => 
                                btn.textContent.includes('重试未完成任务')
                            );
                            const clickCount = Math.min(unfinishedItems.length, listItems.length);
                            if (retryButtons[0]) {
                                for (let i = 0; i < clickCount; i++) {
                                    retryButtons[0].click();
                                }
                                this._attempts++;
                            }
                        }
                    }
                }, 1000);
            } else {
                this._keepActive = false;
                if (this._keepIntervalId) {
                    clearInterval(this._keepIntervalId);
                    this._keepIntervalId = null;
                }
            }
        }
    };

    const defaultModules = [
        moduleAddSakuraTranslator,
        moduleAddGPTTranslator,
        moduleDeleteTranslator,
        moduleLaunchTranslator,
        moduleQueueSakura,
        moduleQueueGPT,
        moduleKeepExample
    ];

    function loadConfiguration() {
        let tempStorage;
        try {
            tempStorage = JSON.parse(localStorage.getItem(CONFIG_STORAGE_KEY));
        } catch (e) { }
        if (!tempStorage || tempStorage.version !== CONFIG_VERSION) {
            return { version: CONFIG_VERSION, modules: JSON.parse(JSON.stringify(defaultModules)) };
        }
        return tempStorage;
    }
    function saveConfiguration(obj) {
        localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(obj));
    }

    let configuration = loadConfiguration();
    if (configuration.modules.length !== defaultModules.length) {
        configuration = { version: CONFIG_VERSION, modules: JSON.parse(JSON.stringify(defaultModules)) };
        saveConfiguration(configuration);
    } else {
        const defaultModuleNames = defaultModules.map(x => x.name).sort().join(',');
        const storedModuleNames = configuration.modules.map(x => x.name).sort().join(',');
        if (defaultModuleNames !== storedModuleNames) {
            configuration = { version: CONFIG_VERSION, modules: JSON.parse(JSON.stringify(defaultModules)) };
            saveConfiguration(configuration);
        }
    }
    configuration.modules.forEach(moduleObj => {
        const foundDefaultModule = defaultModules.find(x => x.name === moduleObj.name);
        if (foundDefaultModule && typeof foundDefaultModule.run === 'function') {
            for (const prop in foundDefaultModule) {
                if (!moduleObj.hasOwnProperty(prop)) {
                    moduleObj[prop] = foundDefaultModule[prop];
                }
            }
            moduleObj.run = foundDefaultModule.run;
        }
    });

    const keepIntervals = new Map();
    const keepActiveSet = new Set();
    function startKeepModule(modItem, modHeader) {
        if (keepIntervals.has(modItem.name)) return;
        modHeader.classList.add('active');
        keepActiveSet.add(modItem.name);
        const intervalId = setInterval(() => {
            if (typeof modItem.run === 'function') {
                modItem.run(modItem);
                console.log('[Keep Module] ' + modItem.name + ' is running...');
            }
        }, 2000);
        keepIntervals.set(modItem.name, intervalId);
    }
    function stopKeepModule(modItem, modHeader) {
        const intervalId = keepIntervals.get(modItem.name);
        if (intervalId) {
            clearInterval(intervalId);
            keepIntervals.delete(modItem.name);
        }
        modHeader.classList.remove('active');
        keepActiveSet.delete(modItem.name);
    }

    document.addEventListener('keydown', keyEvent => {
        if (keyEvent.ctrlKey || keyEvent.altKey || keyEvent.metaKey) return;
        const pressedKey = keyEvent.key.toLowerCase();
        for (const modItem of configuration.modules) {
            const bindVal = getModuleSetting(modItem, 'bind');
            if (!bindVal || bindVal === 'none') continue;
            if (bindVal.toLowerCase() === pressedKey) {
                if (!isModuleEnabledByWhitelist(modItem)) continue;
                keyEvent.preventDefault();
                handleModuleClick(modItem, null);
            }
        }
    });

    const panel = document.createElement('div');
    panel.id = 'ntr-panel';
    const savedPosition = localStorage.getItem('ntr-panel-position');
    if (savedPosition) {
        try {
            const parsedPosition = JSON.parse(savedPosition);
            if (parsedPosition.left && parsedPosition.top) {
                panel.style.left = parsedPosition.left;
                panel.style.top = parsedPosition.top;
            }
        } catch (e) { }
    }
    let dragging = false, dragOffsetX = 0, dragOffsetY = 0;
    function mouseDownHandler(e) {
        dragging = true;
        dragOffsetX = e.clientX - panel.offsetLeft;
        dragOffsetY = e.clientY - panel.offsetTop;
        e.preventDefault();
    }
    function mouseMoveHandler(e) {
        if (!dragging) return;
        panel.style.left = (e.clientX - dragOffsetX) + 'px';
        panel.style.top = (e.clientY - dragOffsetY) + 'px';
    }
    function mouseUpHandler() {
        dragging = false;
        localStorage.setItem('ntr-panel-position', JSON.stringify({
            left: panel.style.left,
            top: panel.style.top
        }));
    }
    document.addEventListener('mousemove', mouseMoveHandler);
    document.addEventListener('mouseup', mouseUpHandler);

    const titleBar = document.createElement('div');
    titleBar.className = 'ntr-titlebar';
    titleBar.textContent = 'NTR ToolBox';
    titleBar.addEventListener('mousedown', mouseDownHandler);
    panel.appendChild(titleBar);

    const panelBody = document.createElement('div');
    panelBody.className = 'ntr-panel-body';
    panel.appendChild(panelBody);

    function isModuleEnabledByWhitelist(modItem) {
        if (!modItem.whitelist || modItem.whitelist.trim() === '') return domainAllowed;
        const parts = modItem.whitelist.split(',').map(s => s.trim()).filter(Boolean);
        return domainAllowed && parts.some(p => {
            if (p.endsWith('/*')) {
                const basePath = p.slice(0, -2);
                return location.pathname.startsWith(basePath + '/');
            }
            return location.pathname.includes(p);
        });
    }
    function handleModuleClick(modItem, modHeader) {
        if (!domainAllowed || !isModuleEnabledByWhitelist(modItem)) return;
        if (modItem.type === 'onclick') {
            if (typeof modItem.run === 'function') {
                modItem.run(modItem);
            }
        } else if (modItem.type === 'keep') {
            const isActive = keepActiveSet.has(modItem.name);
            if (isActive) {
                if (modHeader) stopKeepModule(modItem, modHeader);
            } else {
                if (modHeader) startKeepModule(modItem, modHeader);
            }
        }
    }

    const headerMap = new Map();
    configuration.modules.forEach(modItem => {

        const moduleContainer = document.createElement('div');
        moduleContainer.className = 'ntr-module-container';
        const moduleHeader = document.createElement('div');
        moduleHeader.className = 'ntr-module-header';
        const nameSpan = document.createElement('span');
        nameSpan.textContent = modItem.name;
        moduleHeader.appendChild(nameSpan);
        const iconSpan = document.createElement('span');
        iconSpan.textContent = modItem.type === 'keep' ? '⇋' : '▶';
        iconSpan.style.marginLeft = '8px';
        moduleHeader.appendChild(iconSpan);
        const settingsContainer = document.createElement('div');
        settingsContainer.className = 'ntr-settings-container';
        settingsContainer.style.display = 'none';
        moduleHeader.oncontextmenu = function (e) {
            e.preventDefault();
            const currentDisplay = settingsContainer.style.display || window.getComputedStyle(settingsContainer).display;
            settingsContainer.style.display = currentDisplay === 'none' ? 'block' : 'none';
        };
        moduleHeader.onclick = function (e) {
            if (e.button === 0 && !e.ctrlKey && !e.altKey && !e.shiftKey) {
                if (e.target.classList.contains('ntr-bind-button')) return;
                handleModuleClick(modItem, moduleHeader);
            }
        };
        if (modItem.type === 'keep' && keepActiveSet.has(modItem.name)) {
            moduleHeader.classList.add('active');
        }
        if (Array.isArray(modItem.settings)) {
            modItem.settings.forEach(setObj => {
                const row = document.createElement('div');
                row.style.marginBottom = '8px';
                const label = document.createElement('label');
                label.style.display = 'inline-block';
                label.style.minWidth = '70px';
                label.style.color = '#ccc';
                label.textContent = setObj.name + ': ';
                row.appendChild(label);
                let inputElement;
                if (setObj.type === 'boolean') {
                    inputElement = document.createElement('input');
                    inputElement.type = 'checkbox';
                    inputElement.checked = Boolean(setObj.value);
                    inputElement.onchange = function () {
                        setObj.value = inputElement.checked;
                        saveConfiguration(configuration);
                    };
                } else if (setObj.type === 'number') {
                    inputElement = document.createElement('input');
                    inputElement.type = 'number';
                    inputElement.value = setObj.value;
                    inputElement.className = 'ntr-number-input';
                    inputElement.onchange = function () {
                        setObj.value = Number(inputElement.value) || 0;
                        saveConfiguration(configuration);
                    };
                } else if (setObj.type === 'string' && setObj.name === 'bind') {
                    inputElement = document.createElement('button');
                    inputElement.className = 'ntr-bind-button';
                    inputElement.textContent = setObj.value === 'none' ? '(None)' : '[' + setObj.value.toUpperCase() + ']';
                    inputElement.onclick = function () {
                        inputElement.textContent = '(Press any key)';
                        function handleKey(keyEvent) {
                            keyEvent.preventDefault();
                            if (keyEvent.key === 'Escape') {
                                setObj.value = 'none';
                                inputElement.textContent = '(None)';
                                saveConfiguration(configuration);
                                document.removeEventListener('keydown', handleKey, true);
                                keyEvent.stopPropagation();
                                return;
                            }
                            const pressedKey = keyEvent.key.toLowerCase();
                            setObj.value = pressedKey;
                            inputElement.textContent = '[' + pressedKey.toUpperCase() + ']';
                            saveConfiguration(configuration);
                            document.removeEventListener('keydown', handleKey, true);
                            keyEvent.stopPropagation();
                        }
                        document.addEventListener('keydown', handleKey, true);
                    };
                } else if (setObj.type === 'select' && Array.isArray(setObj.options)) {
                    inputElement = document.createElement('select');
                    setObj.options.forEach(opt => {
                        const optionEl = document.createElement('option');
                        optionEl.value = opt;
                        optionEl.textContent = opt;
                        if (opt === setObj.value) {
                            optionEl.selected = true;
                        }
                        inputElement.appendChild(optionEl);
                    });
                    inputElement.onchange = function () {
                        setObj.value = inputElement.value;
                        saveConfiguration(configuration);
                    };
                } else if (setObj.type === 'string') {
                    inputElement = document.createElement('input');
                    inputElement.type = 'text';
                    inputElement.value = setObj.value;
                    inputElement.className = 'ntr-input';
                    inputElement.onchange = function () {
                        setObj.value = inputElement.value;
                        saveConfiguration(configuration);
                    };
                } else {
                    inputElement = document.createElement('span');
                    inputElement.style.color = '#999';
                    inputElement.textContent = String(setObj.value);
                }
                row.appendChild(inputElement);
                settingsContainer.appendChild(row);
            });
        }
        moduleContainer.appendChild(moduleHeader);
        moduleContainer.appendChild(settingsContainer);
        panelBody.appendChild(moduleContainer);
        headerMap.set(modItem, moduleHeader);
    });

    const infoText = document.createElement('div');
    infoText.className = 'ntr-info';
    infoText.textContent = '左鍵執行/切換 | 右鍵設定';
    panel.appendChild(infoText);
    document.body.appendChild(panel);

    setInterval(() => {
        configuration.modules.forEach(m => {
            const moduleHeader = headerMap.get(m);
            if (!moduleHeader) return;
            const moduleContainer = moduleHeader.parentElement;
            const allow = domainAllowed && isModuleEnabledByWhitelist(m);
            if (!allow) {
                moduleContainer.style.display = 'none';
                if (m.type === 'keep' && keepActiveSet.has(m.name)) stopKeepModule(m, moduleHeader);
            } else {
                moduleContainer.style.display = 'block';
            }
        });
    }, 1000);
})();