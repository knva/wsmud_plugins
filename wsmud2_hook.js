// ==UserScript==
// @name         WebSocket Hook for wsmud2
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  A modern WebSocket hook for and wsmud2.com
// @author       Gemini
// @match        http://*.wsmud2.com/*
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

            // Immediately hook the WebSocket object upon instantiation.
            this.hookWebSocket();
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
    }

    // Instantiate the manager to start the hooking process.
    const hookManager = new WebSocketHookManager();

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
