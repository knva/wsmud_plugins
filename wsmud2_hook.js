// ==UserScript==
// @name         WebSocket Hook for wsmud
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  A modern WebSocket hook for wsmud.com and wsmud2.com
// @author       Gemini
// @match        http://*.wsmud2.com/*
// @match        http://*.wamud.com/*
// @run-at       document-start
// @grant        unsafeWindow
// @grant        GM_addStyle
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_listValues
// @grant        GM_setClipboard
// @grant        GM_deleteValue
// @grant        GM_registerMenuCommand
// @require      https://s4.zstatic.net/ajax/libs/jquery/3.3.1/jquery.min.js
// @require      https://s4.zstatic.net/ajax/libs/store.js/2.0.12/store.modern.min.js
// @require      https://s4.zstatic.net/ajax/libs/jquery-contextmenu/3.0.0-beta.2/jquery.contextMenu.min.js
// ==/UserScript==

(function () {
    'use strict';

    // A class to manage all WebSocket hooks.
    class WebSocketHookManager {
        constructor() {
            this.hooks = [];
            this.hookIndex = 0;
            this.originalWebSocket = unsafeWindow.WebSocket;
            this.ws = null;
            this.originalWsOnMessage = null;
        }

        /**
         * Replaces the native WebSocket with a custom one to intercept messages.
         * This method must be called before the game's WebSocket connection is established.
         */
        hookWebSocket() {
            const self = this;
            const originalPrototype = self.originalWebSocket.prototype;

            unsafeWindow.WebSocket = function (uri) {
                // The actual WebSocket instance is created here.
                self.ws = new self.originalWebSocket(uri);
            };

            // It's crucial to correctly define the prototype to ensure all methods
            // and properties are exposed, allowing the game to interact with it properly.
            unsafeWindow.WebSocket.prototype = {
                // Expose WebSocket constants
                CONNECTING: originalPrototype.CONNECTING,
                OPEN: originalPrototype.OPEN,
                CLOSING: originalPrototype.CLOSING,
                CLOSED: originalPrototype.CLOSED,

                // Proxy native WebSocket properties.
                get url() { return self.ws.url; },
                get protocol() { return self.ws.protocol; },
                get readyState() { return self.ws.readyState; },
                get bufferedAmount() { return self.ws.bufferedAmount; },
                get extensions() { return self.ws.extensions; },
                get binaryType() { return self.ws.binaryType; },
                set binaryType(t) { self.ws.binaryType = t; },

                get onopen() { return self.ws.onopen; },
                set onopen(fn) { self.ws.onopen = fn; },
                get onclose() { return self.ws.onclose; },
                set onclose(fn) { self.ws.onclose = fn; },
                get onerror() { return self.ws.onerror; },
                set onerror(fn) { self.ws.onerror = fn; },

                // Handle the onmessage property with our custom logic.
                get onmessage() { return self.originalWsOnMessage; },
                set onmessage(fn) {
                    // Store the game's original onmessage handler for later use.
                    self.originalWsOnMessage = fn;
                    // Overwrite the real WebSocket's onmessage with our custom handler.
                    // This is where our message interception begins.
                    self.ws.onmessage = self.receiveMessage.bind(self);
                },

                // Proxy native WebSocket methods.
                send: function (data) {
                    self.ws.send(data);
                },
                close: function () {
                    self.ws.close();
                }
            };

            console.log('Custom WebSocket has been hooked with prototype properly defined.');
        }

        /**
         * The new `onmessage` handler for the WebSocket. It intercepts the data,
         * processes it, and then passes it to all registered hooks and the original handler.
         * @param {MessageEvent} message The message event from the WebSocket.
         */
        receiveMessage(message) {
            if (!message || !message.data) return;

            let parsedData;
            try {
                // Attempt to parse the message data as JSON.
                if (message.data[0] === '{' || message.data[0] === '[') {
                    // Use new Function() to parse the potentially malformed JSON.
                    const func = new Function("return " + message.data + ";");
                    parsedData = func();
                } else {
                    // If it's not JSON, treat it as plain text.
                    parsedData = { type: 'text', msg: message.data };
                }
            } catch (e) {
                console.error('Failed to parse WebSocket message data:', e);
                // In case of a parsing error, still pass the raw data.
                parsedData = { type: 'text', msg: message.data };
            }

            // Run all registered hooks with the parsed data.
            this.runHooks(parsedData.type, parsedData);

            // Finally, call the original onmessage handler so the game functions as expected.
            if (this.originalWsOnMessage) {
                this.originalWsOnMessage.call(this.ws, message);
            }
        }

        /**
         * Registers a new hook function to be called for specific message types.
         * @param {string|string[]} types The message type(s) to listen for (e.g., 'text', ['dialog', 'items']).
         * @param {Function} callback The function to execute when a message of the specified type arrives.
         * @returns {number} The index of the new hook, which can be used to remove it.
         */
        addHook(types, callback) {
            const hook = {
                index: this.hookIndex++,
                types: Array.isArray(types) ? types : [types],
                callback: callback
            };
            this.hooks.push(hook);
            return hook.index;
        }

        /**
         * Removes a previously registered hook.
         * @param {number} hookIndex The index returned by `addHook`.
         */
        removeHook(hookIndex) {
            this.hooks = this.hooks.filter(hook => hook.index !== hookIndex);
        }

        /**
         * Executes all registered hooks that match the given message type.
         * @param {string} type The type of the incoming message.
         * @param {object} data The parsed message data.
         */
        runHooks(type, data) {
            for (const hook of this.hooks) {
                if (hook.types.includes(type)) {
                    try {
                        hook.callback(data);
                    } catch (e) {
                        console.error(`Error in hook for type "${type}":`, e);
                    }
                }
            }
        }

        /**
         * Sends a custom command to the server.
         * @param {string} command The command string to send.
         */
        sendCmd(command) {
            if (typeof command === 'string' && command.includes(';')) {
                // 如果命令包含分号，则将其视为多个命令，逐个发送
                const commands = command.split(';');
                commands.forEach(cmd => {
                    const trimmedCmd = cmd.trim();
                    if (trimmedCmd) {
                        if (this.ws && this.ws.readyState === this.ws.OPEN) {
                            this.ws.send(trimmedCmd);
                            console.log(`Command sent: ${trimmedCmd}`);
                        } else {
                            console.warn('WebSocket connection is not open. Command not sent.');
                        }
                    }
                });
            } else {
                // 单条命令的处理逻辑保持不变
                if (this.ws && this.ws.readyState === this.ws.OPEN) {
                    this.ws.send(command);
                    console.log(`Command sent: ${command}`);
                } else {
                    console.warn('WebSocket connection is not open. Command not sent.');
                }
            }
        }
    }

    // Empty WG class to be compatible with other scripts
    class WG {
        constructor(webSocketManager) {
            this.wsManager = webSocketManager;
            // Initialize with empty methods to prevent errors in other scripts
            this.hooks = [];
            this.hookIndex = 0;
        }

        // Empty implementations of commonly used methods
        static add_hook(types, callback) {
            console.log('WG.add_hook called with:', types);
            return unsafeWindow.WG_wsManager.addHook(types, callback);
        }

        static remove_hook(hookIndex) {
            console.log('WG.remove_hook called with:', hookIndex);
            return unsafeWindow.WG_wsManager.removeHook(hookIndex);
        }

        static SendCmd(command) {
            console.log('WG.SendCmd called with:', command);
            return unsafeWindow.sendCmd(command);
        }

        // Placeholder methods for compatibility
        static stopAllAuto() {
            console.log('WG.stopAllAuto called');
        }

        static reSetAllAuto() {
            console.log('WG.reSetAllAuto called');
        }

        static sm_button() {
            console.log('WG.sm_button called');
        }

        static clean_all() {
            console.log('WG.clean_all called');
        }
    }

    // A class to manage game logic
    class GameLogicManager {
        constructor(webSocketManager) {
            this.wsManager = webSocketManager;
            this.uiAdded = false;
            this.places = new Map();
            this.roomPlayers = new Map();
            this.goods = {
                "米饭": { "id": null, "type": "wht", "sales": "店小二", "place": "扬州城-醉仙楼" },
                "包子": { "id": null, "type": "wht", "sales": "店小二", "place": "扬州城-醉仙楼" },
                "鸡腿": { "id": null, "type": "wht", "sales": "店小二", "place": "扬州城-醉仙楼" },
                "面条": { "id": null, "type": "wht", "sales": "店小二", "place": "扬州城-醉仙楼" },
                "扬州炒饭": { "id": null, "type": "wht", "sales": "店小二", "place": "扬州城-醉仙楼" },
                "米酒": { "id": null, "type": "wht", "sales": "店小二", "place": "扬州城-醉仙楼" },
                "花雕酒": { "id": null, "type": "wht", "sales": "店小二", "place": "扬州城-醉仙楼" },
                "女儿红": { "id": null, "type": "wht", "sales": "店小二", "place": "扬州城-醉仙楼" },
                "醉仙酿": { "id": null, "type": "hig", "sales": "店小二", "place": "扬州城-醉仙楼" },
                "神仙醉": { "id": null, "type": "hiy", "sales": "店小二", "place": "扬州城-醉仙楼" },
                "布衣": { "id": null, "type": "wht", "sales": "杂货铺老板 杨永福", "place": "扬州城-杂货铺" },
                "钢刀": { "id": null, "type": "wht", "sales": "杂货铺老板 杨永福", "place": "扬州城-杂货铺" },
                "木棍": { "id": null, "type": "wht", "sales": "杂货铺老板 杨永福", "place": "扬州城-杂货铺" },
                "英雄巾": { "id": null, "type": "wht", "sales": "杂货铺老板 杨永福", "place": "扬州城-杂货铺" },
                "布鞋": { "id": null, "type": "wht", "sales": "杂货铺老板 杨永福", "place": "扬州城-杂货铺" },
                "铁戒指": { "id": null, "type": "wht", "sales": "杂货铺老板 杨永福", "place": "扬州城-杂货铺" },
                "簪子": { "id": null, "type": "wht", "sales": "杂货铺老板 杨永福", "place": "扬州城-杂货铺" },
                "长鞭": { "id": null, "type": "wht", "sales": "杂货铺老板 杨永福", "place": "扬州城-杂货铺" },
                "钓鱼竿": { "id": null, "type": "wht", "sales": "杂货铺老板 杨永福", "place": "扬州城-杂货铺" },
                "鱼饵": { "id": null, "type": "wht", "sales": "杂货铺老板 杨永福", "place": "扬州城-杂货铺" },
                "铁剑": { "id": null, "type": "wht", "sales": "铁匠铺老板 铁匠", "place": "扬州城-打铁铺" },
                "钢刀": { "id": null, "type": "wht", "sales": "铁匠铺老板 铁匠", "place": "扬州城-打铁铺" },
                "铁棍": { "id": null, "type": "wht", "sales": "铁匠铺老板 铁匠", "place": "扬州城-打铁铺" },
                "铁杖": { "id": null, "type": "wht", "sales": "铁匠铺老板 铁匠", "place": "扬州城-打铁铺" },
                "铁镐": { "id": null, "type": "wht", "sales": "铁匠铺老板 铁匠", "place": "扬州城-打铁铺" },
                "飞镖": { "id": null, "type": "wht", "sales": "铁匠铺老板 铁匠", "place": "扬州城-打铁铺" },
                "金创药": { "id": null, "type": "hig", "sales": "药铺老板 平一指", "place": "扬州城-药铺" },
                "引气丹": { "id": null, "type": "hig", "sales": "药铺老板 平一指", "place": "扬州城-药铺" },
            };
            this.npcs = {
                "店小二": null,
                "杂货铺老板 杨永福": null,
                "铁匠铺老板 铁匠": null,
                "药铺老板 平一指": null,
            };

            // This object will hold global game state information
            this.gameState = {
                exits: new Map(),
                isallow: true
            };
            this.currentRoom = null; // 添加当前房间名的全局变量
            this.role = null; // 添加角色信息
            this.skills = null;
            // 监听 'login' 消息，在成功登录后执行 addUI
            this.wsManager.addHook('login', this.handleLogin.bind(this));
            this.wsManager.addHook('exits', this.handleExits.bind(this));
            this.wsManager.addHook('combat', this.handleCombat.bind(this));
            this.wsManager.addHook(['items', 'itemadd'], this.handleItems.bind(this));
            this.wsManager.addHook('room', this.handleRoom.bind(this)); // 添加对room消息的处理
            this.wsManager.addHook('dialog', this.handleDialog.bind(this)); // 添加对dialog消息的处理
            this.wsManager.addHook('text', this.handleText.bind(this));
            this.wsManager.addHook(['dialog', 'text'], this.handleTasks.bind(this)); // 添加对tasks对话框的处理
            this.wsManager.addHook('perform', this.handlePerform.bind(this)); // 添加对tasks对话框的处理
            //cleardistime
            this.wsManager.addHook('cleardistime', this.handleClearDistime.bind(this));
            //dispfm
            this.wsManager.addHook('dispfm', this.handleDispfm.bind(this));
            //combat
            this.wsManager.addHook('combat', this.handleCombat.bind(this));
        }
        init() {
            $("li[command=SelectRole]").on("click", this.login.bind(this));
        }
        handlePerform(data) {

            this.skills = data.skills;
        }
        handleClearDistime(data) {
            this.cds.forEach(function (v, k) {
                this.cds.set(k, false);
            });
        }
        handleDispfm(data) {
            if (data.id) {
                if (data.distime) { }
                this.cds.set(data.id, true);
                var _id = data.id;
                setTimeout(() => {
                    this.cds.set(_id, false);

                }, data.distime);
            }
            if (data.rtime) {
                if (this.gcd) {
                    clearTimeout(this.gcdThread);
                }
                this.gcd = true;
                this.gcdThread = setTimeout(() => {
                    this.gcd = false;
                }, data.rtime);
            }
        }
        handleCombat(data) {
            if (data.start) {
                this.in_fight = true;
                //battletime = new Date();
                this.auto_preform();
            }
            if (data.end) {
                this.in_fight = false;
                this.auto_preform("stop");
            }
        }

        handleTasks(data) {
            // 处理tasks对话框
            if (data.dialog === 'tasks' && data.items) {
                // 查找yamen2任务且state为1的情况
                const yamenTask = data.items.find(item => item.id === 'yamen2' && item.state === 1);
                if (yamenTask) {
                    // 提取地点信息
                    const desc = yamenTask.desc;
                    // 使用正则表达式匹配地点，如"最近在武当派-朝天宫出现过"
                    const locationMatch = desc.match(/最近在([^，。]+)出现过/);
                    const npcMatch = desc.match(/追杀逃犯：([^，。]+)，据说/);
                    if (locationMatch && locationMatch[1] && npcMatch && npcMatch[1]) {
                        const location = locationMatch[1];
                        const npcName = npcMatch[1];
                        // 调用addBtnMsgContent函数添加按钮
                        this.messageAppendToContentMessage(`逃犯名：${npcName}`);
                        this.addBtnMsgContent(`$goto ${location}`, `一键前往 ${location}`);
                    }
                }
            }
            if (data.type === 'text') {
                //text 程药发对你说道：这位小兄弟，你还没加入衙门吧，这样，你去除掉诸葛蓉滢，我就收了你，听说他最近在逍遥派-木屋出现过。
                if (data.msg.includes("程药发对你说道") && data.msg.includes("最近在")) {
                    const locationMatch = data.msg.match(/最近在([^，。]+)出现过/);
                    if (locationMatch && locationMatch[1]) {
                        const location = locationMatch[1];
                        // 调用addBtnMsgContent函数添加按钮
                        this.addBtnMsgContent(`$goto ${location}`, `一键前往 ${location}`);
                    }
                }
                if (data.msg.includes("程药发对你说道：你不是在追捕吗？ 好好干。")) {
                    this.sendCmd("tasks")
                }
            }
        }

        handleDialog(data) {
            // 处理score对话框，获取角色信息
            if (data.dialog === 'score') {
                if (!this.uiAdded) {
                    setTimeout(() => {
                        this.doCommand("score");
                    }, 300);
                    // 清理名字中的HTML标签和特殊字符，如<hig>&lt;挖矿中&gt;</hig> 
                    let cleanName = data.name.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/<[^>]+>/g, '').trim();
                    this.role = {
                        name: cleanName,
                        family: data.family,
                        level: data.level
                    };
                    // 设置网页标题
                    if (this.role) {

                        document.title = this.role.name + "-MUD游戏-武神传说2";

                        this.addUI();
                        this.uiAdded = true;

                    }
                }

            }
        }
        initStyle2Game() {
            // 添加超新星特效CSS
            const supernovaCSS = `
                    /* 超新星特效的CSS样式 */
                    .supernova-text {
                        position: relative !important; /* 使用!important提高优先级 */
                        font-family: "Microsoft YaHei", "微软雅黑", sans-serif;
                        font-weight: bold;
                        font-size: 16px; /* 默认大小，可以根据目标网页调整 */
                        letter-spacing: 2px;
                        color: transparent !important; /* 确保文字本体透明 */
                        
                        /* [核心修改] 将这些不参与动画的属性移到这里 */
                        background: linear-gradient(90deg, #f0f, #0ff, #ff0, #f0f);
                        background-size: 300% 300%;
                        -webkit-background-clip: text;
                        background-clip: text;

                        /* [核心修改] 动画现在只负责一件事：移动背景位置 */
                        animation: text-flow 6s linear infinite;
                    }

                    /* --- 动画关键帧定义 --- */

                    /* 动画1: 文字本体的流动彩虹效果 (简化且更稳定) */
                    @keyframes text-flow {
                        0% {
                            /* 动画开始时背景的位置 */
                            background-position: 0% 50%;
                        }
                        100% {
                            /* 动画结束时背景的位置 */
                            background-position: 300% 50%;
                        }
                    }
                `;
            GM_addStyle(supernovaCSS);

            // 添加玩家名称高亮CSS样式
            const playerHighlightCSS = `
                /* 炫酷的动态高亮效果CSS */
             
                
                @keyframes highlight-gradient {
                    0% {
                        background-position: 0% 50%;
                    }
                    100% {
                        background-position: 100% 50%;
                    }
                }
                
                .high-light-name {
                    animation:  highlight-gradient 5s infinite;
                    background: linear-gradient(45deg, #00ffff, #ff00ff, #ffff00, #00ffff);
                    background-size: 200% 200%;
                    -webkit-background-clip: text;
                    background-clip: text;
                    -webkit-text-fill-color: transparent;
                    font-weight: bold;
                }
            `;
            GM_addStyle(playerHighlightCSS);

            // Add custom CSS styles
            const customCSS = `
                .WG_button {
                   width: calc(100% - 50px); 
                   overflow-x: auto;
                   display: block;
                   line-height:2em;
                    justify-content: flex-start;
                    padding: 10px 0;
                }
                .zdy-item {
                    display: inline-block;
                    border: solid 1px gray;
                    color: gray;
                    background-color: black;
                    text-align: center;
                    cursor: pointer;
                    border-radius: 0.5em;
                    min-width: 2.5em;
                    margin-right: 0.1em;
                    position: relative;
                    padding-left: 0.3em;
                    padding-right: 0.3em;
                    margin-bottom: 2px;
                    transition: background-size 0.2s linear;
                    background: linear-gradient(to top, rgba(128, 128, 128, 0.5) 0%, rgba(128, 128, 128, 0.5) 100%);
                    background-size: 0% 100%;
                    background-position: 100% 100%;
                    background-repeat: no-repeat;
                }
                .zdy-item:hover {
                    background-size: 100% 100%;
                }
                .plugin_setting-item  {
                    margin-top: 0.625em;
                    margin-bottom: 0.625em;
                    margin-left: 0.625em;
                }
                .plugin_switch {
                    display: inline-block;
                    position: relative;
                    height: 1.25em;
                    width: 3.125em;
                    line-height: 1.25em;
                    border-radius: 0.875em;
                    background: #dedede;
                    cursor: pointer;
                    -ms-user-select: none;
                    -moz-user-select: none;
                    -webkit-user-select: none;
                    user-select: none;
                    vertical-align: middle;
                    text-align: center;
                }
                    .plugin_switch>.plugin_switch-button {
                    position: absolute;
                    left: 0px;
                    height: 1.25em;
                    width: 1.25em;
                    border-radius: 0.875em;
                    background: #fff;
                    box-shadow: 0 0 5px rgba(0, 0, 0, 0.2);
                    transition: 0.3s;
                    -webkit-transition: 0.3s;
                    left: 0px;
                }

                .plugin_switch>.plugin_switch-text {
                    color: #898989;
                    margin-left: 0.625em;
                }
                    .plugin_on {
                    background-color: #008000;
                }

                .plugin_on>.plugin_switch-button {
                    right: 0px;
                    left: auto;
                }

                .plugin_on>.plugin_switch-text {
                    margin-right: 0.625em;
                    margin-left: 0px;
                    color: white;
                }

                .plugin_settings>h3 {
                    color: #C0C0C0;
                    padding-left: 0.625em;
                    border-bottom: 1px solid #343434;
                    padding-bottom: 0.5em;
                }
                #raidToolbar,
                #raidToolbar * {
                    box-sizing: content-box;
                }

                .WG_log,
                .WG_log * {
                    box-sizing: content-box;
                }
            `;
            GM_addStyle(customCSS);
        }

        /**
         * 在房间中高亮显示指定玩家名称
         * @param {string} playerNameList 玩家名称列表
         */
        highlightPlayerInRoom(playerNameList) {
            const selector = '.room_items .room-item .item-name';
            const timeout = 3000; // 超时时间，3秒
            const startTime = Date.now();

            const checkAndHighlight = () => {
                const elements = $(selector);

                // 如果元素已存在且有内容，则执行高亮逻辑
                if (elements.length > 0 && elements.first().text().trim().length > 0) {
                    elements.each(function () {
                        const itemNameElement = $(this);
                        const itemText = itemNameElement.text();
                        const cleanItemText = itemText.replace(/<[^>]+>/g, '').trim();

                        // 检查清理后的玩家名是否在传入的列表中
                        // 使用 some() 方法判断 cleanItemText 是否包含列表中的任一玩家名
                        if (playerNameList.some(name => cleanItemText.includes(name))) {
                            itemNameElement.addClass('high-light-name');
                        }
                    });
                    return; // 任务完成，退出
                }

                // 如果未超时，则继续等待
                if (Date.now() - startTime < timeout) {
                    setTimeout(checkAndHighlight, 20); // 每隔20毫秒检查一次
                } else {
                    console.warn('Timeout: Player list not found or is empty.');
                }
            };

            checkAndHighlight();
        }
        /**
         * 检查房间中的玩家并高亮显示自己的名称
         */
        checkAndHighlightPlayer() {
            // 检查是否启用了高亮功能
            const isHighlightEnabled = GM_getValue('highlightPlayerName', true);
            if (!isHighlightEnabled) {
                // 如果未启用高亮功能，则移除已有的高亮
                $('.room_items .room-item .item-name').removeClass('high-light-name');
                return;
            }

            const timeout = 5000; // 超时时间，5秒
            const startTime = Date.now();

            const checkRoleAndHighlight = () => {
                // 如果 this.role 及其 name 属性已存在
                if (this.role && this.role.name) {
                    // 延迟执行以确保DOM已更新
                    setTimeout(() => {
                        this.highlightPlayerInRoom([this.role.name]);
                    }, 100);
                    return; // 任务完成，退出循环
                }

                // 如果未超时，则继续等待
                if (Date.now() - startTime < timeout) {
                    setTimeout(checkRoleAndHighlight, 100); // 每隔100毫秒检查一次
                } else {
                    // 超时处理
                    console.warn('Timeout: Role data not available within 5 seconds.');
                }
            };

            checkRoleAndHighlight();
        }
        /**
         * 智能地监控一个区域（DOM 元素），当区域内的内容发生变化时，执行指定的回调函数。
         * * @param {string} selector 要监控的 DOM 元素选择器，比如 '.room_items'。
         * @param {Function} callback 当 DOM 变化时要执行的函数。
         */
        watchDOMChanges(selector, callback) {
            // 找到你要监控的那个区域
            const targetNode = document.querySelector(selector);

            // 如果区域没找到，就报错
            if (!targetNode) {
                console.error(`错误：没有找到目标元素 "${selector}"。`);
                return;
            }

            // 设置监控规则：我们只关心子节点的添加或移除
            const config = {
                childList: true,
                subtree: true
            };

            // 实例化一个监控器，并告诉它一旦有变化，就调用 callback 函数
            const observer = new MutationObserver(callback);

            // 开始监控这个区域
            observer.observe(targetNode, config);

            // 返回监控器实例，这样你以后可以随时停止监控
            return observer;
        }

        async handleRoomItemsUpdate() {
            // console.log('玩家列表更新了！');
            // 在这里执行你的高亮逻辑或其他操作
            // 比如：this.highlightPlayerInRoom(this.role.name); 
            this.checkAndHighlightPlayer()
        }

        async login() {
            if (!this.uiAdded) {
                const roomItemsObserver = this.watchDOMChanges('.room_items', this.handleRoomItemsUpdate.bind(this));

                this.initStyle2Game()
                this.initPlaces();

                // 添加设置UI
                this.addSettingUI();


            }
        }
        async handleLogin(data) {
            // 确保 UI 只被添加一次
            this.doCommand("showtool");
            this.doCommand("showcombat");
            this.doCommand("score");

            // 添加背景图片设置
            const backimageurl = GM_getValue('backimageurl', '');
            if (backimageurl != '') {
                GM_addStyle(`body{background-color:rgba(0,0,0,.25) !important;}
                    div{ opacity:1;}
                    html{background:rgba(255,255,255,0.25) !important;
                    background-image:url('${backimageurl}') !important;
                    background-repeat:no-repeat !important;
                    background-size:100% 100% !important;
                    -moz-background-size:100% 100% !important;}
                    `);
            }

        }

        handleRoom(data) {
            // 保存当前房间名称
            this.currentRoom = data.name;
        }

        handleExits(data) {
            this.gameState.exits.clear();
            for (const direction in data.items) {
                this.gameState.exits.set(direction, data.items[direction]);
            }
        }


        handleItems(data) {
            if (data.items) {
                this.roomPlayers.clear();
                data.items.forEach(item => {
                    if (item && item.id && item.name) {
                        const chineseNameMatch = item.name;
                        if (chineseNameMatch) {
                            this.roomPlayers.set(chineseNameMatch, item);
                            // Populate the npcs map for shopkeepers
                            for (const npcName in this.npcs) {
                                if (chineseNameMatch.includes(npcName)) {
                                    this.npcs[npcName] = item.id;
                                }
                            }
                        }
                    }
                });
            }
            //{"type":"itemadd",id:"s1hgfb35295",name:"华山派第十五代弟子 尤骢",p:1,mp:30,hp:37,max_mp:100,max_hp:318,status:[]}
            if (data.type === 'itemadd') {
                this.roomPlayers.set(data.name, data);
                // Populate the npcs map for shopkeepers
                for (const npcName in this.npcs) {
                    if (data.name.includes(npcName)) {
                        this.npcs[npcName] = data.id;
                    }
                }
            }
        }
        async handleText(data) {
            //你身上没有挖矿工具 
            if (data.msg.includes("你身上没有挖矿工具")) {
                // 购买
                await this.buyItem("扬州城-打铁铺", "铁匠铺老板 铁匠", ["铁镐"])
                await unsafeWindow.sleep(200)
                this.sendCmd("goto kuang")
            }
            // 正则提取技能名称，设置cd
            // 你的内力不够，无法使用【重击】
            if (data.msg.match(/你的内力不够，无法使用【(.*?)】/)) {
                const skillName = data.msg.match(/你的内力不够，无法使用【(.*?)】/)[1]
                //从 this.skills 中找到技能id
                const skillId = this.skills.find(skill => skill.name === skillName).id
                this.cds.set(skillId, 2000)
                setTimeout(() => {
                    this.cds.set(skillId, 0)
                }, 2000);
            }
        }
        /**
         * 根据名称获取玩家ID，等待最多10秒直到找到对应的ID
         * @param {string} name 玩家名称
         * @returns {Promise<string|null>} 玩家ID或null
         */
        async getPlayerIdByName(name) {
            const startTime = Date.now();
            const timeout = 10000; // 10秒超时
            const interval = 100; // 每100毫秒检查一次

            while (Date.now() - startTime < timeout) {
                const id = this.roomPlayers.get(name).id;
                if (id) {
                    return id;
                }
                // 等待100毫秒后再次检查
                await new Promise(resolve => setTimeout(resolve, interval));
            }

            // 超时返回null
            return null;
        }

        /**
         * Tries to find and click a button with the given command attribute.
         * Falls back to sending the command via WebSocket if the button is not found.
         * @param {string} command The command string to execute.
         */
        doCommand(command) {
            const button = $(`[command="${command}"]`);
            if (button.length) {
                button.click();
            } else {
                this.sendCmd(command);
            }
        }

        async cmdToPlayer(cmd, name) {
            this.sendCmd(cmd + " " + await this.getPlayerIdByName(name))
        }

        initPlaces() {
            const places = {
                "住房": "jh fam 0 start;go west;go west;go north;go enter",
                "住房-卧室": "jh fam 0 start;go west;go west;go north;go enter;go north;store",
                "住房-小花园": "jh fam 0 start;go west;go west;go north;go enter;go northeast",
                "住房-炼药房": "jh fam 0 start;go west;go west;go north;go enter;go east",
                "住房-练功房": "jh fam 0 start;go west;go west;go north;go enter;go west",
                "扬州城-钱庄": "jh fam 0 start;go north;go west;store",
                "扬州城-广场": "jh fam 0 start",
                "扬州城-书院": "jh fam 0 start;go east;go north",
                "扬州城-醉仙楼": "jh fam 0 start;go north;go north;go east",
                "扬州城-杂货铺": "jh fam 0 start;go east;go south",
                "扬州城-打铁铺": "jh fam 0 start;go east;go east;go south",
                "扬州城-药铺": "jh fam 0 start;go east;go east;go north",
                "扬州城-衙门正厅": "jh fam 0 start;go west;go north;go north",
                "扬州城-镖局正厅": "jh fam 0 start;go west;go west;go south;go south",
                "扬州城-矿山": "jh fam 0 start;go west;go west;go west;go west",
                "扬州城-喜宴": "jh fam 0 start;go north;go north;go east;go up",
                "扬州城-擂台": "jh fam 0 start;go west;go south",
                "扬州城-当铺": "jh fam 0 start;go south;go east",
                "扬州城-帮派": "jh fam 0 start;go south;go south;go east",
                "扬州城-有间客栈": "jh fam 0 start;go north;go east",
                "扬州城-赌场": "jh fam 0 start;go south;go west",
                "帮会-大门": "jh fam 0 start;go south;go south;go east;go east",
                "帮会-大院": "jh fam 0 start;go south;go south;go east;go east;go east",
                "帮会-练功房": "jh fam 0 start;go south;go south;go east;go east;go east;go north",
                "帮会-聚义堂": "jh fam 0 start;go south;go south;go east;go east;go east;go east",
                "帮会-仓库": "jh fam 0 start;go south;go south;go east;go east;go east;go east;go north",
                "帮会-炼药房": "jh fam 0 start;go south;go south;go east;go east;go east;go south",
                "扬州城-扬州武馆": "jh fam 0 start;go south;go south;go west",
                "扬州城-武庙": "jh fam 0 start;go north;go north;go west",
                "武当派-广场": "jh fam 1 start;",
                "武当派-三清殿": "jh fam 1 start;go north",
                "武当派-石阶": "jh fam 1 start;go west",
                "武当派-练功房": "jh fam 1 start;go west;go west",
                "武当派-太子岩": "jh fam 1 start;go west;go northup",
                "武当派-桃园小路": "jh fam 1 start;go west;go northup;go north",
                "武当派-舍身崖": "jh fam 1 start;go west;go northup;go north;go east",
                "武当派-南岩峰": "jh fam 1 start;go west;go northup;go north;go west",
                "武当派-乌鸦岭": "jh fam 1 start;go west;go northup;go north;go west;go northup",
                "武当派-五老峰": "jh fam 1 start;go west;go northup;go north;go west;go northup;go northup",
                "武当派-虎头岩": "jh fam 1 start;go west;go northup;go north;go west;go northup;go northup;go northup",
                "武当派-朝天宫": "jh fam 1 start;go west;go northup;go north;go west;go northup;go northup;go northup;go north",
                "武当派-三天门": "jh fam 1 start;go west;go northup;go north;go west;go northup;go northup;go northup;go north;go north",
                "武当派-紫金城": "jh fam 1 start;go west;go northup;go north;go west;go northup;go northup;go northup;go north;go north;go north",
                "武当派-林间小径": "jh fam 1 start;go west;go northup;go north;go west;go northup;go northup;go northup;go north;go north;go north;go north;go north",
                "武当派-后山小院": "jh fam 1 start;go west;go northup;go north;go west;go northup;go northup;go northup;go north;go north;go north;go north;go north;go north",
                "少林派-广场": "jh fam 2 start;",
                "少林派-山门殿": "jh fam 2 start;go north",
                "少林派-东侧殿": "jh fam 2 start;go north;go east",
                "少林派-西侧殿": "jh fam 2 start;go north;go west",
                "少林派-天王殿": "jh fam 2 start;go north;go north",
                "少林派-大雄宝殿": "jh fam 2 start;go north;go north;go northup",
                "少林派-钟楼": "jh fam 2 start;go north;go north;go northeast",
                "少林派-鼓楼": "jh fam 2 start;go north;go north;go northwest",
                "少林派-后殿": "jh fam 2 start;go north;go north;go northwest;go northeast",
                "少林派-练武场": "jh fam 2 start;go north;go north;go northwest;go northeast;go north",
                "少林派-罗汉堂": "jh fam 2 start;go north;go north;go northwest;go northeast;go north;go east",
                "少林派-般若堂": "jh fam 2 start;go north;go north;go northwest;go northeast;go north;go west",
                "少林派-方丈楼": "jh fam 2 start;go north;go north;go northwest;go northeast;go north;go north",
                "少林派-戒律院": "jh fam 2 start;go north;go north;go northwest;go northeast;go north;go north;go east",
                "少林派-达摩院": "jh fam 2 start;go north;go north;go northwest;go northeast;go north;go north;go west",
                "少林派-竹林": "jh fam 2 start;go north;go north;go northwest;go northeast;go north;go north;go north",
                "少林派-藏经阁": "jh fam 2 start;go north;go north;go northwest;go northeast;go north;go north;go north;go west",
                "少林派-达摩洞": "jh fam 2 start;go north;go north;go northwest;go northeast;go north;go north;go north;go north;go north",
                "华山派-镇岳宫": "jh fam 3 start;",
                "华山派-苍龙岭": "jh fam 3 start;go eastup",
                "华山派-舍身崖": "jh fam 3 start;go eastup;go southup",
                "华山派-峭壁": "jh fam 3 start;go eastup;go southup;jumpdown",
                "华山派-山谷": "jh fam 3 start;go eastup;go southup;jumpdown;go southup",
                "华山派-山间平地": "jh fam 3 start;go eastup;go southup;jumpdown;go southup;go south",
                "华山派-林间小屋": "jh fam 3 start;go eastup;go southup;jumpdown;go southup;go south;go east",
                "华山派-玉女峰": "jh fam 3 start;go westup",
                "华山派-玉女祠": "jh fam 3 start;go westup;go west",
                "华山派-练武场": "jh fam 3 start;go westup;go north",
                "华山派-练功房": "jh fam 3 start;go westup;go north;go east",
                "华山派-客厅": "jh fam 3 start;go westup;go north;go north",
                "华山派-偏厅": "jh fam 3 start;go westup;go north;go north;go east",
                "华山派-寝室": "jh fam 3 start;go westup;go north;go north;go north",
                "华山派-玉女峰山路": "jh fam 3 start;go westup;go south",
                "华山派-玉女峰小径": "jh fam 3 start;go westup;go south;go southup",
                "华山派-思过崖": "jh fam 3 start;go westup;go south;go southup;go southup",
                "华山派-山洞": "jh fam 3 start;go westup;go south;go southup;go southup;break bi;go enter",
                "华山派-长空栈道": "jh fam 3 start;go westup;go south;go southup;go southup;break bi;go enter;go westup",
                "华山派-落雁峰": "jh fam 3 start;go westup;go south;go southup;go southup;break bi;go enter;go westup;go westup",
                "华山派-华山绝顶": "jh fam 3 start;go westup;go south;go southup;go southup;break bi;go enter;go westup;go westup;jumpup",
                "峨眉派-金顶": "jh fam 4 start",
                "峨眉派-庙门": "jh fam 4 start;go west",
                "峨眉派-广场": "jh fam 4 start;go west;go south",
                "峨眉派-走廊": "jh fam 4 start;go west;go south;go west",
                "峨眉派-休息室": "jh fam 4 start;go west;go south;go east;go south",
                "峨眉派-厨房": "jh fam 4 start;go west;go south;go east;go east",
                "峨眉派-练功房": "jh fam 4 start;go west;go south;go west;go west",
                "峨眉派-小屋": "jh fam 4 start;go west;go south;go west;go north;go north",
                "峨眉派-清修洞": "jh fam 4 start;go west;go south;go west;go south;go south",
                "峨眉派-大殿": "jh fam 4 start;go west;go south;go south",
                "峨眉派-睹光台": "jh fam 4 start;go northup",
                "峨眉派-华藏庵": "jh fam 4 start;go northup;go east",
                "逍遥派-青草坪": "jh fam 5 start",
                "逍遥派-林间小道": "jh fam 5 start;go east",
                "逍遥派-练功房": "jh fam 5 start;go east;go north",
                "逍遥派-木板路": "jh fam 5 start;go east;go south",
                "逍遥派-工匠屋": "jh fam 5 start;go east;go south;go south",
                "逍遥派-休息室": "jh fam 5 start;go west;go south",
                "逍遥派-木屋": "jh fam 5 start;go north;go north",
                "逍遥派-地下石室": "jh fam 5 start;go down;go down",
                "丐帮-树洞内部": "jh fam 6 start",
                "丐帮-树洞下": "jh fam 6 start;go down",
                "丐帮-暗道": "jh fam 6 start;go down;go east",
                "丐帮-破庙密室": "jh fam 6 start;go down;go east;go east;go east",
                "丐帮-土地庙": "jh fam 6 start;go down;go east;go east;go east;go up",
                "丐帮-林间小屋": "jh fam 6 start;go down;go east;go east;go east;go east;go east;go up",
                "杀手楼-大门": "jh fam 7 start",
                "杀手楼-大厅": "jh fam 7 start;go north",
                "杀手楼-暗阁": "jh fam 7 start;go north;go up",
                "杀手楼-铜楼": "jh fam 7 start;go north;go up;go up",
                "杀手楼-休息室": "jh fam 7 start;go north;go up;go up;go east",
                "杀手楼-银楼": "jh fam 7 start;go north;go up;go up;go up;go up",
                "杀手楼-练功房": "jh fam 7 start;go north;go up;go up;go up;go up;go east",
                "杀手楼-金楼": "jh fam 7 start;go north;go up;go up;go up;go up;go up;go up",
                "杀手楼-书房": "jh fam 7 start;go north;go up;go up;go up;go up;go up;go up;go west",
                "杀手楼-平台": "jh fam 7 start;go north;go up;go up;go up;go up;go up;go up;go up",
                "襄阳城-广场": "jh fam 8 start",
                "襄阳城-南城门": "jh fam 8 start;go south;go south;go south;go south",
                "襄阳城-北城门": "jh fam 8 start;go north;go north;go north;go north;",
                "襄阳城-西城门": "jh fam 8 start;go west;go west;go west;go west",
                "襄阳城-东城门": "jh fam 8 start;go east;go eastgo east;go east",
                "武道塔": "jh fam 9 start"
            };
            for (const placeName in places) {
                this.places.set(placeName, places[placeName]);
            }
        }

        async gotoPlace(placeName) {
            const path = this.places.get(placeName);
            if (!path) {
                unsafeWindow.messageAppend(`未找到名为 "${placeName}" 的路径。`);
                // 添加0.5秒延迟以保持一致性
                await unsafeWindow.sleep(500);
                return;
            }

            // 判断当前房间名是否与要去的路径一致
            if (this.currentRoom && this.currentRoom === placeName) {
                unsafeWindow.messageAppend(`已经位于 ${placeName}，无需移动。`);
                // 仍然需要延迟以保持一致性
                await unsafeWindow.sleep(500);
                return;
            }

            this.wsManager.sendCmd(path);

            // 添加0.5秒延迟
            await unsafeWindow.sleep(500);
        }

        async buyItem(placeName, npcName, itemNames) {
            await this.gotoPlace(placeName);

            const npcId = await this.getPlayerIdByName(npcName);
            if (!npcId) {
                unsafeWindow.messageAppend(`未找到 NPC "${npcName}"，购买失败。`);
                return false;
            }

            const buyHookId = this.wsManager.addHook('dialog', (data) => {
                if (data.dialog === 'list' && data.seller === npcId) {
                    let allItemsFound = true;
                    itemNames.forEach(itemName => {
                        const cleanItemName = itemName.replace(/<[^>]+>/g, '').trim();
                        const itemToBuy = data.selllist.find(item => {
                            const cleanSellName = item[0].replace(/<[^>]+>/g, '').trim();
                            return cleanSellName === cleanItemName;
                        });

                        if (itemToBuy) {
                            const itemId = itemToBuy[1];
                            const buyCommand = `buy 1 ${itemId} from ${npcId}`;
                            this.sendCmd(buyCommand);
                            unsafeWindow.messageAppend(`已购买物品: ${itemName}。`);
                        } else {
                            unsafeWindow.messageAppend(`未找到物品: ${itemName}，购买失败。`);
                            allItemsFound = false;
                        }
                    });

                    this.wsManager.removeHook(buyHookId);
                    return allItemsFound;
                }
                return false;
            });

            this.sendCmd(`list ${npcId}`);
        }

        /**
         * 处理以$开头的脚本命令
         * @param {string} command 脚本命令
         */
        sendCmd(command) {
            // 检查是否是以$开头的脚本命令
            if (command.startsWith('$')) {
                // 解析命令和参数
                const parts = command.substring(1).split(' ');
                const cmd = parts[0];
                const args = parts.slice(1);

                // 根据命令执行对应功能
                switch (cmd) {
                    case 'goto':
                        // 功能1: $goto 地点名
                        if (args.length > 0) {
                            const placeName = args.join(' ');
                            this.gotoPlace(placeName);
                        }
                        break;
                    case 'to':
                        // 功能1: $goto 地点名
                        if (args.length > 0) {
                            const placeName = args.join(' ');
                            this.gotoPlace(placeName);
                        }
                        break;
                    case 'efarm':
                        // 功能2: $efarm 执行一键submitSupplies
                        this.submitSupplies();
                        break;
                    default:
                        // 如果不是已知的脚本命令，则发送原始命令
                        this.wsManager.sendCmd(command);
                        break;
                }
            } else {
                // 不是以$开头的命令，直接发送
                this.wsManager.sendCmd(command);
            }
        }
        kill_all() {
            //获取房间所有id并kill
            // this.roomPlayers.forEach(function (player) {
            //     if (player.hp == null || player.hp == 0) {
            //         return;
            //     }
            //     this.wsManager.sendCmd("kill " + player.id);
            // }.bind(this));

            // 虚拟一个

            // Get the element with the class "room-commands"
            const roomCommands = document.querySelector('.room-commands');

            // Check if the element already exists
            const existingKillall = roomCommands.querySelector('span[cmd="_rm killall"]');

            // If the element doesn't exist, create and append it
            if (!existingKillall) {
                // Create the new span element
                const killallSpan = document.createElement('span');

                // Set the class, content, and attributes
                killallSpan.className = 'act-item';
                killallSpan.setAttribute('cmd', '_rm killall');
                killallSpan.textContent = 'killall';

                // Append the new element
                roomCommands.appendChild(killallSpan);

                // Hide the newly created element
                killallSpan.style.display = 'none';

                // Click the element
                killallSpan.click();
            } else {
                // If the element already exists, hide and click it
                // existingKillall.style.display = 'none';
                existingKillall.click();
            }
        }

        get_all() {
            //获取房间所有id并kill
            // this.roomPlayers.forEach(function (player) {

            //     this.wsManager.sendCmd("get all from " + player.id);
            // }.bind(this));
            //虚拟一个
            // Get the element with the class "room-commands"
            const roomCommands = document.querySelector('.room-commands');

            // Check if the element already exists
            const existingGETall = roomCommands.querySelector('span[cmd="_rm getall"]');

            // If the element doesn't exist, create and append it
            if (!existingGETall) {
                // Create the new span element
                const getallSpan = document.createElement('span');

                // Set the class, content, and attributes
                getallSpan.className = 'act-item';
                getallSpan.setAttribute('cmd', '_rm getall');
                getallSpan.textContent = 'getall';

                // Append the new element
                roomCommands.appendChild(getallSpan);

                // Hide the newly created element
                getallSpan.style.display = 'none';

                // Click the element
                getallSpan.click();
            } else {
                // If the element already exists, hide and click it
                // existinggetall.style.display = 'none';
                existingGETall.click();
            }
        }
        auto_preform_switch() {

            if (this.auto_preform_enabled) {
                this.auto_preform_enabled = false;
                messageAppend("<hio>自动施法</hio>关闭");

                $(".auto_perform").html("自动关");
                this.auto_preform("stop");
            } else {
                this.auto_preform_enabled = true;
                messageAppend("<hio>自动施法</hio>开启");
                $(".auto_perform").html("自动开");
                this.auto_preform();
            }
        }
        /**
         * Adds custom UI elements to the game interface.
         */
        addUI() {
            // Check if UI has already been added to prevent duplicates
            if ($('.WG_button').length > 0) {
                return;
            }



            const style = document.createElement('style');
            style.textContent = `
                .WG_log{flex: 1;overflow-y: auto;border: 1px solid #404000;max-height: 15em;width: calc(100% - 50px);}
                .WG_log > pre{margin: 0px; white-space: pre-line;}
                .plugin-message {
                    display: block;
                    background-color: #2c2c2c;
                    padding: 5px;
                    margin: 5px 0;
                    border-left: 3px solid #1abc9c;
                }
            `;
            document.head.appendChild(style);

            $("span[command=stopstate] span:eq(0)").html("S");
            $("span[command=showcombat] span:eq(0)").html("A");
            $("span[command=showtool] span:eq(0)").html("C");
            $("span[command=pack] span:eq(0)").html("B");
            $("span[command=tasks] span:eq(0)").html("L");
            $("span[command=score] span:eq(0)").html("O");
            $("span[command=jh] span:eq(0)").html("J");
            $("span[command=skills] span:eq(0)").html("K");
            $("span[command=message] span:eq(0)").html("U");
            $("span[command=shop] span:eq(0)").html("P");
            $("span[command=stats] span:eq(0)").html("I");
            $("span[command=setting] span:eq(0)").html(",");

            const uiHtml = `
                 <div class='WG_log'>
                    <pre></pre>
                </div>
                <div class="WG_button">
                    <span class="zdy-item" id="submit_supplies">活动(Q)</span>
                    <span class="zdy-item" id="yamen2">追捕(W)</span>
                    <span class="zdy-item" id="kill_all">叫杀(E)</span>
                    <span class="zdy-item" id="get_all">拾取(R)</span>
                    <span class="zdy-item" id="sell_all">清包(T)</span>
                    <span class="zdy-item" id="xiulian">修炼(Y)</span>
                    
                 <span class="zdy-item auto_perform" style="float:right;"> 自动攻击 </span>
                </div>
            `;

            // Wait for the body to be available before adding the UI.
            $(document).ready(() => {
                const contentMessage = $('.content-message');
                if (contentMessage.length) {
                    // Place the UI after the content-message element as per the original script's logic
                    contentMessage.after(uiHtml);

                    // 添加欢迎信息
                    if (this.role) {
                        const rolep = `${this.role.family} ${this.role.name}`;
                        const welcomeMessage = `欢迎 <span class="supernova-text">${rolep}</span> 使用 版本号：v${GM_info.script.version}`;
                        $('.content-message pre').append($(`<div class="plugin-message">${welcomeMessage}</div>`));
                    }
                } else {
                    // Fallback in case .content-message is not found
                    $('body').append(uiHtml);
                }

                // Bind click events to the new buttons
                $('#submit_supplies').on('click', () => {
                    this.submitSupplies();
                });
                $('#yamen2').on('click', () => {
                    this.yamen2();
                });
                $('#kill_all').on('click', () => {
                    this.kill_all()
                });
                $('#get_all').on('click', () => {
                    this.get_all()
                });
                $('#sell_all').on('click', () => {
                    this.sendCmd('sell all');
                });
                $('#xiulian').on('click', () => {
                    this.sendCmd('goto kuang');
                });

                $(".auto_perform").on('click', () => {
                    this.auto_preform_switch()

                });

                // Add keyboard shortcuts
                $(document).on("keydown", (e) => {
                    // Check if the user is typing in an input field
                    if ($('input').is(':focus') || $('textarea').is(':focus')) {
                        return;
                    }

                    const keyCode = e.keyCode;
                    const ctrlKey = e.ctrlKey || e.metaKey;
                    const altKey = e.altKey;
                    const kk = (ctrlKey ? 1024 : 0) + (altKey ? 512 : 0) + keyCode;



                    // 添加其他按键绑定
                    switch (keyCode) {
                        case 69: // E key - kill all
                            this.kill_all()
                            break;
                        case 81: // Q key - submitSupplies
                            this.submitSupplies();
                            break;
                        case 87: // W key - yamen2
                            this.yamen2();
                            break;
                        case 82: // R key - get all
                            this.get_all()
                            break;
                        case 84: // T key - sell all
                            this.sendCmd('sell all');
                            break;
                        case 89: // Y key - xiulian
                            this.sendCmd('goto kuang');
                            break;
                    }

                    // Handle arrow keys for movement
                    let direction = '';
                    switch (keyCode) {
                        case 104: // Numpad 8
                        case 38: // Up arrow
                            direction = 'north';
                            break;
                        case 98: // Numpad 2
                        case 40: // Down arrow
                            direction = 'south';
                            break;
                        case 102: // Numpad 6
                        case 39: // Right arrow
                            direction = 'east';
                            break;
                        case 100: // Numpad 4
                        case 37: // Left arrow
                            direction = 'west';
                            break;
                        case 105: // Numpad 9
                            direction = 'northeast';
                            break;
                        case 99: // Numpad 3
                            direction = 'southeast';
                            break;
                        case 103: // Numpad 7
                            direction = 'northwest';
                            break;
                        case 97: // Numpad 1
                            direction = 'southwest';
                            break;
                    }

                    if (direction) {
                        const exit = this.gameState.exits.get(direction);
                        if (exit) {
                            this.sendCmd(`go ${direction}`);
                        } else {
                            // Check for alternative up/down exits
                            let alternative = '';
                            if (direction === 'north') {
                                alternative = this.gameState.exits.get('northup') ? 'northup' : (this.gameState.exits.get('northdown') ? 'northdown' : '');
                            } else if (direction === 'south') {
                                alternative = this.gameState.exits.get('southup') ? 'southup' : (this.gameState.exits.get('southdown') ? 'southdown' : '');
                            } else if (direction === 'east') {
                                alternative = this.gameState.exits.get('eastup') ? 'eastup' : (this.gameState.exits.get('eastdown') ? 'eastdown' : '');
                            } else if (direction === 'west') {
                                alternative = this.gameState.exits.get('westup') ? 'westup' : (this.gameState.exits.get('westdown') ? 'westdown' : '');
                            }
                            if (alternative) {
                                this.sendCmd(`go ${alternative}`);
                            }
                        }
                    }

                    // Handle other key bindings
                    switch (keyCode) {
                        case 27: // Esc
                            $('.dialog-close').click();
                            break;
                        case 192: // `
                            $('.map-icon').click();
                            break;
                        case 32: // Space
                            if ($('.dialog-confirm').is(':visible') && this.gameState.isallow) {
                                this.gameState.isallow = false;
                                $('.dialog-btn.btn-ok').click();
                                setTimeout(() => {
                                    this.gameState.isallow = true;
                                }, 500);
                            }
                            break;
                        case 83: // S
                            this.doCommand('stopstate');
                            break;
                        case 13: // Enter
                            this.doCommand('showchat');
                            break;
                        case 65: // A
                            this.doCommand('showcombat');
                            break;
                        case 67: // C
                            this.doCommand('showtool');
                            break;
                        case 66: // B
                            this.doCommand('pack');
                            break;
                        case 76: // L
                            this.doCommand('tasks');
                            break;
                        case 79: // O
                            this.doCommand('score');
                            break;
                        case 74: // J
                            this.doCommand('jh');
                            break;
                        case 75: // K
                            this.doCommand('skills');
                            break;
                        case 73: // I
                            this.doCommand('stats');
                            break;
                        case 85: // U
                            this.doCommand('message');
                            break;
                        case 80: // P
                            this.doCommand('shop');
                            break;
                        case 188: // ,
                            this.doCommand('setting');
                            break;
                    }
                });
            });
        }
        log_line = 0
        // A custom function to append messages with a specific style
        messageAppend(m, t = 0, area = 0) {


            if (area) {
                var ap = m + "\n";
                if (t == 1) {
                    ap = "<hiy>" + ap + "</hiy>";
                } else if (t == 2) {
                    ap = "<hig>" + ap + "</hig>";
                } else if (t == 3) {
                    ap = "<hiw>" + ap + "</hiw>";
                } else if (t == 4) {
                    ap = "<hir>" + ap + "</hir>";
                }
                $('.content-message pre').append(ap)
            } else {
                100 < this.log_line && (this.log_line = 0, $(".WG_log pre").empty());
                var ap = m + "\n";
                if (t == 1) {
                    ap = "<hiy>" + ap + "</hiy>";
                } else if (t == 2) {
                    ap = "<hig>" + ap + "</hig>";
                } else if (t == 3) {
                    ap = "<hiw>" + ap + "</hiw>";
                } else if (t == 4) {
                    ap = "<hir>" + ap + "</hir>";
                }
                $(".WG_log pre").append(ap);
                this.log_line++;
                $(".WG_log")[0].scrollTop = 99999;
            }
        }
        messageClear() {
            $(".WG_log pre").html("");
        }

        // 添加带按钮的消息到内容区域
        addBtnMsgContent(cmd, text) {
            setTimeout(() => {
                const buttonElement = $(`<div class="item-commands"><span cmd="${cmd}">${text}</span></div>`);
                $('.content-message pre').append(buttonElement);

                // 绑定按钮点击事件
                buttonElement.find('span').on('click', function () {
                    const command = $(this).attr('cmd');
                    unsafeWindow.sendCmd(command);
                });
                // 滚动到最后
                $('.content-message').scrollTop($('.content-message')[0].scrollHeight);
            }, 100);
        }



        // 添加设置UI功能
        addSettingUI() {
            // 等待对话框加载完成
            setTimeout(() => {
                // 创建Vue应用的挂载点
                const vueMountPoint = document.createElement('div');
                vueMountPoint.id = 'plugin-settings-app';
                vueMountPoint.className = 'plugin-settings-container';

                if ($('.dialog-custom').length > 0) {
                    $('.dialog-custom').append(vueMountPoint);
                } else {
                    // 如果找不到dialog-custom元素，则添加到对话框内容中
                    $('.dialog-content').append(vueMountPoint);
                }

                // 创建Vue 3应用
                const { createApp, ref, onMounted } = Vue;

                const app = createApp({
                    template: `
                        <div class="plugin_settings">
                        <h3>插件配置</h3>
                            <div class="plugin_setting-item">
                                <span class="plugin_title">
                                   隐藏插件信息
                                </span>
                                <span 
                                    class="plugin_switch" 
                                    :class="{ 'plugin_on': hidePluginInfo }"
                                    @click="toggleHidePluginInfo"
                                >
                                    <span class="plugin_switch-button"></span>
                                    <span class="plugin_switch-text">
                                        {{ hidePluginInfo ? '开' : '关' }}
                                    </span>
                                </span>
                            </div>
                            <div class="plugin_setting-item">
                                <span class="plugin_title">
                                   高亮本人名字
                                </span>
                                <span 
                                    class="plugin_switch" 
                                    :class="{ 'plugin_on': highlightPlayerName }"
                                    @click="toggleHighlightPlayerName"
                                >
                                    <span class="plugin_switch-button"></span>
                                    <span class="plugin_switch-text">
                                        {{ highlightPlayerName ? '开' : '关' }}
                                    </span>
                                </span>
                            </div>
                            <div class="plugin_setting-item">
                                <span class="plugin_title">
                                   背景图片URL
                                </span>
                                <span class="plugin_input">
                                    <input 
                                        type="text" 
                                        v-model="backgroundImageUrl" 
                                        placeholder="请输入背景图片链接"
                                        @change="saveBackgroundImage"
                                    >
                                </span>
                            </div>
                        </div>
                    `,
                    setup() {
                        const hidePluginInfo = ref(GM_getValue('hide_pluginInfo', false));
                        const highlightPlayerName = ref(GM_getValue('highlightPlayerName', true));
                        const backgroundImageUrl = ref(GM_getValue('backimageurl', ''));

                        const toggleHidePluginInfo = () => {
                            hidePluginInfo.value = !hidePluginInfo.value;
                            GM_setValue('hide_pluginInfo', hidePluginInfo.value);
                        };

                        const toggleHighlightPlayerName = () => {
                            highlightPlayerName.value = !highlightPlayerName.value;
                            GM_setValue('highlightPlayerName', highlightPlayerName.value);
                        };

                        const saveBackgroundImage = () => {
                            GM_setValue('backimageurl', backgroundImageUrl.value);

                            // 如果输入了URL，则应用背景
                            if (backgroundImageUrl.value != '') {
                                GM_addStyle(`
                                    body {
                                        background-color: rgba(0,0,0,.25) !important;
                                    }
                                    div {
                                        opacity: 1;
                                    }
                                    html {
                                        background: rgba(255,255,255,0.25) !important;
                                        background-image: url('${backgroundImageUrl.value}') !important;
                                        background-repeat: no-repeat !important;
                                        background-size: 100% 100% !important;
                                        -moz-background-size: 100% 100% !important;
                                    }
                                `);
                            }
                        };

                        return {
                            hidePluginInfo,
                            highlightPlayerName,
                            backgroundImageUrl,
                            toggleHidePluginInfo,
                            toggleHighlightPlayerName,
                            saveBackgroundImage
                        };
                    }
                });

                // 挂载Vue应用
                app.mount('#plugin-settings-app');
            }, 1000);
        }

        async yamen2() {

            this.sendCmd("$goto 扬州城-衙门正厅");

            await this.cmdToPlayer("ask1", "扬州知府 程药发")
        }
        async submitSupplies() {
            this.sendCmd('stopstate;events');

            const eventsHookId = this.wsManager.addHook('dialog', async (data) => {
                if (data.dialog === 'events') {
                    // 检查 items 是否为空数组
                    if (data.items && data.items.length === 0) {
                        this.wsManager.removeHook(eventsHookId);
                        unsafeWindow.messageAppend("活动事件已完成");
                        return;
                    }

                    const suppliesEvent = data.items.find(item => {
                        return Array.isArray(item) && item[2] && typeof item[2] === 'string';
                    });
                    if (suppliesEvent) {
                        const commandId = suppliesEvent[0];
                        this.sendCmd(`events ${commandId}`);

                        this.wsManager.removeHook(eventsHookId);

                        const textHookId = this.wsManager.addHook('text', async (textData) => {
                            if (textData.msg.includes('你身上没有')) {
                                const desc = suppliesEvent[2];
                                const requiredItemMatch = desc.match(/<[^>]+>.*?<\/[^>]+>/);
                                if (requiredItemMatch && requiredItemMatch[0]) {
                                    const requiredItem = requiredItemMatch[0].replace(/<[^>]+>/g, '').trim();
                                    unsafeWindow.messageAppend(`检测到缺少物品: ${requiredItem}。尝试购买...`);

                                    // 查找物品信息
                                    const itemInfo = this.goods[requiredItem];
                                    if (itemInfo) {
                                        const place = itemInfo.place;
                                        const sales = itemInfo.sales;
                                        unsafeWindow.messageAppend(`物品信息: ${requiredItem}，地点: ${place}，NPC: ${sales}`);

                                        // 购买物品
                                        await this.buyItem(place, sales, [requiredItem]);

                                        // 购买完成后重新提交
                                        await unsafeWindow.sleep(500);
                                        this.sendCmd(`events ${commandId}`);
                                    } else {
                                        unsafeWindow.messageAppend(`未找到物品"${requiredItem}"的购买信息`);
                                    }
                                }
                            } else {
                                this.wsManager.removeHook(textHookId);
                            }
                        });
                    } else {
                        this.wsManager.removeHook(eventsHookId);
                    }
                }
            });
        }
        preform_timer = null;
        in_fight = false;

        cds = new Map()
        gcd = 0;
        auto_preform_enabled = true;
        auto_preform(v) {
            if (v == "stop") {
                if (this.preform_timer) {
                    clearInterval(this.preform_timer);
                    this.preform_timer = null;
                }

                $(".auto_perform").css("background", "");
                return;
            }

            // 如果已经有一个定时器在运行，先清除它
            if (this.preform_timer) {
                clearInterval(this.preform_timer);
                this.preform_timer = null;
            }
            if (this.auto_preform_enabled) {

                this.preform_timer = setInterval(() => {

                    $(".auto_perform").css("background", "#3E0000");
                    if (!this.in_fight) {
                        this.auto_preform("stop");
                        return;
                    };
                    if (!this.auto_preform_enabled) {
                        this.auto_preform("stop");
                        return;
                    }
                    for (var skill of this.skills) {
                        if (!this.gcd && !this.cds.get(skill.id)) {
                            this.sendCmd("perform " + skill.id);
                            break;
                        }
                    }
                }, 350);
            }
        }
    }


    var L = {
        msg: function (msg) {
            const interval = setInterval(() => {
                if (typeof layer !== 'undefined') {
                    clearInterval(interval);
                    layer.msg(msg, {
                        offset: '50%',
                        shift: 5
                    });
                } else {
                    var server = document.createElement('script');
                    server.setAttribute('src', 'https://s4.zstatic.net/ajax/libs/layer/2.3/layer.js');
                    document.head.appendChild(server);
                }
            }, 500); // 每500毫秒检查一次
        },
        isMobile: function () {
            var ua = navigator.userAgent;
            var ipad = ua.match(/(iPad).*OS\s([\d_]+)/),
                isIphone = !ipad && ua.match(/(iPhone\sOS)\s([\d_]+)/),
                isAndroid = ua.match(/(Android)\s+([\d.]+)/),
                isMobile = isIphone || isAndroid;
            return isMobile;
        }
    };

    const webSocketManager = new WebSocketHookManager();
    const gameLogicManager = new GameLogicManager(webSocketManager);

    // Hook the WebSocket immediately
    webSocketManager.hookWebSocket();
    $(document).ready(function () {
        $('head').append('<link href="https://s4.zstatic.net/ajax/libs/layer/2.3/skin/layer.css" rel="stylesheet">');
        $('head').append('<link href="https://s4.zstatic.net/ajax/libs/font-awesome/4.7.0/css/font-awesome.css" rel="stylesheet">');
        // Instantiate the managers to start the hooking process.

        gameLogicManager.init();


        // Register the WG class to unsafeWindow for compatibility with other scripts
        unsafeWindow.WG_wsManager = webSocketManager;
        unsafeWindow.WG = WG;
        unsafeWindow.L = L;

        // Make the sendCmd function globally accessible.
        unsafeWindow.sendCmd = gameLogicManager.sendCmd.bind(gameLogicManager);
        unsafeWindow.messageAppend = gameLogicManager.messageAppend.bind(gameLogicManager);
        unsafeWindow.messageClear = gameLogicManager.messageClear.bind(gameLogicManager);
        // 添加全局sleep函数
        unsafeWindow.sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

        // Example usage:
        // Add a hook to log all text messages.
        webSocketManager.addHook('text', (data) => {
            console.log('Text Message Received:', data.msg);
        });

        // Add a hook to process all dialog and item messages.
        webSocketManager.addHook(['dialog', 'items'], (data) => {
            if (data.dialog) {
                console.log('Dialog opened:', data.dialog);
            }
            if (data.items) {
                console.log('Items updated:', data.items);
            }
        });

    });

})();