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

(function() {
    'use strict';

    // A class to manage all WebSocket hooks.
    class WebSocketHookManager {
        constructor() {
            this.hooks = [];
            this.hookIndex = 0;
            this.originalWebSocket = unsafeWindow.WebSocket;
            this.ws = null;
            this.originalWsOnMessage = null;
            this.uiAdded = false;
            
            // This object will hold global game state information
            this.gameState = {
                exits: new Map(),
                in_fight: false,
                isallow: true
            };

            // Immediately hook the WebSocket object upon instantiation.
            this.hookWebSocket();
            
            // 监听 'login' 消息，在成功登录后执行 addUI
            this.addHook('login', this.handleLogin.bind(this));
            this.addHook('exits', this.handleExits.bind(this));
            this.addHook('combat', this.handleCombat.bind(this));
        }

        handleLogin(data) {
            // 确保 UI 只被添加一次
            if (!this.uiAdded) {
                this.addUI();
                this.uiAdded = true;
            }
        }
        
        handleExits(data) {
            this.gameState.exits.clear();
            for (const direction in data.items) {
                this.gameState.exits.set(direction, data.items[direction]);
            }
        }

        handleCombat(data) {
            if (data.start) {
                this.gameState.in_fight = true;
            }
            if (data.end) {
                this.gameState.in_fight = false;
            }
        }

        /**
         * Replaces the native WebSocket with a custom one to intercept messages.
         * This method must be called before the game's WebSocket connection is established.
         */
        hookWebSocket() {
            const self = this;
            const originalPrototype = self.originalWebSocket.prototype;

            unsafeWindow.WebSocket = function(uri) {
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
                send: function(data) {
                    // You can add logic here to intercept or modify outgoing messages.
                    // For now, we simply pass the message through.
                    self.ws.send(data);
                },
                close: function() {
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
            if (this.ws && this.ws.readyState === this.ws.OPEN) {
                this.ws.send(command);
                console.log(`Command sent: ${command}`);
            } else {
                console.warn('WebSocket connection is not open. Command not sent.');
            }
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

        /**
         * Adds custom UI elements to the game interface.
         */
        addUI() {
            // Check if UI has already been added to prevent duplicates
            if ($('.WG_button').length > 0) {
                return;
            }

            // Add custom CSS styles
            const customCSS = `
                .WG_button {
                    display: flex;
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
                    margin-right: 0.5em;
                    position: relative;
                    padding-left: 0.4em;
                    padding-right: 0.4em;
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
            `;
            GM_addStyle(customCSS);

            const uiHtml = `
                <div class="WG_button">
                    <span class="zdy-item" id="kill_all">击杀(E)</span>
                    <span class="zdy-item" id="get_all">拾取(R)</span>
                    <span class="zdy-item" id="sell_all">清包(T)</span>
                    <span class="zdy-item" id="xiulian">修炼(Y)</span>
                </div>
            `;
            
            // Wait for the body to be available before adding the UI.
            $(document).ready(() => {
                const contentMessage = $('.content-message');
                if (contentMessage.length) {
                    // Place the UI after the content-message element as per the original script's logic
                    contentMessage.after(uiHtml);
                } else {
                    // Fallback in case .content-message is not found
                    $('body').append(uiHtml);
                }
                
                // Bind click events to the new buttons
                $('#kill_all').on('click', () => {
                    this.sendCmd('killall');
                });
                $('#get_all').on('click', () => {
                    this.sendCmd('getall');
                });
                $('#sell_all').on('click', () => {
                    this.sendCmd('sellall');
                });
                $('#xiulian').on('click', () => {
                    this.sendCmd('xiulian');
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
                    switch(keyCode) {
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
    }

    // Instantiate the manager to start the hooking process.
    const hookManager = new WebSocketHookManager();

    // Make the sendCmd function globally accessible.
    unsafeWindow.sendCmd = hookManager.sendCmd.bind(hookManager);

    // Example usage:
    // Add a hook to log all text messages.
    hookManager.addHook('text', (data) => {
        console.log('Text Message Received:', data.msg);
    });

    // Add a hook to process all dialog and item messages.
    hookManager.addHook(['dialog', 'items'], (data) => {
        if (data.dialog) {
            console.log('Dialog opened:', data.dialog);
        }
        if (data.items) {
            console.log('Items updated:', data.items);
        }
    });
})();
