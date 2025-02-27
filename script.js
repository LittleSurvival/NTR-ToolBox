// ==UserScript==
// @name         NTR ToolBox
// @namespace    http://tampermonkey.net/
// @version      v0.3.4-20250225
// @description  ToolBox for Novel Translate bot website
// @match        https://books.fishhawk.top/*
// @match        https://books1.fishhawk.top/*
// @grant        GM_openInTab
// @license      All Rights Reserved
// ==/UserScript==

(function () {
    'use strict';

    if (window._NTRToolBoxInstance) {
        return;
    }

    window._NTRToolBoxInstance = true;

    const CONFIG_VERSION = 15;
    const VERSION = '0.3.4';
    const CONFIG_STORAGE_KEY = 'NTR_ToolBox_Config';
    const IS_MOBILE = /Mobi|Android/i.test(navigator.userAgent);
    const domainAllowed = (location.hostname === 'books.fishhawk.top' || location.hostname === 'books1.fishhawk.top');

    // -----------------------------------
    // Module settings
    // -----------------------------------

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
    function getModuleSetting(mod, key) {
        if (!mod.settings) return undefined;
        const found = mod.settings.find(s => s.name === key);
        return found ? found.value : undefined;
    }
    function isModuleEnabledByWhitelist(modItem) {
        if (!modItem.whitelist || !modItem.whitelist.trim()) {
            return domainAllowed;
        }
        const parts = modItem.whitelist.split(/[,;\n]+/).map(s => s.trim()).filter(Boolean);
        return domainAllowed && parts.some(p => {
            if (p.endsWith('/*')) {
                const base = p.slice(0, -2);
                return location.pathname.startsWith(base + '/');
            }
            return location.pathname.includes(p);
        });
    }

    // -----------------------------------
    // Module definitions
    // -----------------------------------
    const moduleAddSakuraTranslator = {
        name: '添加Sakura翻譯器',
        type: 'onclick',
        whitelist: '/workspace/sakura',
        settings: [
            newNumberSetting('數量', 5),
            newStringSetting('名稱', 'NTR translator '),
            newStringSetting('鏈接', 'https://sakura-share.one'),
            newStringSetting('bind', 'none'),
        ],
        run: async function (cfg) {
            const totalCount = getModuleSetting(cfg, '數量') || 1;
            const namePrefix = getModuleSetting(cfg, '名稱') || '';
            const linkValue = getModuleSetting(cfg, '鏈接') || '';

            StorageUtils.addSakuraWorker(namePrefix, linkValue, totalCount);
        }
    }

    const moduleAddGPTTranslator = {
        name: '添加GPT翻譯器',
        type: 'onclick',
        whitelist: '/workspace/gpt',
        settings: [
            newNumberSetting('數量', 5),
            newStringSetting('名稱', 'NTR translator '),
            newStringSetting('模型', 'deepseek-chat'),
            newStringSetting('鏈接', 'https://api.deepseek.com'),
            newStringSetting('Key', 'sk-wait-for-input'),
            newStringSetting('bind', 'none'),
        ],
        run: async function (cfg) {
            const totalCount = getModuleSetting(cfg, '數量') || 1;
            const namePrefix = getModuleSetting(cfg, '名稱') || '';
            const model = getModuleSetting(cfg, '模型') || '';
            const apiKey = getModuleSetting(cfg, 'Key') || '';
            const apiUrl = getModuleSetting(cfg, '鏈接') || '';

            StorageUtils.addGPTWorker(namePrefix, model, apiUrl, apiKey, totalCount);
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
        run: async function (cfg) {
            const excludeStr = getModuleSetting(cfg, '排除') || '';
            const excludeArr = excludeStr.split(',').filter(x => x);

            if (location.href.endsWith('gpt')) {
                StorageUtils.removeAllWorkers(StorageUtils.gpt, excludeArr);
            } else if (location.href.endsWith('sakura')) {
                StorageUtils.removeAllWorkers(StorageUtils.sakura, excludeArr);
            }
        }
    };

    const moduleLaunchTranslator = {
        name: '啟動翻譯器',
        type: 'onclick',
        whitelist: '/workspace',
        settings: [
            newNumberSetting('延遲間隔', 50),
            newNumberSetting('最多啟動', 999),
            newBooleanSetting('避免無效啟動', true),
            newStringSetting('bind', 'none'),
        ],
        run: async function (cfg) {
            const intervalVal = getModuleSetting(cfg, '延遲間隔') || 50;
            const maxClick = getModuleSetting(cfg, '最多啟動') || 999;
            const noEmptyLaunch = getModuleSetting(cfg, '避免無效啟動');
            const allBtns = document.querySelectorAll('button');
            const delay = ms => new Promise(r => setTimeout(r, ms));
            let idx = 0, clickCount = 0, lastRunning = 0, emptyCheck = 0;

            async function nextClick() {
                while (idx < allBtns.length && clickCount < maxClick) {
                    const btn = allBtns[idx++];
                    if (btn.textContent.includes('启动')) {
                        btn.click();
                        clickCount++;
                        await delay(intervalVal);
                    }
                    if (noEmptyLaunch) {
                        let running = [...document.querySelectorAll('button')].filter(btn => btn.textContent.includes('停止')).length;
                        if (running == lastRunning) emptyCheck++;
                        if (emptyCheck > 3) break;
                    }
                }
            }
            await nextClick();
        }
    };

    const moduleQueueSakura = {
        name: '批量排隊Sakura',
        type: 'onclick',
        whitelist: '/wenku',
        settings: [
            newSelectSetting('模式', ['常規', '過期', '重翻'], '常規'),
            newNumberSetting('延遲間隔', 50),
            newNumberSetting('並行延遲', 1000),
            newNumberSetting('並行數量', 5),
            newStringSetting('bind', 'none'),
        ],
        run: async function (cfg) {
            const delay = ms => new Promise(r => setTimeout(r, ms));
            const pollInterval = getModuleSetting(cfg, '並行延遲') || 300;
            const concurrentLimit = getModuleSetting(cfg, '並行數量') || 5;
            const mode = getModuleSetting(cfg, '模式');
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
                const btns = [...doc.querySelectorAll('button')].filter(b =>
                    b.textContent.includes('排队Sakura')
                );
                btns.forEach(btn => {
                    btn.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
                });
            }

            if (location.pathname !== '/wenku') {
                // direct run
                setMode(document);
                await clickSakuraButtons(document);
                return;
            }
            const domain = window.location.origin;
            const allLinks = [...document.querySelectorAll('a[href]')]
                .map(a => a.href)
                .filter(href => href.startsWith(domain) && /\/wenku\/[^/]+/.test(href));
            const uniqueLinks = [...new Set(allLinks)];

            async function waitForTabLoad(tab) {
                const maxWait = 10000;
                const startTime = Date.now();
                while (true) {
                    await delay(pollInterval);
                    if (!tab || tab.closed) {
                        throw new Error('New tab was closed or blocked before loading.');
                    }
                    if (
                        tab.document &&
                        (tab.document.readyState === 'complete' || tab.document.querySelector('.n-tag__content'))
                    ) {
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
        name: '批量排隊GPT',
        type: 'onclick',
        whitelist: '/wenku',
        settings: [
            newSelectSetting('模式', ['常規', '過期', '重翻'], '常規'),
            newNumberSetting('延遲間隔', 5),
            newNumberSetting('並行延遲', 300),
            newNumberSetting('並行數量', 5),
            newStringSetting('bind', 'none'),
        ],
        run: async function (cfg) {
            const delay = ms => new Promise(r => setTimeout(r, ms));
            const pollInterval = getModuleSetting(cfg, '並行延遲') || 300;
            const concurrentLimit = getModuleSetting(cfg, '並行數量') || 5;
            const mode = getModuleSetting(cfg, '模式');
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
                const btns = [...doc.querySelectorAll('button')].filter(b =>
                    b.textContent.includes('排队GPT')
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
            const allLinks = [...document.querySelectorAll('a[href]')]
                .map(a => a.href)
                .filter(href => href.startsWith(domain) && /\/wenku\/[^/]+/.test(href));
            const uniqueLinks = [...new Set(allLinks)];

            async function waitForTabLoad(tab) {
                const maxWait = 10000;
                const startTime = Date.now();
                while (true) {
                    await delay(pollInterval);
                    if (!tab || tab.closed) {
                        throw new Error('New tab was closed or blocked before loading.');
                    }
                    if (tab.document && (tab.document.readyState === 'complete' || tab.document.querySelector('.n-tag__content'))) {
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

    const moduleQueueWebSakura = {
        name: '自訂排隊Sakura',
        type: 'onclick',
        whitelist: '/novel/*',
        settings: [
            newNumberSetting('均分任務', 10),
        ],
        run: async function (cfg) {
            const pair = getModuleSetting(cfg, '均分任務');

        }
    }

    const moduleAutoRetry = {
        name: '自動重試',
        type: 'keep',
        whitelist: '/workspace/*',
        settings: [
            newNumberSetting('最大重試次數', 99),
            newBooleanSetting('重啟翻譯器', true),
        ],
        _attempts: 0,
        _lastRun: 0,
        _interval: 1000,
        run: async function (cfg) {
            const delay = ms => new Promise(r => setTimeout(r, ms));

            const now = Date.now();
            if (now - this._lastRun < this._interval) return;
            this._lastRun = now;

            const maxAttempts = getModuleSetting(cfg, '最大重試次數') || 99;
            const relaunch = getModuleSetting(cfg, '重啟翻譯器') || 3;

            if (!this._boundClickHandler) {
                this._boundClickHandler = (e) => {
                    if (e.target.tagName === 'BUTTON') {
                        this._attempts = 0;
                    }
                };
                document.addEventListener('click', this._boundClickHandler);
            }

            const listItems = document.querySelectorAll('.n-list-item');
            const unfinished = [...listItems].filter(item => {
                const desc = item.querySelector('.n-thing-main__description');
                return desc && desc.textContent.includes('未完成');
            });
            async function retryTasks(attempts) {
                const hasStop = [...document.querySelectorAll('button')].some(b => b.textContent === '停止');
                if (!hasStop) {
                    const retryBtns = [...document.querySelectorAll('button')].filter(b => b.textContent.includes('重试未完成任务'));
                    if (retryBtns[0]) {
                        const clickCount = Math.min(unfinished.length, listItems.length);
                        for (let i = 0; i < clickCount; i++) {
                            retryBtns[0].click();
                        }
                        attempts++;
                    }
                }
                return attempts;
            }

            if (unfinished.length > 0 && this._attempts < maxAttempts) {
                this._attempts = await retryTasks(this._attempts);
                delay(10);
                if (relaunch) {
                    script.runModule('啟動翻譯器');
                }
            }
        }
    };

    const moduleCacheOptimization = {
        name: '緩存優化',
        type: 'keep',
        whitelist: '',
        settings: [
            newNumberSetting('同步間隔', 1000)
        ],
        _lastRun: 0,
        _proxyDefined: false,
        run: async function (cfg) {
            const now = Date.now();
            const intervalMs = getModuleSetting(cfg, '同步間隔') || 1000;
            if (now - this._lastRun < intervalMs) return;
            this._lastRun = now;

            const origSession = window.sessionStorage;
            if (!this._proxyDefined) {
                this._proxyDefined = true;
                try {
                    const proxyStorage = new Proxy(origSession, {
                        get(target, prop) {
                            if (typeof prop === 'string') {
                                let val = target[prop];
                                if (val === undefined) {
                                    val = localStorage.getItem(prop);
                                    if (val !== null) {
                                        target.setItem(prop, val);
                                    }
                                }
                                return val;
                            }
                            return target[prop];
                        },
                        set(target, prop, value) {
                            target[prop] = value;
                            localStorage.setItem(prop, value);
                            return true;
                        }
                    });
                    Object.defineProperty(window, 'sessionStorage', { value: proxyStorage, configurable: true });
                } catch (e) {
                    console.error('Failed setting proxy for sessionStorage:', e);
                }
            }
            // Sync localStorage -> sessionStorage
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                const localVal = localStorage.getItem(key);
                const sessVal = origSession[key];
                if (sessVal !== localVal) {
                    origSession[key] = localVal;
                    try {
                        window.dispatchEvent(new StorageEvent('storage', {
                            key,
                            newValue: localVal,
                            storageArea: origSession
                        }));
                    } catch (e) { }
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
        moduleAutoRetry,
        moduleCacheOptimization
    ];

    

    // -----------------------------------
    // Storage Utils
    // -----------------------------------
    class StorageUtils {
        static sakura = 'sakura-workspace';
        static gpt = 'gpt-workspace';

        static _setData(key, data) {
            localStorage.setItem(key, JSON.stringify(data));
            window.dispatchEvent(new StorageEvent('storage', {
                key: key,
                newValue: JSON.stringify(data),
                url: window.location.href,
                storageArea: localStorage
            }));
        }

        static _getData(key) {
            let raw = localStorage.getItem(key);
            if (raw) {
                return JSON.parse(raw);
            }
            return { workers: [], jobs: [], uncompletedJobs: [] };
        }

        static addSakuraWorker(id, endpoint, amount = null, prevSegLength = 500, segLength = 500) {
            const total = amount ?? -1;
            let data = this._getData(this.sakura);

            function _dataInsert(id, endpoint, prevSegLength, segLength) {
                const worker = { id, endpoint, prevSegLength, segLength };
                const existingIndex = data.workers.findIndex(w => w.id === id);
                if (existingIndex !== -1) {
                    data.workers[existingIndex] = worker;
                } else {
                    data.workers.push(worker);
                }
            }
            if (total == -1) {
                _dataInsert(id, endpoint, prevSegLength, segLength);
            } else {
                for (let i = 1; i < total+1; i++) {
                    _dataInsert(id + i, endpoint, prevSegLength, segLength);
                }
            }
            this._setData(this.sakura, data);
        }

        static addGPTWorker(id, model, endpoint, key, amount = null) {
            const total = amount ?? -1;
            let data = this._getData(this.gpt);

            function _dataInsert(id, model, endpoint, key) {
                const worker = { id, type: 'api', model, endpoint, key };
                const existingIndex = data.workers.findIndex(w => w.id === id);
                if (existingIndex !== -1) {
                    data.workers[existingIndex] = worker;
                } else {
                    data.workers.push(worker);
                }
            }
            if (total == -1) {
                _dataInsert(id, model, endpoint, key);
            } else {
                for (let i = 1; i < total + 1; i++) {
                    _dataInsert(id + i, model, endpoint, key);
                }
            }
            this._setData(this.gpt, data);
        }

        static removeWorker(key, id) {
            let data = this._getData(key);
            data.workers = data.workers.filter(w => w.id !== id);
            this._setData(key, data);
        }

        static removeAllWorkers(key, exclude = []) {
            let data = this._getData(key);
            data.workers = data.workers.filter(w => exclude.includes(w.id));
            this._setData(key, data);
        }

        static addJob(key, task, description, createAt = Date.now()) {
            const job = { task, description, createAt };
            let data = this._getData(key);
            data.jobs.push(job);
            this._setData(key, data);
        }

        static getUncompletedJobs(key) {
            return this._getData(key).uncompletedJobs;
        }
    }

    // -----------------------------------
    // Main Toolbox
    // -----------------------------------
    class NTRToolBox {
        constructor() {
            this.configuration = this.loadConfiguration();
            this.keepActiveSet = new Set();
            this.headerMap = new Map();
            this._pollTimer = null;

            this._lastKeepRun = 0;
            this._lastVisRun = 0;

            this.buildGUI();
            this.attachGlobalKeyBindings();
            this.loadKeepStateAndStart();
            this.scheduleNextPoll();
        }

        static cloneDefaultModules() {
            return defaultModules.map(m => ({
                ...m,
                settings: m.settings ? m.settings.map(s => ({ ...s })) : [],
                _lastRun: 0
            }));
        }
        
        static DragHandler = class {
            constructor(panel, title) {
                this.panel = panel;
                this.title = title;
                this.dragging = false;
                this.offsetX = 0;
                this.offsetY = 0;
                this.init();
            }

            init() {
                this.title.addEventListener('mousedown', (e) => {
                    if (e.button !== 0) return;
                    // Disable transitions while dragging
                    this.panel.style.transition = 'none';
                    this.dragging = true;
                    this.offsetX = e.clientX - this.panel.offsetLeft;
                    this.offsetY = e.clientY - this.panel.offsetTop;
                    e.preventDefault();
                });

                document.addEventListener('mousemove', (e) => {
                    if (!this.dragging) return;
                    const newLeft = e.clientX - this.offsetX;
                    const newTop = e.clientY - this.offsetY;
                    this.panel.style.left = newLeft + 'px';
                    this.panel.style.top = newTop + 'px';
                    this.clampPosition();
                });

                document.addEventListener('mouseup', () => {
                    if (!this.dragging) return;
                    this.dragging = false;
                    // Re-enable transitions
                    this.panel.style.transition = 'width 0.3s ease, height 0.3s ease, top 0.3s ease, left 0.3s ease';
                    const rect = this.panel.getBoundingClientRect();
                    let left = rect.left;
                    let top = rect.top;
                    left = Math.min(Math.max(left, 0), window.innerWidth - rect.width);
                    top = Math.min(Math.max(top, 0), window.innerHeight - rect.height);
                    this.panel.style.left = left + 'px';
                    this.panel.style.top = top + 'px';
                    localStorage.setItem('ntr-panel-position', JSON.stringify({
                        left: this.panel.style.left,
                        top: this.panel.style.top
                    }));
                });
            }

            clampPosition() {
                const rect = this.panel.getBoundingClientRect();
                let left = parseFloat(this.panel.style.left) || 0;
                let top = parseFloat(this.panel.style.top) || 0;
                const maxLeft = window.innerWidth - rect.width;
                const maxTop = window.innerHeight - rect.height;
                if (left < 0) left = 0;
                if (top < 0) top = 0;
                if (left > maxLeft) left = maxLeft;
                if (top > maxTop) top = maxTop;
                this.panel.style.left = left + 'px';
                this.panel.style.top = top + 'px';
            }
        }

        loadConfiguration() {
            let stored;
            try {
                stored = JSON.parse(localStorage.getItem(CONFIG_STORAGE_KEY));
            } catch (e) { }
            if (!stored || stored.version !== CONFIG_VERSION) {
                const fresh = NTRToolBox.cloneDefaultModules();
                return { version: CONFIG_VERSION, modules: fresh };
            }
            const loaded = NTRToolBox.cloneDefaultModules();
            stored.modules.forEach(storedMod => {
                const defMod = loaded.find(m => m.name === storedMod.name);
                if (defMod) {
                    for (const k in storedMod) {
                        if (
                            defMod.hasOwnProperty(k) &&
                            typeof defMod[k] === typeof storedMod[k] &&
                            storedMod[k] !== undefined
                        ) {
                            defMod[k] = storedMod[k];
                        }
                    }
                }
            });
            if (loaded.length !== defaultModules.length) {
                const fresh = NTRToolBox.cloneDefaultModules();
                localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify({ version: CONFIG_VERSION, modules: fresh }));
                return { version: CONFIG_VERSION, modules: fresh };
            } else {
                const defNames = defaultModules.map(x => x.name).sort().join(',');
                const storedNames = loaded.map(x => x.name).sort().join(',');
                if (defNames !== storedNames) {
                    const fresh = NTRToolBox.cloneDefaultModules();
                    localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify({ version: CONFIG_VERSION, modules: fresh }));
                    return { version: CONFIG_VERSION, modules: fresh };
                }
            }
            // Reattach run
            loaded.forEach(m => {
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
            return { version: CONFIG_VERSION, modules: loaded };
        }

        saveConfiguration() {
            localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(this.configuration));
        }

        buildGUI() {
            this.panel = document.createElement('div');
            this.panel.id = 'ntr-panel';

            // restore from localStorage
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
            this.titleBar.innerHTML = 'NTR ToolBox ' + VERSION;

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
            leftInfo.textContent = IS_MOBILE
                ? '單擊執行 | ⚙️設定'
                : '左鍵執行/切換 | 右鍵設定';
            rightInfo.textContent = 'Author: TheNano(百合仙人)';
            this.infoBar.appendChild(leftInfo);
            this.infoBar.appendChild(rightInfo);
            this.panel.appendChild(this.infoBar);

            document.body.appendChild(this.panel);

            // set up drag
            this.dragHandler = new NTRToolBox.DragHandler(this.panel, this.titleBar);

            this.buildModules();

            setTimeout(() => {
                this.expandedWidth = this.panel.offsetWidth;
                this.expandedHeight = this.panel.offsetHeight;

                const wasMin = this.isMinimized;
                if (!wasMin) this.panel.classList.add('minimized');
                const h0 = this.panel.offsetHeight;
                if (!wasMin) this.panel.classList.remove('minimized');

                this.minimizedWidth = this.panel.offsetWidth;
                this.minimizedHeight = h0;
            }, 150);

            if (IS_MOBILE) {
                this.titleBar.addEventListener('click', e => {
                    if (!this.dragHandler.dragging) {
                        e.preventDefault();
                        this.setMinimizedState(!this.isMinimized);
                    }
                });
            } else {
                this.titleBar.addEventListener('contextmenu', e => {
                    e.preventDefault();
                    this.setMinimizedState(!this.isMinimized);
                });
            }
        }

        buildModules() {
            this.panelBody.innerHTML = '';
            this.headerMap.clear();

            this.configuration.modules.forEach(mod => {
                const container = document.createElement('div');
                container.className = 'ntr-module-container';

                const header = document.createElement('div');
                header.className = 'ntr-module-header';

                const nameSpan = document.createElement('span');
                nameSpan.textContent = mod.name;
                header.appendChild(nameSpan);

                if (!IS_MOBILE) {
                    const iconSpan = document.createElement('span');
                    iconSpan.textContent = (mod.type === 'keep') ? '⇋' : '▶';
                    iconSpan.style.marginLeft = '8px';
                    header.appendChild(iconSpan);
                }

                const settingsDiv = document.createElement('div');
                settingsDiv.className = 'ntr-settings-container';
                settingsDiv.style.display = 'none';

                if (IS_MOBILE) {
                    const btn = document.createElement('button');
                    btn.textContent = '⚙️';
                    btn.style.color = 'white';
                    btn.style.float = 'right';
                    btn.onclick = e => {
                        e.stopPropagation();
                        const styleVal = window.getComputedStyle(settingsDiv).display;
                        settingsDiv.style.display = (styleVal === 'none' ? 'block' : 'none');
                    };
                    header.appendChild(btn);

                    header.onclick = e => {
                        if (e.target.classList.contains('ntr-bind-button') || e.target === btn) return;
                        this.handleModuleClick(mod, header);
                    };
                } else {
                    header.oncontextmenu = e => {
                        e.preventDefault();
                        const styleVal = window.getComputedStyle(settingsDiv).display;
                        settingsDiv.style.display = (styleVal === 'none' ? 'block' : 'none');
                    };
                    header.onclick = e => {
                        if (e.button === 0 && !e.ctrlKey && !e.altKey && !e.shiftKey) {
                            if (e.target.classList.contains('ntr-bind-button')) return;
                            this.handleModuleClick(mod, header);
                        }
                    };
                }

                // Build settings
                if (Array.isArray(mod.settings)) {
                    mod.settings.forEach(s => {
                        const row = document.createElement('div');
                        row.style.marginBottom = '8px';

                        const label = document.createElement('label');
                        label.style.display = 'inline-block';
                        label.style.minWidth = '70px';
                        label.style.color = '#ccc';
                        label.textContent = s.name + ': ';
                        row.appendChild(label);

                        let inputEl;
                        switch (s.type) {
                            case 'boolean': {
                                inputEl = document.createElement('input');
                                inputEl.type = 'checkbox';
                                inputEl.checked = !!s.value;
                                inputEl.onchange = () => {
                                    s.value = inputEl.checked;
                                    this.saveConfiguration();
                                };
                                break;
                            }
                            case 'number': {
                                inputEl = document.createElement('input');
                                inputEl.type = 'number';
                                inputEl.value = s.value;
                                inputEl.className = 'ntr-number-input';
                                inputEl.onchange = () => {
                                    s.value = Number(inputEl.value) || 0;
                                    this.saveConfiguration();
                                };
                                break;
                            }
                            case 'select': {
                                inputEl = document.createElement('select');
                                if (Array.isArray(s.options)) {
                                    s.options.forEach(opt => {
                                        const optEl = document.createElement('option');
                                        optEl.value = opt;
                                        optEl.textContent = opt;
                                        if (opt === s.value) optEl.selected = true;
                                        inputEl.appendChild(optEl);
                                    });
                                }
                                inputEl.onchange = () => {
                                    s.value = inputEl.value;
                                    this.saveConfiguration();
                                };
                                break;
                            }
                            case 'string': {
                                if (s.name === 'bind') {
                                    inputEl = document.createElement('button');
                                    inputEl.className = 'ntr-bind-button';
                                    inputEl.textContent = (s.value === 'none') ? '(None)' : `[${s.value.toUpperCase()}]`;
                                    inputEl.onclick = () => {
                                        inputEl.textContent = '(Press any key)';
                                        const handler = ev => {
                                            ev.preventDefault();
                                            if (ev.key === 'Escape') {
                                                s.value = 'none';
                                                inputEl.textContent = '(None)';
                                            } else {
                                                s.value = ev.key.toLowerCase();
                                                inputEl.textContent = `[${ev.key.toUpperCase()}]`;
                                            }
                                            this.saveConfiguration();
                                            document.removeEventListener('keydown', handler, true);
                                            ev.stopPropagation();
                                        };
                                        document.addEventListener('keydown', handler, true);
                                    };
                                } else {
                                    inputEl = document.createElement('input');
                                    inputEl.type = 'text';
                                    inputEl.value = s.value;
                                    inputEl.className = 'ntr-input';
                                    inputEl.onchange = () => {
                                        s.value = inputEl.value;
                                        this.saveConfiguration();
                                    };
                                }
                                break;
                            }
                            default: {
                                inputEl = document.createElement('span');
                                inputEl.style.color = '#999';
                                inputEl.textContent = String(s.value);
                            }
                        }
                        row.appendChild(inputEl);
                        settingsDiv.appendChild(row);
                    });
                }

                container.appendChild(header);
                container.appendChild(settingsDiv);

                this.panelBody.appendChild(container);
                this.headerMap.set(mod, header);
            });
        }

        attachGlobalKeyBindings() {
            document.addEventListener('keydown', e => {
                if (e.ctrlKey || e.altKey || e.metaKey) return;
                const pk = e.key.toLowerCase();
                this.configuration.modules.forEach(mod => {
                    const bind = mod.settings.find(s => s.name === 'bind');
                    if (!bind || bind.value === 'none') return;
                    if (bind.value.toLowerCase() === pk) {
                        if (!isModuleEnabledByWhitelist(mod)) return;
                        e.preventDefault();
                        this.handleModuleClick(mod, null);
                    }
                });
            });
        }

        handleModuleClick(mod, header) {
            if (!domainAllowed || !isModuleEnabledByWhitelist(mod)) return;
            try {
                if (mod.type === 'onclick') {
                    if (typeof mod.run === 'function') {
                        Promise.resolve(mod.run(mod)).catch(console.error);
                    }
                } else if (mod.type === 'keep') {
                    const active = this.keepActiveSet.has(mod.name);
                    if (active) {
                        if (header) this.stopKeepModule(mod, header);
                    } else {
                        if (header) this.startKeepModule(mod, header);
                    }
                }
            } catch (err) {
                console.error('Error running module:', mod.name, err);
            }
        }

        startKeepModule(mod, header) {
            if (this.keepActiveSet.has(mod.name)) return;
            header.classList.add('active');
            this.keepActiveSet.add(mod.name);
            this.updateKeepStateStorage();
        }

        stopKeepModule(mod, header) {
            header.classList.remove('active');
            this.keepActiveSet.delete(mod.name);
            this.updateKeepStateStorage();
        }

        updateKeepStateStorage() {
            const st = {};
            this.keepActiveSet.forEach(n => {
                st[n] = true;
            });
            localStorage.setItem('NTR_KeepState', JSON.stringify(st));
        }

        loadKeepStateAndStart() {
            let saved = {};
            try {
                saved = JSON.parse(localStorage.getItem('NTR_KeepState') || '{}');
            } catch (e) { }
            this.configuration.modules.forEach(mod => {
                if (mod.type === 'keep' && saved[mod.name]) {
                    const hdr = this.headerMap.get(mod);
                    if (hdr) {
                        this.startKeepModule(mod, hdr);
                    }
                }
            });
        }

        scheduleNextPoll() {
            const now = Date.now();
            if (now - this._lastKeepRun >= 100) {
                this.pollKeepModules();
                this._lastKeepRun = now;
            }
            if (now - this._lastVisRun >= 250) {
                this.updateModuleVisibility();
                this._lastVisRun = now;
            }
            this._pollTimer = setTimeout(() => {
                this.scheduleNextPoll();
            }, 10);
        }

        pollKeepModules() {
            this.configuration.modules.forEach(mod => {
                if (mod.type === 'keep' && this.keepActiveSet.has(mod.name) && typeof mod.run === 'function') {
                    mod.run(mod);
                }
            });
        }

        runModule(name) {
            this.configuration.modules.filter(mod => mod.name == name).forEach(mod => {
                if (typeof mod.run === 'function') {
                    mod.run(mod);
                }
            });
        }

        updateModuleVisibility() {
            this.configuration.modules.forEach(mod => {
                const hdr = this.headerMap.get(mod);
                if (!hdr) return;
                const cont = hdr.parentElement;
                const allowed = domainAllowed && isModuleEnabledByWhitelist(mod);
                if (!allowed) {
                    cont.style.display = 'none';
                    if (mod.type === 'keep' && this.keepActiveSet.has(mod.name)) {
                        this.stopKeepModule(mod, hdr);
                    }
                } else {
                    cont.style.display = 'block';
                }
            });
        }

        getAnchorCornerInfo(rect) {
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;
            const horizontal = (centerX < window.innerWidth / 2) ? 'left' : 'right';
            const vertical = (centerY < window.innerHeight / 2) ? 'top' : 'bottom';
            return {
                corner: vertical + '-' + horizontal,
                x: (horizontal === 'left' ? rect.left : rect.right),
                y: (vertical === 'top' ? rect.top : rect.bottom)
            };
        }

        setMinimizedState(newVal) {
            if (this.isMinimized === newVal) return;
            const rect = this.panel.getBoundingClientRect();
            const anchor = this.getAnchorCornerInfo(rect);

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

            setTimeout(() => {
                const newRect = this.panel.getBoundingClientRect();
                let left, top;
                switch (anchor.corner) {
                    case 'top-left':
                        left = anchor.x;
                        top = anchor.y;
                        break;
                    case 'top-right':
                        left = anchor.x - newRect.width;
                        top = anchor.y;
                        break;
                    case 'bottom-left':
                        left = anchor.x;
                        top = anchor.y - newRect.height;
                        break;
                    case 'bottom-right':
                        left = anchor.x - newRect.width;
                        top = anchor.y - newRect.height;
                        break;
                    default:
                        left = parseFloat(this.panel.style.left) || newRect.left;
                        top = parseFloat(this.panel.style.top) || newRect.top;
                }
                // clamp to viewport
                left = Math.min(Math.max(left, 0), window.innerWidth - newRect.width);
                top = Math.min(Math.max(top, 0), window.innerHeight - newRect.height);
                this.panel.style.left = left + 'px';
                this.panel.style.top = top + 'px';
                localStorage.setItem('ntr-panel-position', JSON.stringify({
                    left: this.panel.style.left,
                    top: this.panel.style.top
                }));
            }, 310);
        }

        delay(ms) {
            return new Promise(r => setTimeout(r, ms));
        }
    }

    const css = document.createElement('style');
    css.textContent = `
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
    @media only screen and (max-width:600px) {
        #ntr-panel {
            transform: scale(0.6);
            transform-origin: top left;
        }
    }
    `;
    document.head.appendChild(css);

    // -----------------------------------
    // Start
    // -----------------------------------
    const script = new NTRToolBox();
    const storageUtil = new StorageUtils();
})();