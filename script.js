// ==UserScript==
// @name         NTR ToolBox
// @namespace    http://tampermonkey.net/
// @version      v0.1-20250222
// @author       
// @description  
// @match        https://books.fishhawk.top/*
// @match        https://books1.fishhawk.top/*
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    function createBooleanSetting(settingName, defaultValue) {
        return { name: settingName, type: 'boolean', value: Boolean(defaultValue) };
    }
    function createNumberSetting(settingName, defaultValue) {
        return { name: settingName, type: 'number', value: Number(defaultValue || 0) };
    }
    function createStringSetting(settingName, defaultValue) {
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

    const defaultModules = [
        {
            name: '添加翻譯器',
            settings: [
                createNumberSetting('數量', 5),
                createStringSetting('名稱', 'NTR translator '),
                createStringSetting('鏈接', 'https://127.0.0.1:8080'),
                createStringSetting('bind', 'none')
            ],
            run: function (moduleConfig) {
                const totalTranslators = getModuleSetting(moduleConfig, '數量') || 1;
                const namePrefix = getModuleSetting(moduleConfig, '名稱') || '';
                const translatorLink = getModuleSetting(moduleConfig, '鏈接') || '';
                function closeTranslatorTab() {
                    const closeButton = document.querySelector('button[aria-label="close"].n-base-close,button.n-base-close[aria-label="close"],button.n-base-close.n-base-close--absolute.n-card-header__close');
                    if (closeButton) closeButton.click();
                }
                function openAddTranslatorTab() {
                    const button = Array.prototype.slice.call(document.querySelectorAll('button.n-button')).find(btn => {
                        const text = (btn.querySelector('.n-button__content') || {}).textContent || '';
                        return text.trim().indexOf('添加翻译器') !== -1;
                    });
                    if (button) button.click();
                }
                let currentIndex = 1;
                function fillForm() {
                    const nameInput = document.querySelector('input.n-input__input-el[placeholder="给你的翻译器起个名字"]');
                    const linkInput = document.querySelector('input.n-input__input-el[placeholder="翻译器的链接"]');
                    const segmentInput = document.querySelectorAll('input.n-input__input-el[placeholder="请输入"]')[0];
                    const prefixInput = document.querySelectorAll('input.n-input__input-el[placeholder="请输入"]')[1];
                    const addButton = Array.prototype.slice.call(document.querySelectorAll('button.n-button.n-button--primary-type')).find(btn => {
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
                            setTimeout(() => {
                                openAddTranslatorTab();
                                setTimeout(fillForm, 100);
                            }, 200);
                        }
                    }
                }
                openAddTranslatorTab();
                setTimeout(fillForm, 100);
                setTimeout(closeTranslatorTab, 100);
            }
        },
        {
            name: '刪除翻譯器',
            settings: [
                createStringSetting('exclude', '共享,本机,AutoDL'),
                createStringSetting('bind', 'none')
            ],
            run: function (moduleConfig) {
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
        },
        {
            name: '啟動翻譯器',
            settings: [
                createNumberSetting('延遲間隔', 50),
                createStringSetting('bind', 'none')
            ],
            run: function (moduleConfig) {
                const delayInterval = getModuleSetting(moduleConfig, '延遲間隔') || 50;
                const allButtons = document.querySelectorAll('button');
                let buttonIndex = 0;
                function clickNextButton() {
                    if (buttonIndex >= allButtons.length) return;
                    const button = allButtons[buttonIndex];
                    buttonIndex++;
                    if (button.textContent.indexOf('启动') !== -1 || button.textContent.indexOf('啟動') !== -1) {
                        button.click();
                        setTimeout(clickNextButton, delayInterval);
                    } else {
                        clickNextButton();
                    }
                }
                clickNextButton();
            }
        }
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
            moduleConfig.run = ref => { defaultModule.run(ref); };
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
    panel.style.position = 'fixed';
    panel.style.left = '20px';
    panel.style.top = '70px';
    panel.style.zIndex = '9999';
    panel.style.background = '#1E1E1E';
    panel.style.color = '#BBB';
    panel.style.padding = '8px';
    panel.style.borderRadius = '8px';
    panel.style.fontFamily = 'Arial,sans-serif';
    panel.style.width = '320px';
    panel.style.boxShadow = '2px 2px 12px rgba(0,0,0,0.5)';
    panel.style.border = '1px solid #333';

    let dragging = false, dragOffsetX = 0, dragOffsetY = 0;
    function handleMouseDown(e) { dragging = true; dragOffsetX = e.clientX - panel.offsetLeft; dragOffsetY = e.clientY - panel.offsetTop; e.preventDefault(); }
    function handleMouseMove(e) { if (!dragging) return; panel.style.left = (e.clientX - dragOffsetX) + 'px'; panel.style.top = (e.clientY - dragOffsetY) + 'px'; }
    function handleMouseUp() { dragging = false; }
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    const titleBarDiv = document.createElement('div');
    titleBarDiv.textContent = 'NTR ToolBox';
    titleBarDiv.style.fontWeight = 'bold';
    titleBarDiv.style.padding = '10px';
    titleBarDiv.style.cursor = 'move';
    titleBarDiv.style.background = '#292929';
    titleBarDiv.style.borderRadius = '6px';
    titleBarDiv.style.color = '#CCC';
    titleBarDiv.addEventListener('mousedown', handleMouseDown);
    panel.appendChild(titleBarDiv);

    const panelBody = document.createElement('div');
    panelBody.style.padding = '6px';
    panelBody.style.background = '#232323';
    panelBody.style.borderRadius = '4px';
    panel.appendChild(panelBody);

    activeModules.forEach(moduleItem => {
        const moduleContainer = document.createElement('div');
        moduleContainer.style.marginBottom = '12px';
        moduleContainer.style.border = '1px solid #444';
        moduleContainer.style.borderRadius = '4px';

        const moduleHeader = document.createElement('div');
        moduleHeader.style.display = 'flex';
        moduleHeader.style.alignItems = 'center';
        moduleHeader.style.justifyContent = 'space-between';
        moduleHeader.style.background = domainAllowed ? '#2E2E2E' : '#252525';
        moduleHeader.style.padding = '6px 8px';
        moduleHeader.style.borderRadius = '3px 3px 0 0';
        moduleHeader.style.borderBottom = '1px solid #333';
        moduleHeader.style.cursor = domainAllowed ? 'pointer' : 'default';
        if (!domainAllowed) moduleHeader.style.opacity = '0.6';

        const nameSpan = document.createElement('span');
        nameSpan.textContent = moduleItem.name;
        moduleHeader.appendChild(nameSpan);

        const launchIcon = document.createElement('span');
        launchIcon.textContent = '▶';
        launchIcon.style.marginLeft = '8px';
        moduleHeader.appendChild(launchIcon);

        const moduleSettingsContainer = document.createElement('div');
        moduleSettingsContainer.style.padding = '6px';
        moduleSettingsContainer.style.background = '#1C1C1C';
        moduleSettingsContainer.style.display = 'none';

        moduleHeader.oncontextmenu = function (e) {
            e.preventDefault();
            moduleSettingsContainer.style.display = moduleSettingsContainer.style.display === 'none' ? 'block' : 'none';
        };
        moduleHeader.onclick = function (e) {
            if (e.button === 0 && !e.ctrlKey && !e.altKey && !e.shiftKey && domainAllowed) {
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
                    inputElement.style.width = '60px';
                    inputElement.onchange = function () {
                        setting.value = Number(inputElement.value) || 0;
                        saveConfiguration(configuration);
                    };
                } else if (setting.type === 'string' && setting.name === 'bind') {
                    inputElement = document.createElement('button');
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
                    inputElement.style.width = '120px';
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

    document.body.appendChild(panel);
})();