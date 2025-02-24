// ==UserScript==
// @name         NTR ToolBox
// @namespace    http://tampermonkey.net/
// @version      v0.3.1-20250223
// @author       
// @description  ToolBox for Novel Translate bot website
// @match        https://books.fishhawk.top/*
// @match        https://books1.fishhawk.top/*
// @grant        GM_openInTab
// @license      All Rights Reserved
// ==/UserScript==

(function () {
    'use strict';

    const CONFIG_VERSION = 12;
    const CONFIG_STORAGE_KEY = 'NTR_ToolBox_Config';
    const IS_MOBIlE = /Mobi|Android/i.test(navigator.userAgent);
    const domainAllowed = (location.hostname === 'books.fishhawk.top' || location.hostname === 'books1.fishhawk.top');

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
    function isModuleEnabledByWhitelist(modItem) {
        if (!modItem.whitelist || !modItem.whitelist.trim()) return domainAllowed;
        const parts = modItem.whitelist.split(/[,;\n]+/).map(s => s.trim()).filter(Boolean);
        return domainAllowed && parts.some(p => {
            if (p.endsWith('/*')) {
                const basePath = p.slice(0, -2);
                return location.pathname.startsWith(basePath + '/');
            }
            return location.pathname.indexOf(p) !== -1;
        });
    }

    const moduleAddSakuraTranslator = {
        name: '添加Sakura翻譯器',
        type: 'onclick',
        whitelist: '/workspace/sakura',
        settings: [
            newNumberSetting('數量', 5),
            newNumberSetting('延遲', 5),
            newStringSetting('名稱', 'NTR translator '),
            newStringSetting('鏈接', 'https://sakura-share.one'),
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
                const addBtn = Array.from(document.querySelectorAll('button.n-button'))
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
                const addBtn = Array.from(document.querySelectorAll('button.n-button.n-button--primary-type'))
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
                const addBtn = Array.from(document.querySelectorAll('button.n-button'))
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
                const confirmBtn = Array.from(document.querySelectorAll('button.n-button.n-button--primary-type'))
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
            Array.from(listItems).forEach(li => {
                const titleEl = li.querySelector('.n-thing-header__title');
                if (!titleEl) return;
                const titleText = titleEl.textContent.trim();
                const keep = excludeArr.some(x => titleText.indexOf(x) !== -1);
                if (!keep) {
                    const delBtn = li.querySelector('.n-button--error-type');
                    const parentEl = delBtn && delBtn.parentElement;
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
            newNumberSetting('最多啟動', 999),
            newStringSetting('bind', 'none'),
        ],
        run: async function (configObj) {
            const allBtns = document.querySelectorAll('button');
            const intervalVal = getModuleSetting(configObj, '延遲間隔') || 50;
            const maxClick = Math.min(getModuleSetting(configObj, '最多啟動') || 999, allBtns.length);
            const delay = ms => new Promise(r => setTimeout(r, ms));
            let idx = 0, clickCount = 0;
            async function nextClick() {
                while (idx < allBtns.length && clickCount < maxClick) {
                    const btn = allBtns[idx];
                    idx++;
                    if (btn.textContent.indexOf('启动') !== -1 || btn.textContent.indexOf('啟動') !== -1) {
                        btn.click();
                        clickCount++;
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
            newNumberSetting('延遲間隔', 50),
            newNumberSetting('並行延遲', 1000),
            newNumberSetting('並行數量', 5),
            newStringSetting('bind', 'none'),
        ],
        run: async function (configObj) {
            const delay = ms => new Promise(r => setTimeout(r, ms));
            const pollInterval = getModuleSetting(configObj, '並行延遲') || 300;
            const concurrentLimit = getModuleSetting(configObj, '並行數量') || 5;
            const mode = getModuleSetting(configObj, '模式');
            const modeMap = { '常規': '常规', '過期': '过期', '重翻': '重翻' };
            const cnMode = modeMap[mode] || '常规';
            async function setMode(doc) {
                const tags = doc.querySelectorAll('.n-tag__content');
                for (let i = 0; i < tags.length; i++) {
                    if (tags[i].textContent.trim() === cnMode) {
                        tags[i].dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
                        break;
                    }
                }
            }
            async function clickSakuraButtons(doc) {
                const btns = Array.from(doc.querySelectorAll('button')).filter(b =>
                    b.textContent.indexOf('排队Sakura') !== -1
                );
                btns.forEach(btn => {
                    btn.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
                });
            }
            if (location.pathname !== '/wenku') {
                setMode(document);
                await clickSakuraButtons(document);
                return;
            }
            const domain = window.location.origin;
            const allLinks = Array.from(document.querySelectorAll('a[href]'))
                .map(a => a.href)
                .filter(href => href.startsWith(domain) && /\/wenku\/[^/]+/.test(href));
            const uniqueLinks = Array.from(new Set(allLinks));
            async function waitForTabLoad(newTab) {
                const maxWait = 10000;
                const startTime = Date.now();
                while (true) {
                    await delay(pollInterval);
                    if (!newTab || newTab.closed) {
                        throw new Error('New tab was closed or blocked before loading.');
                    }
                    if (newTab.document && (newTab.document.readyState === 'complete' || newTab.document.querySelector('.n-tag__content'))) {
                        break;
                    }
                    if (Date.now() - startTime > maxWait) {
                        throw new Error('Timed out waiting for new tab to load.');
                    }
                }
            }
            async function processUrl(url) {
                const newTab = window.open(url, '_blank');
                if (!newTab) {
                    throw new Error('Failed to open new tab for: ' + url);
                }
                await waitForTabLoad(newTab);
                await setMode(newTab.document);
                await clickSakuraButtons(newTab.document);
                newTab.close();
            }
            let activeCount = 0, index = 0;
            async function spawnNext() {
                if (index >= uniqueLinks.length) return;
                const url = uniqueLinks[index++];
                activeCount++;
                try {
                    await processUrl(url);
                } catch (err) {
                    console.error('Failed to process:', url, err);
                } finally {
                    activeCount--;
                }
            }
            while (index < uniqueLinks.length) {
                if (activeCount < concurrentLimit) {
                    spawnNext();
                } else {
                    await delay(50);
                }
            }
            while (activeCount > 0) {
                await delay(50);
            }
            console.log('All Sakura tasks complete.');
        }
    };

    const moduleQueueGPT = {
        name: '排隊GPT',
        type: 'onclick',
        whitelist: '/wenku',
        settings: [
            newSelectSetting('模式', ['常規', '過期', '重翻'], '常規'),
            newNumberSetting('延遲間隔', 5),
            newNumberSetting('並行延遲', 300),
            newNumberSetting('並行數量', 5),
            newStringSetting('bind', 'none'),
        ],
        run: async function (configObj) {
            const delay = ms => new Promise(r => setTimeout(r, ms));
            const pollInterval = getModuleSetting(configObj, '並行延遲') || 300;
            const concurrentLimit = getModuleSetting(configObj, '並行數量') || 5;
            const mode = getModuleSetting(configObj, '模式');
            const modeMap = { '常規': '常规', '過期': '过期', '重翻': '重翻' };
            const cnMode = modeMap[mode] || '常规';
            function setMode(doc) {
                const tags = doc.querySelectorAll('.n-tag__content');
                for (let i = 0; i < tags.length; i++) {
                    if (tags[i].textContent.trim() === cnMode) {
                        tags[i].dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
                        break;
                    }
                }
            }
            async function clickGPTButtons(doc) {
                const btns = Array.from(doc.querySelectorAll('button')).filter(b =>
                    b.textContent.indexOf('排队GPT') !== -1
                );
                btns.forEach(btn => {
                    btn.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
                });
            }
            if (location.pathname !== '/wenku') {
                setMode(document);
                await clickGPTButtons(document);
                return;
            }
            const domain = window.location.origin;
            const allLinks = Array.from(document.querySelectorAll('a[href]'))
                .map(a => a.href)
                .filter(href => href.startsWith(domain) && /\/wenku\/[^/]+/.test(href));
            const uniqueLinks = Array.from(new Set(allLinks));
            async function waitForTabLoad(newTab) {
                const maxWait = 10000;
                const startTime = Date.now();
                while (true) {
                    await delay(pollInterval);
                    if (!newTab || newTab.closed) {
                        throw new Error('New tab was closed or blocked before loading.');
                    }
                    if (newTab.document && (newTab.document.readyState === 'complete' || newTab.document.querySelector('.n-tag__content'))) {
                        break;
                    }
                    if (Date.now() - startTime > maxWait) {
                        throw new Error('Timed out waiting for new tab to load.');
                    }
                }
            }
            async function processUrl(url) {
                const newTab = window.open(url, '_blank');
                if (!newTab) {
                    throw new Error('Failed to open new tab for: ' + url);
                }
                await waitForTabLoad(newTab);
                setMode(newTab.document);
                await clickGPTButtons(newTab.document);
                newTab.close();
            }
            let activeCount = 0, index = 0;
            async function spawnNext() {
                if (index >= uniqueLinks.length) return;
                const url = uniqueLinks[index++];
                activeCount++;
                try {
                    await processUrl(url);
                } catch (err) {
                    console.error('Failed to process:', url, err);
                } finally {
                    activeCount--;
                }
            }
            while (index < uniqueLinks.length) {
                if (activeCount < concurrentLimit) {
                    spawnNext();
                } else {
                    await delay(50);
                }
            }
            while (activeCount > 0) {
                await delay(50);
            }
            console.log('All GPT tasks complete.');
        }
    };

    const moduleAutoRetry = {
        name: '自動重試',
        type: 'keep',
        whitelist: '/workspace/*',
        settings: [
            newNumberSetting('最大重試次數', 3),
        ],
        _keepIntervalId: null,
        _keepActive: false,
        _attempts: 0,
        run: function (configObj) {
            if (!this._keepActive) {
                this._keepActive = true;
                const maxAttempts = getModuleSetting(configObj, '最大重試次數');
                document.addEventListener('click', function (e) {
                    if (e.target.tagName === 'BUTTON') {
                        this._attempts = 0;
                    }
                }.bind(this));
                this._keepIntervalId = setInterval(function () {
                    const listItems = document.querySelectorAll('.n-list-item');
                    const unfinishedItems = Array.from(listItems).filter(item => {
                        const desc = item.querySelector('.n-thing-main__description');
                        return desc && desc.textContent.indexOf('未完成') !== -1;
                    });
                    if (unfinishedItems.length > 0 && this._attempts < maxAttempts) {
                        const hasStopButton = Array.from(document.querySelectorAll('button')).some(btn =>
                            btn.textContent === '停止'
                        );
                        if (!hasStopButton) {
                            const retryButtons = Array.from(document.querySelectorAll('button')).filter(btn =>
                                btn.textContent.indexOf('重试未完成任务') !== -1
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
                }.bind(this), 1000);
            } else {
                this._keepActive = false;
                if (this._keepIntervalId) {
                    clearInterval(this._keepIntervalId);
                    this._keepIntervalId = null;
                }
            }
        }
    };

    const moduleCacheOptimization = {
        name: '緩存優化',
        type: 'keep',
        whitelist: '',
        settings: [
            newNumberSetting('同步間隔', 1000),
        ],
        run: async function (configObj) {
            const interval = getModuleSetting(configObj, '同步間隔') || 1000;
            const origSession = window.sessionStorage;
            try {
                const proxyStorage = new Proxy(origSession, {
                    get: function (target, prop) {
                        if (typeof prop === 'string') {
                            let val = target[prop];
                            if (val === undefined) {
                                val = localStorage.getItem(prop);
                                if (val !== null) target.setItem(prop, val);
                            }
                            return val;
                        }
                        return target[prop];
                    },
                    set: function (target, prop, value) {
                        target[prop] = value;
                        localStorage.setItem(prop, value);
                        return true;
                    }
                });
                Object.defineProperty(window, 'sessionStorage', { value: proxyStorage, configurable: true });
            } catch (e) { }
            setInterval(function () {
                for (let i = 0; i < localStorage.length; i++) {
                    const key = localStorage.key(i);
                    const localVal = localStorage.getItem(key);
                    const sessVal = origSession[key];
                    if (sessVal !== localVal) {
                        origSession[key] = localVal;
                        try {
                            window.dispatchEvent(new StorageEvent('storage', {
                                key: key,
                                newValue: localVal,
                                storageArea: origSession
                            }));
                        } catch (e) { }
                    }
                }
            }, interval);
        }
    };

    const defaultModules = [
        moduleAddSakuraTranslator,
        moduleAddGPTTranslator,
        moduleDeleteTranslator,
        moduleLaunchTranslator,
        moduleQueueSakura,
        moduleQueueGPT,
        moduleAutoRetry,
        moduleCacheOptimization
    ];

    function DragHandler(panel, title) {
        this.panel = panel;
        this.title = title;
        this.dragging = false;
        this.offsetX = 0;
        this.offsetY = 0;
        this.init();
    }
    DragHandler.prototype.init = function () {
        const self = this;
        this.title.addEventListener('mousedown', function (e) {
            if (e.button !== 0) return;
            self.panel.style.transition = 'width 0.3s ease';
            self.dragging = true;
            self.offsetX = e.clientX - self.panel.offsetLeft;
            self.offsetY = e.clientY - self.panel.offsetTop;
            e.preventDefault();
        });
        document.addEventListener('mousemove', function (e) {
            if (!self.dragging) return;
            const newLeft = e.clientX - self.offsetX;
            const newTop = e.clientY - self.offsetY;
            self.panel.style.left = newLeft + 'px';
            self.panel.style.top = newTop + 'px';
            clampPanel();
        });
        document.addEventListener('mouseup', function (e) {
            if (!self.dragging) return;
            self.panel.style.transition = 'width 0.3s ease, height 0.3s ease, top 0.3s ease, left 0.3s ease';
            self.dragging = false;
            localStorage.setItem('ntr-panel-position', JSON.stringify({
                left: self.panel.style.left,
                top: self.panel.style.top
            }));
        });
        function clampPanel() {
            const rect = self.panel.getBoundingClientRect();
            let left = parseFloat(self.panel.style.left) || 0;
            let top = parseFloat(self.panel.style.top) || 0;
            const maxLeft = window.innerWidth - rect.width;
            const maxTop = window.innerHeight - rect.height;
            if (left < 0) left = 0;
            if (top < 0) top = 0;
            if (left > maxLeft) left = maxLeft;
            if (top > maxTop) top = maxTop;
            self.panel.style.left = left + 'px';
            self.panel.style.top = top + 'px';
        }
    };

    function getAnchorCornerInfo(rect) {
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const horizontal = centerX < window.innerWidth / 2 ? 'left' : 'right';
        const vertical = centerY < window.innerHeight / 2 ? 'top' : 'bottom';
        return { corner: vertical + '-' + horizontal, x: horizontal === 'left' ? rect.left : rect.right, y: vertical === 'top' ? rect.top : rect.bottom };
    }

    NTRToolBox.prototype.adjustPanelPosition = function () {
        const rect = this.panel.getBoundingClientRect();
        let anchor = null;
        try {
            anchor = JSON.parse(localStorage.getItem('ntr-panel-anchor'));
        } catch (e) {}
        let newLeft, newTop;
        if (anchor && anchor.corner) {
            if (anchor.corner === 'top-left') {
                newLeft = anchor.x;
                newTop = anchor.y;
            } else if (anchor.corner === 'top-right') {
                newLeft = anchor.x - rect.width;
                newTop = anchor.y;
            } else if (anchor.corner === 'bottom-left') {
                newLeft = anchor.x;
                newTop = anchor.y - rect.height;
            } else if (anchor.corner === 'bottom-right') {
                newLeft = anchor.x - rect.width;
                newTop = anchor.y - rect.height;
            }
        } else {
            newLeft = rect.left;
            newTop = rect.top;
        }
        newLeft = Math.min(Math.max(newLeft, 0), window.innerWidth - rect.width);
        newTop = Math.min(Math.max(newTop, 0), window.innerHeight - rect.height);
        this.panel.style.left = newLeft + 'px';
        this.panel.style.top = newTop + 'px';
        localStorage.setItem('ntr-panel-position', JSON.stringify({ left: this.panel.style.left, top: this.panel.style.top }));
    };

    function NTRToolBox() {
        this.configuration = this.loadConfiguration();
        this.keepIntervals = new Map();
        this.keepActiveSet = new Set();
        this.headerMap = new Map();
        this.buildGUI();
        this.attachGlobalKeyBindings();
        this.loadKeepStateAndStart();
        const self = this;
        setInterval(function () {
            self.updateModuleVisibility();
        }, 500);
    }

    function cloneDefaultModules() {
        return defaultModules.map(m => ({
            ...m,
            settings: m.settings ? m.settings.map(s => ({ ...s })) : []
        }));
    }
    
    NTRToolBox.prototype.loadConfiguration = function () {
        let tempStorage;
        try {
            tempStorage = JSON.parse(localStorage.getItem(CONFIG_STORAGE_KEY));
        } catch (e) { }
        if (!tempStorage || tempStorage.version !== CONFIG_VERSION) {
            return { version: CONFIG_VERSION, modules: cloneDefaultModules() };
        }
        const loadedModules = cloneDefaultModules();
        tempStorage.modules.forEach(function (storedModule) {
            const defMod = loadedModules.find(m => m.name === storedModule.name);
            if (defMod) {
                for (const k in storedModule) {
                    if (defMod.hasOwnProperty(k) && typeof defMod[k] === typeof storedModule[k] && storedModule[k] !== undefined) {
                        defMod[k] = storedModule[k];
                    }
                }
            }
        });
        if (loadedModules.length !== defaultModules.length) {
            const fresh = cloneDefaultModules();
            localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify({ version: CONFIG_VERSION, modules: fresh }));
            return { version: CONFIG_VERSION, modules: fresh };
        } else {
            const defNames = defaultModules.map(x => x.name).sort().join(',');
            const storedNames = loadedModules.map(x => x.name).sort().join(',');
            if (defNames !== storedNames) {
                const fresh = cloneDefaultModules();
                localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify({ version: CONFIG_VERSION, modules: fresh }));
                return { version: CONFIG_VERSION, modules: fresh };
            }
        }
        loadedModules.forEach(function (m) {
            const found = defaultModules.find(d => d.name === m.name);
            if (found && typeof found.run === 'function') {
                for (const p in found) {
                    if (!m.hasOwnProperty(p)) {
                        m[p] = found[p];
                    }
                }
                m.run = found.run;
            }
        });
        return { version: CONFIG_VERSION, modules: loadedModules };
    };

    NTRToolBox.prototype.saveConfiguration = function () {
        localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(this.configuration));
    };

    NTRToolBox.prototype.buildGUI = function () {
        this.panel = document.createElement('div');
        this.panel.id = 'ntr-panel';
        const savedPos = localStorage.getItem('ntr-panel-position');
        if (savedPos) {
            try {
                const parsed = JSON.parse(savedPos);
                if (parsed.left && parsed.top) {
                    this.panel.style.left = parsed.left;
                    this.panel.style.top = parsed.top;
                }
            } catch (e) { }
        }
        this.isMinimized = false;
        this.titleBar = document.createElement('div');
        this.titleBar.className = 'ntr-titlebar';
        this.titleBar.innerHTML = 'NTR ToolBox v0.3.1';
        this.toggleSpan = document.createElement('span');
        this.toggleSpan.style.float = 'right';
        this.toggleSpan.textContent = '[-]';
        this.titleBar.appendChild(this.toggleSpan);
        this.panel.appendChild(this.titleBar);
        this.panelBody = document.createElement('div');
        this.panelBody.className = 'ntr-panel-body';
        this.panel.appendChild(this.panelBody);
        this.infoBar = document.createElement('div');
        this.infoBar.className = 'ntr-info';
        const leftInfo = document.createElement('span');
        const rightInfo = document.createElement('span');
        if (IS_MOBIlE) {
            leftInfo.textContent = '單擊執行 | ⚙️設定';
        } else {
            leftInfo.textContent = '左鍵執行/切換 | 右鍵設定';
        }
        rightInfo.textContent = 'Author: TheNano(百合仙人)';
        this.infoBar.appendChild(leftInfo);
        this.infoBar.appendChild(rightInfo);
        this.panel.appendChild(this.infoBar);
        document.body.appendChild(this.panel);
        this.dragHandler = new DragHandler(this.panel, this.titleBar);
        this.buildModules();
        const self = this;
        setTimeout(function () {
            self.expandedWidth = self.panel.offsetWidth;
            self.expandedHeight = self.panel.offsetHeight;
            const wasMin = self.isMinimized;
            if (!wasMin) self.panel.classList.add('minimized');
            const h0 = self.panel.offsetHeight;
            if (!wasMin) self.panel.classList.remove('minimized');
            self.minimizedWidth = self.panel.offsetWidth;
            self.minimizedHeight = h0;
            self.adjustPanelPosition();
        }, 150);
        const selfRef = this;
        if (IS_MOBIlE) {
            this.titleBar.addEventListener('click', function (e) {
                if (!selfRef.dragHandler.dragging) {
                    e.preventDefault();
                    selfRef.setMinimizedState(!selfRef.isMinimized);
                }
            });
        } else {
            this.titleBar.addEventListener('contextmenu', function (e) {
                e.preventDefault();
                selfRef.setMinimizedState(!selfRef.isMinimized);
            });
        }
    };

    NTRToolBox.prototype.buildModules = function () {
        this.panelBody.innerHTML = '';
        this.headerMap = new Map();
        const self = this;
        this.configuration.modules.forEach(function (modItem) {
            const moduleContainer = document.createElement('div');
            moduleContainer.className = 'ntr-module-container';
            const moduleHeader = document.createElement('div');
            moduleHeader.className = 'ntr-module-header';
            const nameSpan = document.createElement('span');
            nameSpan.textContent = modItem.name;
            moduleHeader.appendChild(nameSpan);
            if (!IS_MOBIlE) {
                const iconSpan = document.createElement('span');
                iconSpan.textContent = (modItem.type === 'keep' ? '⇋' : '▶');
                iconSpan.style.marginLeft = '8px';
                moduleHeader.appendChild(iconSpan);
            }
            const settingsContainer = document.createElement('div');
            settingsContainer.className = 'ntr-settings-container';
            settingsContainer.style.display = 'none';
            if (IS_MOBIlE) {
                const settingsBtn = document.createElement('button');
                settingsBtn.textContent = '⚙️';
                settingsBtn.style.color = 'white';
                settingsBtn.style.float = 'right';
                settingsBtn.onclick = function (e) {
                    e.stopPropagation();
                    const curDisp = settingsContainer.style.display || window.getComputedStyle(settingsContainer).display;
                    settingsContainer.style.display = (curDisp === 'none' ? 'block' : 'none');
                };
                moduleHeader.appendChild(settingsBtn);
                moduleHeader.onclick = function (e) {
                    if (e.target.classList.contains('ntr-bind-button') || e.target === settingsBtn) return;
                    self.handleModuleClick(modItem, moduleHeader);
                };
            } else {
                moduleHeader.oncontextmenu = function (e) {
                    e.preventDefault();
                    const curDisp = settingsContainer.style.display || window.getComputedStyle(settingsContainer).display;
                    settingsContainer.style.display = (curDisp === 'none' ? 'block' : 'none');
                };
                moduleHeader.onclick = function (e) {
                    if (e.button === 0 && !e.ctrlKey && !e.altKey && !e.shiftKey) {
                        if (e.target.classList.contains('ntr-bind-button')) return;
                        self.handleModuleClick(modItem, moduleHeader);
                    }
                };
            }
            if (Array.isArray(modItem.settings)) {
                modItem.settings.forEach(function (sObj) {
                    const row = document.createElement('div');
                    row.style.marginBottom = '8px';
                    const label = document.createElement('label');
                    label.style.display = 'inline-block';
                    label.style.minWidth = '70px';
                    label.style.color = '#ccc';
                    label.textContent = sObj.name + ': ';
                    row.appendChild(label);
                    let inputEl;
                    if (sObj.type === 'boolean') {
                        inputEl = document.createElement('input');
                        inputEl.type = 'checkbox';
                        inputEl.checked = !!sObj.value;
                        inputEl.onchange = function () {
                            sObj.value = inputEl.checked;
                            self.saveConfiguration();
                        };
                    } else if (sObj.type === 'number') {
                        inputEl = document.createElement('input');
                        inputEl.type = 'number';
                        inputEl.value = sObj.value;
                        inputEl.className = 'ntr-number-input';
                        inputEl.onchange = function () {
                            sObj.value = Number(inputEl.value) || 0;
                            self.saveConfiguration();
                        };
                    } else if (sObj.type === 'string' && sObj.name === 'bind') {
                        inputEl = document.createElement('button');
                        inputEl.className = 'ntr-bind-button';
                        inputEl.textContent = (sObj.value === 'none' ? '(None)' : '[' + sObj.value.toUpperCase() + ']');
                        inputEl.onclick = function () {
                            inputEl.textContent = '(Press any key)';
                            function handleKey(e2) {
                                e2.preventDefault();
                                if (e2.key === 'Escape') {
                                    sObj.value = 'none';
                                    inputEl.textContent = '(None)';
                                    self.saveConfiguration();
                                    document.removeEventListener('keydown', handleKey, true);
                                    e2.stopPropagation();
                                    return;
                                }
                                const pk = e2.key.toLowerCase();
                                sObj.value = pk;
                                inputEl.textContent = '[' + pk.toUpperCase() + ']';
                                self.saveConfiguration();
                                document.removeEventListener('keydown', handleKey, true);
                                e2.stopPropagation();
                            }
                            document.addEventListener('keydown', handleKey, true);
                        };
                    } else if (sObj.type === 'select' && Array.isArray(sObj.options)) {
                        inputEl = document.createElement('select');
                        sObj.options.forEach(function (opt) {
                            const optEl = document.createElement('option');
                            optEl.value = opt;
                            optEl.textContent = opt;
                            if (opt === sObj.value) {
                                optEl.selected = true;
                            }
                            inputEl.appendChild(optEl);
                        });
                        inputEl.onchange = function () {
                            sObj.value = inputEl.value;
                            self.saveConfiguration();
                        };
                    } else if (sObj.type === 'string') {
                        inputEl = document.createElement('input');
                        inputEl.type = 'text';
                        inputEl.value = sObj.value;
                        inputEl.className = 'ntr-input';
                        inputEl.onchange = function () {
                            sObj.value = inputEl.value;
                            self.saveConfiguration();
                        };
                    } else {
                        inputEl = document.createElement('span');
                        inputEl.style.color = '#999';
                        inputEl.textContent = String(sObj.value);
                    }
                    row.appendChild(inputEl);
                    settingsContainer.appendChild(row);
                });
            }
            moduleContainer.appendChild(moduleHeader);
            moduleContainer.appendChild(settingsContainer);
            self.panelBody.appendChild(moduleContainer);
            self.headerMap.set(modItem, moduleHeader);
        });
    };

    NTRToolBox.prototype.attachGlobalKeyBindings = function () {
        const self = this;
        document.addEventListener('keydown', function (e) {
            if (e.ctrlKey || e.altKey || e.metaKey) return;
            const pk = e.key.toLowerCase();
            self.configuration.modules.forEach(function (m) {
                const bSetting = m.settings.find(s => s.name === 'bind');
                if (!bSetting || bSetting.value === 'none') return;
                if (bSetting.value.toLowerCase() === pk) {
                    if (!isModuleEnabledByWhitelist(m)) return;
                    e.preventDefault();
                    self.handleModuleClick(m, null);
                }
            });
        });
    };

    NTRToolBox.prototype.handleModuleClick = function (modItem, modHeader) {
        if (!domainAllowed || !isModuleEnabledByWhitelist(modItem)) return;
        try {
            if (modItem.type === 'onclick') {
                if (modItem.run instanceof Function) {
                    Promise.resolve(modItem.run(modItem)).catch(console.error);
                }
            } else if (modItem.type === 'keep') {
                const isActive = this.keepActiveSet.has(modItem.name);
                if (isActive) {
                    if (modHeader) this.stopKeepModule(modItem, modHeader);
                } else {
                    if (modHeader) this.startKeepModule(modItem, modHeader);
                }
            }
        } catch (e) {
            console.error("Error running module:", modItem.name, e);
        }
    };

    NTRToolBox.prototype.startKeepModule = function (modItem, modHeader) {
        if (this.keepIntervals.has(modItem.name)) return;
        modHeader.classList.add('active');
        this.keepActiveSet.add(modItem.name);
        const intId = setInterval(function () {
            if (typeof modItem.run === 'function') {
                modItem.run(modItem);
            }
        }, 2000);
        this.keepIntervals.set(modItem.name, intId);
        this.updateKeepStateStorage();
    };

    NTRToolBox.prototype.stopKeepModule = function (modItem, modHeader) {
        const intId = this.keepIntervals.get(modItem.name);
        if (intId) {
            clearInterval(intId);
            this.keepIntervals.delete(modItem.name);
        }
        modHeader.classList.remove('active');
        this.keepActiveSet.delete(modItem.name);
        this.updateKeepStateStorage();
    };

    NTRToolBox.prototype.updateKeepStateStorage = function () {
        const st = {};
        this.keepActiveSet.forEach(function (n) {
            st[n] = true;
        });
        localStorage.setItem('NTR_KeepState', JSON.stringify(st));
    };

    NTRToolBox.prototype.loadKeepStateAndStart = function () {
        let saved = {};
        try {
            saved = JSON.parse(localStorage.getItem('NTR_KeepState') || '{}');
        } catch (e) { }
        const self = this;
        this.configuration.modules.forEach(function (m) {
            if (m.type === 'keep' && saved[m.name]) {
                const hdr = self.headerMap.get(m);
                if (hdr) {
                    self.startKeepModule(m, hdr);
                }
            }
        });
    };

    NTRToolBox.prototype.updateModuleVisibility = function () {
        const self = this;
        this.configuration.modules.forEach(function (m) {
            const hdr = self.headerMap.get(m);
            if (!hdr) return;
            const cont = hdr.parentElement;
            const allow = domainAllowed && isModuleEnabledByWhitelist(m);
            if (!allow) {
                cont.style.display = 'none';
                if (m.type === 'keep' && self.keepActiveSet.has(m.name)) {
                    self.stopKeepModule(m, hdr);
                }
            } else {
                cont.style.display = 'block';
            }
        });
        this.adjustPanelPosition();
    };

    NTRToolBox.prototype.setMinimizedState = function (newVal) {
        if (this.isMinimized === newVal) return;
        const oldRect = this.panel.getBoundingClientRect();
        const anchorInfo = getAnchorCornerInfo(oldRect);
        localStorage.setItem('ntr-panel-anchor', JSON.stringify(anchorInfo));
        this.isMinimized = newVal;
        if (this.isMinimized) {
            this.panel.classList.add('minimized');
            this.toggleSpan.textContent = '[+]';
            this.panelBody.style.display = 'none';
            this.infoBar.style.display = 'none';
        } else {
            this.panel.classList.remove('minimized');
            this.toggleSpan.textContent = '[-]';
            this.panelBody.style.display = 'block';
            this.infoBar.style.display = 'flex';
        }
        const self = this;
        setTimeout(function () {
            const newRect = self.panel.getBoundingClientRect();
            let newLeft, newTop;
            if (anchorInfo.corner === 'top-left') {
                newLeft = anchorInfo.x;
                newTop = anchorInfo.y;
            } else if (anchorInfo.corner === 'top-right') {
                newLeft = anchorInfo.x - newRect.width;
                newTop = anchorInfo.y;
            } else if (anchorInfo.corner === 'bottom-left') {
                newLeft = anchorInfo.x;
                newTop = anchorInfo.y - newRect.height;
            } else if (anchorInfo.corner === 'bottom-right') {
                newLeft = anchorInfo.x - newRect.width;
                newTop = anchorInfo.y - newRect.height;
            } else {
                newLeft = parseFloat(self.panel.style.left) || newRect.left;
                newTop = parseFloat(self.panel.style.top) || newRect.top;
            }
            newLeft = Math.min(Math.max(newLeft, 0), window.innerWidth - newRect.width);
            newTop = Math.min(Math.max(newTop, 0), window.innerHeight - newRect.height);
            self.panel.style.left = newLeft + 'px';
            self.panel.style.top = newTop + 'px';
            localStorage.setItem('ntr-panel-position', JSON.stringify({
                left: self.panel.style.left,
                top: self.panel.style.top
            }));
        }, 310);
    };

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
        transition: width 0.3s ease, height 0.3s ease, top 0.3s ease, left 0.3s ease;
    }
    #ntr-panel.minimized {
        width: 200px;
    }
    .ntr-titlebar {
        font-weight: bold;
        padding: 10px;
        cursor: move;
        background: #292929;
        border-radius: 6px;
        color: #CCC;
        user-select: none;
    }
    .ntr-panel-body {
        padding: 6px;
        background: #232323;
        border-radius: 4px;
        overflow: hidden;
        max-height: 500px;
        transition: max-height 0.3s ease;
    }
    #ntr-panel.minimized .ntr-panel-body {
        max-height: 0;
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
        display: flex;
        justify-content: space-between;
        font-size: 10px;
        color: #888;
        margin-top: 8px;
    }
    .ntr-module-header.active {
        background: #63E2B7 !important;
        color: #fff !important;
    }
    @media only screen and (max-width:600px){
        #ntr-panel {
            transform: scale(0.6);
            transform-origin: top left;
        }
    }
    `;
    document.head.appendChild(style);
    new NTRToolBox();
})();