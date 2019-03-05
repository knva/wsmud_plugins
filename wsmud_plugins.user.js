// ==UserScript==
// @name         wsmud_pluginss
// @namespace    cqv1
// @version      0.0.31.151
// @date         01/07/2018
// @modified     04/03/2019
// @homepage     https://greasyfork.org/zh-CN/scripts/371372
// @description  武神传说 MUD
// @author       fjcqv(源程序) & zhzhwcn(提供websocket监听)& knva(做了一些微小的贡献) &Bob.cn(raid.js作者)
// @match        http://game.wsmud.com/*
// @match        http://www.wsmud.com/*
// @run-at       document-start
// @require      https://cdn.bootcss.com/jquery/3.3.1/jquery.min.js
// @require      https://cdn.bootcss.com/jquery-contextmenu/3.0.0-beta.2/jquery.contextMenu.min.js
// @grant        unsafeWindow
// @grant        GM_addStyle
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_setClipboard

// ==/UserScript==

(function () {
    'use strict';
    var updateinfo = "🍋增加一键分享监控及自命令功能\nQQ群 367657589 付费群 \n有问题请反馈\n支付宝搜索 9214712 领花呗红包\n";

    Array.prototype.baoremove = function (dx) {
        if (isNaN(dx) || dx > this.length) {
            return false;
        }
        this.splice(dx, 1);
    }

    if (WebSocket) {
        console.log('插件可正常运行,Plugins can run normally');

        function show_msg(msg) {
            ws_on_message({
                data: msg
            });

        }
        var _ws = WebSocket,
            ws, ws_on_message;
        unsafeWindow.WebSocket = function (uri) {
            ws = new _ws(uri);
        };
        unsafeWindow.WebSocket.prototype = {
            CONNECTING: _ws.CONNECTING,
            OPEN: _ws.OPEN,
            CLOSING: _ws.CLOSING,
            CLOSED: _ws.CLOSED,
            get url() {
                return ws.url;
            },
            get protocol() {
                return ws.protocol;
            },
            get readyState() {
                return ws.readyState;
            },
            get bufferedAmount() {
                return ws.bufferedAmount;
            },
            get extensions() {
                return ws.extensions;
            },
            get binaryType() {
                return ws.binaryType;
            },
            set binaryType(t) {
                ws.binaryType = t;
            },
            get onopen() {
                return ws.onopen;
            },
            set onopen(fn) {
                ws.onopen = fn;
            },
            get onmessage() {
                return ws.onmessage;
            },
            set onmessage(fn) {
                ws_on_message = fn;
                ws.onmessage = WG.receive_message;
            },
            get onclose() {
                return ws.onclose;
            },
            set onclose(fn) {
                ws.onclose = fn;
            },
            get onerror() {
                return ws.onerror;
            },
            set onerror(fn) {
                ws.onerror = fn;
            },
            send: function (text) {
                if (G.cmd_echo) {
                    show_msg('<hiy>' + text + '</hiy>');
                }
                ws.send(text);
            },
            close: function () {
                ws.close();
            }
        };
    } else {
        console.log("插件不可运行,请打开'https://greasyfork.org/zh-CN/forum/discussion/41547/x',按照操作步骤进行操作,Plugins are not functioning properly.plase open https://greasyfork.org/zh-CN/forum/discussion/41547/x");
    }
    var L = {
        msg: function (msg) {
            if (layer) {
                layer.msg(msg, {
                    offset: '50%',
                    shift: 5
                })
            } else {
                messageAppend(msg);
            }
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
    var roomItemSelectIndex = -1;
    var timer = 0;
    var cnt = 0;
    var zb_npc;
    var zb_place;
    var next = 0;
    var roomData = [];
    var blacklist = "";
    var blackpfm = [];
    var needfind = {
        "武当派-林间小径": ["go south"],
        "峨嵋派-走廊": ["go north", "go south;go south", "go north;go east;go east"],
        "丐帮-暗道": ["go east", "go east;go east", "go east"],
        "逍遥派-林间小道": ["go west;go north", "go south;go south", "go north;go west"],
        "少林派-竹林": ["go north"],
        "逍遥派-地下石室": ["go up"],
        "逍遥派-木屋": ["go south;go south;go south;go south"]
    };
    var store_list = [];
    var goods = {
        "米饭": {
            "id": null,
            "type": "wht",
            "sales": "店小二",
            place: "扬州城-醉仙楼"
        },
        "包子": {
            "id": null,
            "type": "wht",
            "sales": "店小二",
            place: "扬州城-醉仙楼"
        },
        "鸡腿": {
            "id": null,
            "type": "wht",
            "sales": "店小二",
            place: "扬州城-醉仙楼"
        },
        "面条": {
            "id": null,
            "type": "wht",
            "sales": "店小二",
            place: "扬州城-醉仙楼"
        },
        "扬州炒饭": {
            "id": null,
            "type": "wht",
            "sales": "店小二",
            place: "扬州城-醉仙楼"
        },
        "米酒": {
            "id": null,
            "type": "wht",
            "sales": "店小二",
            place: "扬州城-醉仙楼"
        },
        "花雕酒": {
            "id": null,
            "type": "wht",
            "sales": "店小二",
            place: "扬州城-醉仙楼"
        },
        "女儿红": {
            "id": null,
            "type": "wht",
            "sales": "店小二",
            place: "扬州城-醉仙楼"
        },
        "醉仙酿": {
            "id": null,
            "type": "hig",
            "sales": "店小二",
            place: "扬州城-醉仙楼"
        },
        "神仙醉": {
            "id": null,
            "type": "hiy",
            "sales": "店小二",
            place: "扬州城-醉仙楼"
        },
        //扬州城-杂货铺
        "布衣": {
            "id": null,
            "type": "wht",
            "sales": "杂货铺老板 杨永福",
            place: "扬州城-杂货铺"
        },
        "钢刀": {
            "id": null,
            "type": "wht",
            "sales": "杂货铺老板 杨永福",
            place: "扬州城-杂货铺"
        },
        "木棍": {
            "id": null,
            "type": "wht",
            "sales": "杂货铺老板 杨永福",
            place: "扬州城-杂货铺"
        },
        "英雄巾": {
            "id": null,
            "type": "wht",
            "sales": "杂货铺老板 杨永福",
            place: "扬州城-杂货铺"
        },
        "布鞋": {
            "id": null,
            "type": "wht",
            "sales": "杂货铺老板 杨永福",
            place: "扬州城-杂货铺"
        },
        "铁戒指": {
            "id": null,
            "type": "wht",
            "sales": "杂货铺老板 杨永福",
            place: "扬州城-杂货铺"
        },
        "簪子": {
            "id": null,
            "type": "wht",
            "sales": "杂货铺老板 杨永福",
            place: "扬州城-杂货铺"
        },
        "长鞭": {
            "id": null,
            "type": "wht",
            "sales": "杂货铺老板 杨永福",
            place: "扬州城-杂货铺"
        },
        "钓鱼竿": {
            "id": null,
            "type": "wht",
            "sales": "杂货铺老板 杨永福",
            place: "扬州城-杂货铺"
        },
        "鱼饵": {
            "id": null,
            "type": "wht",
            "sales": "杂货铺老板 杨永福",
            place: "扬州城-杂货铺"
        },

        //扬州城-打铁铺
        "铁剑": {
            "id": null,
            "type": "wht",
            "sales": "铁匠铺老板 铁匠",
            place: "扬州城-打铁铺"
        },
        "钢刀": {
            "id": null,
            "type": "wht",
            "sales": "铁匠铺老板 铁匠",
            place: "扬州城-打铁铺"
        },
        "铁棍": {
            "id": null,
            "type": "wht",
            "sales": "铁匠铺老板 铁匠",
            place: "扬州城-打铁铺"
        },
        "铁杖": {
            "id": null,
            "type": "wht",
            "sales": "铁匠铺老板 铁匠",
            place: "扬州城-打铁铺"
        },
        "铁镐": {
            "id": null,
            "type": "wht",
            "sales": "铁匠铺老板 铁匠",
            place: "扬州城-打铁铺"
        },
        "飞镖": {
            "id": null,
            "type": "wht",
            "sales": "铁匠铺老板 铁匠",
            place: "扬州城-打铁铺"
        },

        //扬州城-药铺
        "金创药": {
            "id": null,
            "type": "hig",
            "sales": "药铺老板 平一指",
            place: "扬州城-药铺"
        },
        "引气丹": {
            "id": null,
            "type": "hig",
            "sales": "药铺老板 平一指",
            place: "扬州城-药铺"
        },
        "养精丹": {
            "id": null,
            "type": "hig",
            "sales": "药铺老板 平一指",
            place: "扬州城-药铺"
        },
    };
    var equip = {
        "铁镐": 0,
    };
    var npcs = {
        "店小二": 0
    };
    var place = {
        "住房": "jh fam 0 start;go west;go west;go north;go enter",
        "练功房": "jh fam 0 start;go west;go west;go north;go enter;go west",
        "仓库": "jh fam 0 start;go north;go west;store",
        "扬州城-广场": "jh fam 0 start",
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
        "少林派-竹林": "jh fam 2 start;go north;go north;go northwest;go northeast;go north;go north;go north;go north",
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
        "峨嵋派-金顶": "jh fam 4 start",
        "峨嵋派-庙门": "jh fam 4 start;go west",
        "峨嵋派-广场": "jh fam 4 start;go west;go south",
        "峨嵋派-走廊": "jh fam 4 start;go west;go south;go west",
        "峨嵋派-休息室": "jh fam 4 start;go west;go south;go east;go south",
        "峨嵋派-厨房": "jh fam 4 start;go west;go south;go east;go east",
        "峨嵋派-练功房": "jh fam 4 start;go west;go south;go west;go west",
        "峨嵋派-小屋": "jh fam 4 start;go west;go south;go west;go north;go north",
        "峨嵋派-清修洞": "jh fam 4 start;go west;go south;go west;go south;go south",
        "峨嵋派-大殿": "jh fam 4 start;go west;go south;go south",
        "峨嵋派-睹光台": "jh fam 4 start;go northup",
        "峨嵋派-华藏庵": "jh fam 4 start;go northup;go east",
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
        "武道塔": "jh fam 9 start"
    };
    var drop_list = [];
    var fenjie_list = [];

    var role;
    var family = null;
    var sm_loser = null;
    var wudao_pfm = "1";
    var ks_pfm = "2000";
    var ks_wait = "120";
    var automarry = null;
    var autoKsBoss = null;
    var stopauto = false;
    var getitemShow = null;
    var zmlshowsetting = 0;
    var auto_command = null;
    var eqlist = {
        1: [],
        2: [],
        3: []
    };
    var unauto_pfm = '';
    var auto_pfmswitch = null;
    var autoeq = 0;
    //自命令数组  type 0 原生 1 自命令 2js
    //[{"name":"name","zmlRun":"zzzz","zmlShow":"1","zmlType":"0"}]
    var zml = [];
    //自定义存取
    var zdy_item_store = '';
    //自定义丢弃
    var zdy_item_drop = '';
    //自定义分解
    var zdy_item_fenjie = '';
    //状态监控 type 类型 0 =其他人 1= 本人 send 命令数组
    //[{"name":"","type":"status","action":"remove","keyword":"busy","ishave":"0","send":"","isactive":"1","maxcount":10,"pname":"宋远桥"}]
    var ztjk_item = [];
    //快捷键功能
    var KEY = {
        keys: [],
        roomItemSelectIndex: -1,
        init: function () {
            //添加快捷键说明
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

            $(document).on("keydown", this.e);

            this.add(27, function () {
                KEY.dialog_close();
            });
            this.add(192, function () {
                $(".map-icon").click();
            });
            this.add(32, function () {
                KEY.dialog_confirm();
            });
            this.add(83, function () {
                KEY.do_command("stopstate");
            });
            this.add(13, function () {
                KEY.do_command("showchat");
            });
            this.add(65, function () {
                KEY.do_command("showcombat");
            });
            this.add(67, function () {
                KEY.do_command("showtool");
            });
            this.add(66, function () {
                KEY.do_command("pack");
            });
            this.add(76, function () {
                KEY.do_command("tasks");
            });
            this.add(79, function () {
                KEY.do_command("score");
            });
            this.add(74, function () {
                KEY.do_command("jh");
            });
            this.add(75, function () {
                KEY.do_command("skills");
            });
            this.add(73, function () {
                KEY.do_command("stats");
            });
            this.add(85, function () {
                KEY.do_command("message");
            });
            this.add(80, function () {
                KEY.do_command("shop");
            });
            this.add(188, function () {
                KEY.do_command("setting");
            });

            this.add(81, function () {
                WG.sm_button();
            });
            this.add(87, function () {
                WG.go_yamen_task();
            });
            this.add(69, function () {
                WG.kill_all();
            });
            this.add(82, function () {
                WG.get_all();
            });
            this.add(84, function () {
                WG.sell_all();
            });
            this.add(89, function () {
                WG.zdwk();
            });

            this.add(9, function () {
                KEY.onRoomItemSelect();
                return false;
            });

            //方向
            this.add(102, function () {
                WG.Send("go east");
                KEY.onChangeRoom();
            });
            this.add(39, function () {
                WG.Send("go east");
                KEY.onChangeRoom();
            });
            this.add(100, function () {
                WG.Send("go west");
                KEY.onChangeRoom();
            });
            this.add(37, function () {
                WG.Send("go west");
                KEY.onChangeRoom();
            });
            this.add(98, function () {
                WG.Send("go south");
                KEY.onChangeRoom();
            });
            this.add(40, function () {
                WG.Send("go south");
                KEY.onChangeRoom();
            });
            this.add(104, function () {
                WG.Send("go go north");
                KEY.onChangeRoom();
            });
            this.add(38, function () {
                WG.Send("go north");
                KEY.onChangeRoom();
            });
            this.add(99, function () {
                WG.Send("go southeast");
                KEY.onChangeRoom();
            });
            this.add(97, function () {
                WG.Send("go southwest");
                KEY.onChangeRoom();
            });
            this.add(105, function () {
                WG.Send("go northeast");
                KEY.onChangeRoom();
            });
            this.add(103, function () {
                WG.Send("go northwest");
                KEY.onChangeRoom();
            });

            this.add(49, function () {
                KEY.combat_commands(0);
            });
            this.add(50, function () {
                KEY.combat_commands(1);
            });
            this.add(51, function () {
                KEY.combat_commands(2);
            });
            this.add(52, function () {
                KEY.combat_commands(3);
            });
            this.add(53, function () {
                KEY.combat_commands(4);
            });
            this.add(54, function () {
                KEY.combat_commands(5);
            });

            //alt
            this.add(49 + 512, function () {
                KEY.onRoomItemAction(0);
            });
            this.add(50 + 512, function () {
                KEY.onRoomItemAction(1);
            });
            this.add(51 + 512, function () {
                KEY.onRoomItemAction(2);
            });
            this.add(52 + 512, function () {
                KEY.onRoomItemAction(3);
            });
            this.add(53 + 512, function () {
                KEY.onRoomItemAction(4);
            });
            this.add(54 + 512, function () {
                KEY.onRoomItemAction(5);
            });
            //ctrl
            this.add(49 + 1024, function () {
                KEY.room_commands(0);
            });
            this.add(50 + 1024, function () {
                KEY.room_commands(1);
            });
            this.add(51 + 1024, function () {
                KEY.room_commands(2);
            });
            this.add(52 + 1024, function () {
                KEY.room_commands(3);
            });
            this.add(53 + 1024, function () {
                KEY.room_commands(4);
            });
            this.add(54 + 1024, function () {
                KEY.room_commands(5);
            });
        },
        add: function (k, c) {
            var tmp = {
                key: k,
                callback: c,
            };
            this.keys.push(tmp);
        },
        e: function (event) {
            if ($(".channel-box").is(":visible")) {
                KEY.chatModeKeyEvent(event);
                return;
            }

            if ($(".dialog-confirm").is(":visible") &&
                ((event.keyCode >= 48 && event.keyCode <= 57) || (event.keyCode >= 96 && event.keyCode <= 105)))
                return;

            if ($('input').is(':focus') || $('textarea').is(':focus')) {

                return;
            }
            var kk = (event.ctrlKey || event.metaKey ? 1024 : 0) + (event.altKey ? 512 : 0) + event.keyCode;
            for (var k of KEY.keys) {
                if (k.key == kk)
                    return k.callback();
            }
        },
        dialog_close: function () {
            $(".dialog-close").click();
        },
        dialog_confirm: function () {
            $(".dialog-btn.btn-ok").click();
        },
        do_command: function (name) {
            $("span[command=" + name + "]").click();
        },
        room_commands: function (index) {
            $("div.combat-panel div.room-commands span:eq(" + index + ")").click();
        },
        combat_commands: function (index) {
            $("div.combat-panel div.combat-commands span.pfm-item:eq(" + index + ")").click();
        },
        chatModeKeyEvent: function (event) {
            if (event.keyCode == 27) {
                KEY.dialog_close();
            } else if (event.keyCode == 13) {
                if ($(".sender-box").val().length) $(".sender-btn").click();
                else KEY.dialog_close();
            }
        },
        onChangeRoom: function () {
            KEY.roomItemSelectIndex = -1;
        },
        onRoomItemSelect: function () {
            if (KEY.roomItemSelectIndex != -1) {
                $(".room_items div.room-item:eq(" + KEY.roomItemSelectIndex + ")").css("background", "#000");
            }
            KEY.roomItemSelectIndex = (KEY.roomItemSelectIndex + 1) % $(".room_items div.room-item").length;
            var curItem = $(".room_items div.room-item:eq(" + KEY.roomItemSelectIndex + ")");
            curItem.css("background", "#444");
            curItem.click();
        },
        onRoomItemAction: function (index) {
            //NPC下方按键
            $(".room_items .item-commands span:eq(" + index + ")").click();
        },
    }

    function messageClear() {
        $(".WG_log pre").html("");
    }
    var log_line = 0;

    function messageAppend(m, t = 0) {
        100 < log_line && (log_line = 0, $(".WG_log pre").empty());
        var ap = m + "\n";
        if (t == 1) {
            ap = "<hiy>" + ap + "</hiy>";
        } else if (t == 2) {
            ap = "<hig>" + ap + "</hig>";
        } else if (t == 3) {
            ap = "<hiw>" + ap + "</hiw>";
        }
        $(".WG_log pre").append(ap);
        log_line++;
        $(".WG_log")[0].scrollTop = 99999;
    }
    var sm_array = {
        '武当': {
            place: "武当派-三清殿",
            npc: "武当派第二代弟子 武当首侠 宋远桥",
            sxplace: "武当派-太子岩",
            sx: "首席弟子"
        },
        '华山': {
            place: "华山派-客厅",
            npc: "华山派掌门 君子剑 岳不群",
            sxplace: "华山派-练武场",
            sx: "首席弟子"
        },
        '少林': {
            place: "少林派-天王殿",
            npc: "少林寺第三十九代弟子 道觉禅师",
            sxplace: "少林派-练武场",
            sx: "大师兄"
        },
        '逍遥': {
            place: "逍遥派-青草坪",
            npc: "聪辩老人 苏星河",
            sxplace: "-jh fam 5 start;go west",
            sx: "首席弟子"
        },
        '丐帮': {
            place: "丐帮-树洞下",
            npc: "丐帮七袋弟子 左全",
            sxplace: "丐帮-破庙密室",
            sx: "首席弟子"
        },
        '峨嵋': {
            place: "峨嵋派-大殿",
            npc: "峨眉派第四代弟子 静心",
            sxplace: "峨嵋派-广场",
            sx: "大师姐"
        },
        '武馆': {
            place: "扬州城-扬州武馆",
            npc: "武馆教习",
            sxplace: "扬州城-扬州武馆"
        },
        '杀手楼': {
            place: "杀手楼-大厅",
            npc: "杀手教习 何小二",
            sxplace: "杀手楼-练功房",
            sx: "金牌杀手"
        },
    };
    var WG = {
        sm_state: -1,
        sm_item: null,
        init: function () {
            $("li[command=SelectRole]").on("click", function () {
                WG.login();
            });
        },
        inArray: function (val, arr) {
            for (let i = 0; i < arr.length; i++) {
                let item = arr[i];
                if (item[0] == "<") {
                    if (item == val) return true;

                } else {
                    if (item != "") {
                        if (val.indexOf(item) >= 0) return true;
                    }
                }
            }
            return false;
        },
        login: function () {
            role = $('.role-list .select').text().split(/[\s\n]/).pop();
            $(".bottom-bar").append("<span class='item-commands' style='display:none'><span WG='WG' cmd=''></span></span>"); //命令行模块
            var html = UI.btnui;
            $(".content-message").after(html);
            $('.content-bottom').after("<div class='zdy-commands'></div>");
            var css = `.zdy-item{
                display: inline-block;border: solid 1px gray;color: gray;background-color: black;
                text-align: center;cursor: pointer;border-radius: 0.25em;min-width: 2.5em;margin-right: 0em;
                margin-left: 0.4em;position: relative;padding-left: 0.4em;padding-right: 0.4em;line-height: 24px;}
                .WG_log{flex: 1;overflow-y: auto;border: 1px solid #404000;max-height: 15em;width: calc(100% - 40px);}
                .WG_log > pre{margin: 0px; white-space: pre-line;}
                .WG_button { width: calc(100% - 40px);}
                .item-plushp{display: inline-block;float: right;width: 100px;}
                .item-dps{display: inline-block;float: right;width: 100px;}
                .settingbox {margin-left: 0.625 em;border: 1px solid gray;background-color: transparent;color: unset;resize: none;width: 80% ;height: 3rem;}
                .runtest textarea{display:block;width:300px;height:160px;border:10px solid #F8F8F8;border-top-width:0;padding:10px;line-height:20px;overflow:auto;background-color:#3F3F3F;color:#eee;font-size:12px;font-family:Courier New}
                .runtest a{position:absolute;right:20px;bottom:20px}
                .layui-btn,.layui-input,.layui-select,.layui-textarea,.layui-upload-button{outline:0;-webkit-appearance:none;transition:all .3s;-webkit-transition:all .3s;box-sizing:border-box}
                .layui-btn{display:inline-block;height:38px;line-height:38px;padding:0 18px;background-color:#009688;color:#fff;white-space:nowrap;text-align:center;font-size:14px;border:none;border-radius:2px;cursor:pointer}
                .layui-btn-normal{background-color:#1E9FFF}
                .layui-layer-moves{background-color:transparent}
            `;
            GM_addStyle(css);
            var pgoods = goods;
            goods = GM_getValue("goods", goods);
            if ((goods['养精丹'] && goods['养精丹'].type == undefined) || goods['飞镖'] == undefined) {
                goods = pgoods;
            }
            npcs = GM_getValue("npcs", npcs);
            equip = GM_getValue(role + "_equip", equip);
            family = GM_getValue(role + "_family", family);
            automarry = GM_getValue(role + "_automarry", automarry);
            autoKsBoss = GM_getValue(role + "_autoKsBoss", autoKsBoss);
            ks_pfm = GM_getValue(role + "_ks_pfm", ks_pfm);
            ks_wait = GM_getValue(role + "_ks_wait", ks_wait);
            eqlist = GM_getValue(role + "_eqlist", eqlist);
            autoeq = GM_getValue(role + "_auto_eq", autoeq);
            if (family == null) {
                family = $('.role-list .select').text().substr(0, 2);
            }
            wudao_pfm = GM_getValue(role + "_wudao_pfm", wudao_pfm);
            sm_loser = GM_getValue(role + "_sm_loser", sm_loser);
            unauto_pfm = GM_getValue(role + "_unauto_pfm", unauto_pfm);
            auto_pfmswitch = GM_getValue(role + "_auto_pfmswitch", auto_pfmswitch);
            blacklist = GM_getValue(role + "_blacklist", blacklist);
            blacklist = blacklist.split(",");
            getitemShow = GM_getValue(role + "_getitemShow", getitemShow);
            if (getitemShow == "已开启") {
                G.getitemShow = true;
            } else {
                G.getitemShow = false;
            }
            //自命令
            zml = GM_getValue(role + "_zml", zml);

            //自定义存储
            zdy_item_store = GM_getValue(role + "_zdy_item_store", zdy_item_store);
            zdy_item_drop = GM_getValue(role + "_zdy_item_drop", zdy_item_drop);
            zdy_item_fenjie = GM_getValue(role + "_zdy_item_fenjie", zdy_item_fenjie);
            if (zdy_item_store) {
                store_list = store_list.concat(zdy_item_store.split(","));
            }
            if (zdy_item_drop) {
                drop_list = drop_list.concat(zdy_item_drop.split(","));
            }
            if (zdy_item_fenjie) {
                fenjie_list = fenjie_list.concat(zdy_item_fenjie.split(","));
            }
            ztjk_item = GM_getValue(role + "_ztjk", ztjk_item);
            if (auto_pfmswitch == '已开启') {
                G.auto_preform = true;
            }
            //自动后命令获取
            auto_command = GM_getValue(role + "_auto_command", auto_command);
            var unpfm = unauto_pfm.split(',');
            for (var pfmname of unpfm) {
                if (pfmname)
                    blackpfm.push(pfmname);
            }

            $(".sm_button").on("click", WG.sm_button);
            $(".go_yamen_task").on("click", WG.go_yamen_task);
            $(".kill_all").on("click", WG.kill_all);
            $(".get_all").on("click", WG.get_all);
            $(".sell_all").on("click", WG.clean_all);
            $(".zdwk").on("click", WG.zdwk);
            $(".auto_perform").on("click", WG.auto_preform_switch);
            $(".cmd_echo").on("click", WG.cmd_echo_button);

            setTimeout(() => {
                role = role;
                var logintext = '';
                document.title = role + "-MUD游戏-武神传说";

                L.msg(`欢迎使用 版本号${GM_info.script.version}`);
                KEY.do_command("showtool");
                KEY.do_command("pack");
                KEY.do_command("score");
                setTimeout(() => {
                    //bind settingbox
                    $('.WG_log').on('click', '.zdy-box', function () {

                        //判断
                        if (L.isMobile()) {

                            var p_input = $(this);
                            var previnfo = p_input.prev().text();
                            var data = prompt(previnfo, $(this).val());
                            if (data && data != "") {
                                p_input.val(data);
                                p_input.change();
                            } else {
                                let res = confirm("确认清空?");
                                if (res) {
                                    p_input.val("");
                                    p_input.change();
                                }
                            }

                        }
                    });
                    KEY.do_command("score");
                    var rolep = role;
                    if (G.level) {
                        rolep = G.level + role;
                        if (G.level.indexOf('武帝') >= 0) {
                            $('.zdy-item.zdwk').html("修炼(Y)");
                        }
                    }

                    if (WebSocket) {

                        if (npcs['店小二'] == 0) {
                            logintext = `
<hiy>欢迎${rolep},插件已加载！第一次使用,请在设置中,初始化ID,并且设置一下是否自动婚宴,自动传送boss
插件版本: ${GM_info.script.version}
</hiy>`;
                        } else {
                            logintext = `
                        <hiy>欢迎${rolep},插件已加载！
                        插件版本: ${GM_info.script.version}
                        更新日志: ${updateinfo}
                        </hiy>`;
                        }
                        Helper.ztjk_func();
                        Helper.zml_showp();
                    } else {
                        logintext = `
<hiy>欢迎${role},插件未正常加载！
当前浏览器不支持自动喜宴自动boss,请使用火狐浏览器
谷歌系浏览器,请在network中勾选disable cache,多刷新几次,直至提示已加载!
插件版本: ${GM_info.script.version}
</hiy>`;
                    }
                    messageAppend(logintext);

                }, 500);
                KEY.do_command("showcombat");
                WG.Send("taskover zz1");
            }, 1000);
        },
        updete_goods_id: function () {
            var lists = $(".dialog-list > .obj-list:first");
            var id;
            var name;
            if (lists.length) {
                messageAppend("检测到商品清单");
                for (var a of lists.children()) {
                    a = $(a);
                    id = a.attr("obj");
                    name = $(a.children()[0]).html();
                    goods[name].id = id;
                    messageAppend(name + ":" + id);
                }
                GM_setValue("goods", goods);
                return true;
            } else {
                messageAppend("未检测到商品清单");
                return false;
            }
        },
        updete_npc_id: function () {
            var lists = $(".room_items .room-item");

            for (var npc of lists) {
                if (npc.lastElementChild.innerText.indexOf("[") >= 0) {
                    if (npc.lastElementChild.lastElementChild.lastElementChild.lastElementChild == null) {
                        if (npc.lastElementChild.firstChild.nodeType == 3 &&
                            npc.lastElementChild.firstChild.nextSibling.tagName == "SPAN") {
                            npcs[npc.lastElementChild.innerText.split('[')[0]] = $(npc).attr("itemid");
                            messageAppend(npc.lastElementChild.innerText.split('[')[0] + " 的ID:" + $(npc).attr("itemid"));
                        }
                    }
                } else {
                    if (npc.lastElementChild.lastElementChild == null) {
                        npcs[npc.lastElementChild.innerText] = $(npc).attr("itemid");
                        messageAppend(npc.lastElementChild.innerText + " 的ID:" + $(npc).attr("itemid"));
                    }
                }
            }
            GM_setValue("npcs", npcs);
        },
        updete_id_all: function () {
            if (goods['养精丹'].type == undefined || goods['飞镖'] == undefined) {
                GM_setValue('goods', "");
            }
            var t = [];
            Object.keys(goods).forEach(function (key) {
                if (t[goods[key].place] == undefined)
                    t[goods[key].place] = goods[key].sales;
            });
            var keys = Object.keys(t);
            var i = 0;
            var state = 0;
            var place, sales;
            //获取
            var timer = setInterval(() => {

                switch (state) {
                    case 0:
                        if (i >= keys.length) {
                            messageAppend("初始化完成");
                            WG.go("武当派-广场");
                            clearInterval(timer);
                            return;
                        }
                        place = keys[i];
                        sales = t[place];
                        WG.go(place);
                        state = 1;
                        break;
                    case 1:
                        WG.updete_npc_id();
                        var id = npcs[sales];
                        WG.Send("list " + id);
                        state = 2;
                        break;
                    case 2:
                        if (WG.updete_goods_id()) {
                            state = 0;
                            i++;
                        } else
                            state = 1;
                        break;
                }
            }, 1000);
        },
        Send: async function (cmd) {
            if (cmd) {
                cmd = cmd instanceof Array ? cmd : cmd.split(';');
                for (var c of cmd) {
                    $("span[WG='WG']").attr("cmd", c).click();
                };
            }
        },
        SendStep: async function (cmd) {
            if (cmd) {
                cmd = cmd instanceof Array ? cmd : cmd.split(';');
                for (var c of cmd) {
                    WG.Send(c);
                    await WG.sleep(12000);

                };
            }
        },
        SendCmd: async function (cmd) {
            if (cmd) {
                if (cmd.indexOf(",") >= 0) {
                    if (cmd instanceof Array) {
                        cmd = cmd;
                    } else {
                        if (cmd.indexOf(";") >= 0) {
                            cmd = cmd.split(";");
                        } else {
                            cmd = cmd.split(",");
                        }
                    }
                } else {
                    cmd = cmd instanceof Array ? cmd : cmd.split(';');
                }
                let idx = 0;
                let cmds = '';
                for (var c of cmd) {
                    if (c.indexOf("$") >= 0) {
                        if (c[0] == "$") {
                            c = c.replace("$", "");
                            let p0 = c.split(" ")[0];
                            let p1 = c.split(" ")[1];
                            cmds = cmd.join(";");
                            eval("T." + p0 + "(" + idx + ",'" + p1 + "','" + cmds + "')");
                            return;
                        } else {
                            var p_c = c.split(" ");
                            p_c = p_c[p_c.length - 1];
                            if (p_c) {
                                if (p_c[0] == "$") {
                                    p_c = p_c.replace("$", "");
                                    let patt = new RegExp(/\".*?\"/);
                                    let result = patt.exec(p_c)[0];
                                    cmds = cmd.join(";");
                                    eval("T." + p_c.split('(')[0] + "(" + idx + "," + result + ",'" + cmds + "')");
                                    return;
                                }
                            } else {
                                return;
                            }
                        }
                    }
                    WG.Send(c);
                    idx = idx + 1;
                };
            }
        },
        sleep: function (time) {
            return new Promise((resolve) => setTimeout(resolve, time));
        },
        stopAllAuto: function () {
            stopauto = true;
        },
        reSetAllAuto: function () {
            stopauto = false;
        },
        go: async function (p) {
            if (needfind[p] == undefined) {
                if (WG.at(p)) {
                    return;
                }
            }
            if (place[p] != undefined) {
                WG.Send(place[p]);
            }
        },
        at: function (p) {
            var w = $(".room-name").html();
            return w.indexOf(p) == -1 ? false : true;
        },

        getIdByName: function (n) {
            for (let i = 0; i < roomData.length; i++) {
                if (roomData[i].name && roomData[i].name.indexOf(n) >= 0) {
                    return roomData[i].id;
                }
            }
            return null;
        },

        smhook: undefined,
        sm: function () {
            if (!WG.smhook) {
                WG.smhook = WG.add_hook('text', function (data) {
                    if (data.msg.indexOf("辛苦了， 你先去休息") >= 0 ||
                        data.msg.indexOf("和本门毫无瓜葛") >= 0 ||
                        data.msg.indexOf("你没有") >= 0
                    ) {
                        WG.Send("taskover signin");
                        WG.sm_state = -1;
                        $(".sm_button").text("师门(Q)");
                        WG.remove_hook(WG.smhook);
                        WG.smhook = undefined;

                    }
                });
            }
            switch (WG.sm_state) {
                case 0:
                    //前往师门接收任务
                    WG.go(sm_array[family].place);
                    WG.sm_state = 1;
                    setTimeout(WG.sm, 700);
                    break;
                case 1:
                    //接受任务
                    var lists = $(".room_items .room-item");
                    var id = null;

                    for (var npc of lists) {
                        if (npc.lastElementChild.innerText.indexOf("[") >= 0) {
                            if (npc.lastElementChild.lastElementChild.lastElementChild.lastElementChild == null) {
                                if (npc.lastElementChild.firstChild.nodeType == 3 &&
                                    npc.lastElementChild.firstChild.nextSibling.tagName == "SPAN") {

                                    if (npc.lastElementChild.innerText.split('[')[0] == sm_array[family].npc)
                                        id = $(npc).attr("itemid");
                                }
                            }
                        } else {
                            if (npc.lastElementChild.lastElementChild == null) {
                                if (npc.lastElementChild.innerText == sm_array[family].npc) {
                                    id = $(npc).attr("itemid");
                                }
                            }
                        }
                    }
                    console.log(id);
                    if (id != undefined) {
                        WG.Send("task sm " + id);
                        WG.Send("task sm " + id);
                        WG.sm_state = 2;
                    } else {
                        WG.updete_npc_id();
                    }
                    setTimeout(WG.sm, 300);
                    break;
                case 2:
                    var mysm_loser = GM_getValue(role + "_sm_loser", sm_loser);
                    //获取师门任务物品
                    var item = $("span[cmd$='giveup']:last").parent().prev();
                    if (item.length == 0) {
                        WG.sm_state = 0;
                        setTimeout(WG.sm, 1000);
                        return;
                    };
                    var itemName = item.html();
                    item = item[0].outerHTML;
                    //(逗比写法)
                    //能上交直接上交
                    var tmpObj = $("span[cmd$='giveup']:last").prev();
                    for (let i = 0; i < 6; i++) {
                        if (tmpObj.children().html()) {
                            if (tmpObj.html().indexOf(item) >= 0) {
                                tmpObj.click();
                                messageAppend("自动上交" + item);
                                WG.sm_state = 0;
                                setTimeout(WG.sm, 100);
                                return;
                            }
                            tmpObj = tmpObj.prev();
                        }
                    }
                    //不能上交自动购买
                    WG.sm_item = goods[itemName];
                    if (WG.sm_item != undefined && item.indexOf(WG.sm_item.type) >= 0) {
                        WG.go(WG.sm_item.place);
                        messageAppend("自动购买" + item);
                        WG.sm_state = 3;
                        setTimeout(WG.sm, 1000);
                    } else {
                        messageAppend("无法购买" + item);
                        if (mysm_loser == '已停止') {
                            WG.sm_state = -1;
                            $(".sm_button").text("师门(Q)");
                        } else {
                            $("span[cmd$='giveup']:last").click();
                            messageAppend("放弃任务");
                            WG.sm_state = 0;
                            setTimeout(WG.sm, 100);
                            return;
                        }
                    }
                    break;
                case 3:
                    WG.go(WG.sm_item.place);
                    if (WG.buy(WG.sm_item)) {
                        WG.sm_state = 0;
                    }
                    setTimeout(WG.sm, 1000);
                    break;
                default:
                    break;
            }
        },
        sm_button: function () {
            if (WG.sm_state >= 0) {
                WG.sm_state = -1;
                $(".sm_button").text("师门(Q)");
            } else {
                WG.sm_state = 0;
                $(".sm_button").text("停止(Q)");
                setTimeout(WG.sm, 200);
            }
        },
        buy: function (good) {
            var tmp = npcs[good.sales];
            if (tmp == undefined) {
                WG.updete_npc_id();
                return false;
            }
            WG.Send("list " + tmp);
            WG.Send("buy 1 " + good.id + " from " + tmp);
            return true;
        },
        Give: function (items) {
            var tmp = npcs["店小二"];
            if (tmp == undefined) {
                WG.updete_npc_id();
                return false;
            }
            WG.Send("give " + tmp + " " + items);
            return true;

        },
        eq: function (e) {
            WG.Send("eq " + equip[e]);
        },
        ask: function (npc, i) {
            npc = npcs[npc];
            if (npc != undefined)
                WG.Send("ask" + i + " " + npc);
            else
                WG.updete_npc_id();
        },
        yamen_lister: undefined,
        go_yamen_task: async function () {
            if (!WG.yamen_lister) {
                WG.yamen_lister = WG.add_hook('text', function (data) {
                    if (data.msg.indexOf("最近没有在逃的逃犯了，你先休息下吧。") >= 0) {
                        clearInterval(WG.check_yamen_task);
                        WG.check_yamen_task = 'over';
                        WG.remove_hook(WG.yamen_lister);
                        WG.yamen_lister = undefined;

                    } else if (data.msg.indexOf("没有这个人") >= 0) {
                        WG.updete_npc_id();
                    }
                });
            }
            WG.go("扬州城-衙门正厅");
            await WG.sleep(200);
            WG.updete_npc_id();
            WG.ask("扬州知府 程药发", 1);
            if (WG.check_yamen_task == 'over') {
                return;
            }
            window.setTimeout(WG.check_yamen_task, 1000);
        },

        check_yamen_task: function () {
            if (WG.check_yamen_task == 'over') {
                return;
            }
            messageAppend("查找任务中");
            var task = $(".task-desc:eq(-2)").text();
            if (task.indexOf("扬州知府") == -1) {
                task = $(".task-desc:eq(-3)").text();
            }
            if (task.length == 0) {
                KEY.do_command("tasks");
                window.setTimeout(WG.check_yamen_task, 1000);
                return;
            }
            try {
                zb_npc = task.match("犯：([^%]+)，据")[1];
                zb_place = task.match("在([^%]+)出")[1];
                messageAppend("追捕任务：" + zb_npc + "   地点：" + zb_place);
                KEY.do_command("score");
                WG.go(zb_place);
                window.setTimeout(WG.check_zb_npc, 1000);
            } catch (error) {
                messageAppend("查找衙门追捕失败");
                window.setTimeout(WG.check_yamen_task, 1000);
            }
        },
        zb_next: 0,
        check_zb_npc: function () {
            var lists = $(".room_items .room-item");
            var found = false;

            for (var npc of lists) {
                if (npc.innerText.indexOf(zb_npc) != -1) {
                    found = true;
                    WG.Send("kill " + $(npc).attr("itemid"));
                    messageAppend("找到" + zb_npc + "，自动击杀！！！");
                    return;
                }
            }
            var fj = needfind[zb_npc];
            if (!found && needfind[zb_npc] != undefined && zb_next < fj.length) {
                messageAppend("寻找附近");
                WG.Send(fj[zb_next]);
                zb_next++;
            }
            if (!found) {
                window.setTimeout(WG.check_zb_npc, 1000);
            }
        },

        kill_all: function () {


            var lists = $(".room_items .room-item");
            for (var npc of lists) {
                WG.Send("kill " + $(npc).attr("itemid"));

            }
        },

        get_all: function () {

            var lists = $(".room_items .room-item");
            for (var npc of lists) {
                WG.Send("get all from " + $(npc).attr("itemid"));
            }

        },
        clean_all: function () {
            WG.go("扬州城-打铁铺");
            WG.Send("sell all");
        },
        packup_listener: null,
        sell_all: function () {
            if (WG.packup_listener) {
                messageAppend("<hio>包裹整理</hio>运行中");
                messageAppend("<hio>包裹整理</hio>手动结束");
                WG.remove_hook(WG.packup_listener);
                WG.packup_listener = undefined;
                return;
            }
            let stores = [];
            WG.packup_listener = WG.add_hook(["dialog", "text"], (data) => {
                if (data.type == "dialog" && data.dialog == "list") {
                    if (data.stores == undefined) {
                        return;
                    }
                    stores = [];
                    //去重
                    for (let i = 0; i < data.stores.length; i++) {
                        let s = null;
                        for (let j = 0; j < stores.length; j++) {
                            if (stores[j].name == data.stores[i].name) {
                                s = stores[j];
                                break;
                            }
                        }
                        if (s != null) {
                            s.count += data.stores[i].count;
                        } else {
                            stores.push(data.stores[i]);
                        }
                    }
                } else if (data.type == "dialog" && data.dialog == "pack") {
                    let cmds = [];
                    let dropcmds = [];
                    for (var i = 0; i < data.items.length; i++) {
                        //仓库
                        if (store_list.length != 0) {
                            if (WG.inArray(data.items[i].name, store_list)) {
                                if (data.items[i].can_eq) {
                                    //装备物品，不能叠加，计算总数
                                    let store = null;
                                    for (let j = 0; j < stores.length; j++) {
                                        if (stores[j].name == data.items[i].name) {
                                            store = stores[j];
                                            break;
                                        }
                                    }
                                    if (store != null) {
                                        if (store.count < 4) {
                                            store.count += data.items[i].count;
                                            cmds.push("store " + data.items[i].count + " " + data.items[i].id);
                                            cmds.push("$wait 200");
                                            messageAppend("<hio>包裹整理</hio>" + data.items[i].name + "储存到仓库");
                                        } else {
                                            messageAppend("<hio>包裹整理</hio>" + data.items[i].name + "超过设置的储存上限");
                                        }
                                    } else {
                                        stores.push(data.items[i]);
                                        cmds.push("store " + data.items[i].count + " " + data.items[i].id);
                                        cmds.push("$wait 200");
                                        messageAppend("<hio>包裹整理</hio>" + data.items[i].name + "储存到仓库");
                                    }
                                } else {
                                    cmds.push("store " + data.items[i].count + " " + data.items[i].id);
                                    cmds.push("$wait 200");
                                    messageAppend("<hio>包裹整理</hio>" + data.items[i].name + "储存到仓库");
                                }
                            }
                        }
                        //丢弃
                        if (WG.inArray(data.items[i].name, drop_list)) {
                            if (data.items[i].count == 1) {
                                dropcmds.push("drop " + data.items[i].id);
                            } else {
                                dropcmds.push("drop " + data.items[i].count + " " + data.items[i].id);
                            }
                            cmds.push("$wait 200");
                            messageAppend("<hio>包裹整理</hio>" + data.items[i].name + "丢弃");

                        }
                        //分解
                        if (fenjie_list.length && WG.inArray(data.items[i].name, fenjie_list) && data.items[i].name.indexOf("★") == -1) {
                            cmds.push("fenjie " + data.items[i].id);
                            cmds.push("$wait 200");
                            messageAppend("<hio>包裹整理</hio>" + data.items[i].name + "分解");

                        }
                    }
                    cmds.push("$to 扬州城-杂货铺");
                    cmds.push("sell all");
                    cmds.push("$wait 1000");
                    cmds = cmds.concat(dropcmds);
                    cmds.push("look3 1");
                    if (cmds.length > 0) {
                        WG.SendCmd(cmds);
                    }
                } else if (data.type == 'text' && data.msg == '没有这个玩家。') {
                    messageAppend("<hio>包裹整理</hio>完成");
                    WG.remove_hook(WG.packup_listener);
                    WG.packup_listener = undefined;
                }
            });

            messageAppend("<hio>包裹整理</hio>开始");
            WG.go("仓库");
            WG.Send("store;pack");
        },
        cmd_echo_button: function () {
            if (G.cmd_echo) {
                G.cmd_echo = false;
                messageAppend("<hio>命令代码关闭</hio>");
            } else {
                G.cmd_echo = true;
                ProConsole.init();
                messageAppend("<hio>命令代码显示</hio>");
            }
        },
        zdwk: function (v) {
            if (G.level) {
                if (G.level.indexOf('武帝') >= 0) {
                    WG.go("练功房");
                    WG.Send("xiulian");
                    return;
                }
            }
            if (WebSocket) {
                if (v == "remove") {
                    if (G.wk_listener) {
                        WG.remove_hook(G.wk_listener);
                        G.wk_listener = undefined;
                    }
                    return;
                }
                if (G.wk_listener) return;
                let tiejiang_id;
                let wk_busy = false;
                G.wk_listener = WG.add_hook(["dialog", "text"], function (data) {
                    if (data.type == "dialog" && data.dialog == "pack") {
                        //检查是否装备铁镐
                        let tiegao_id;
                        if (data.name) {
                            if (data.name == "<wht>铁镐</wht>") {
                                WG.Send("eq " + data.id);
                                WG.go("扬州城-矿山");
                                WG.Send("wa");
                                return;
                            }
                        } else if (data.items) {
                            if (data.eqs[0] && data.eqs[0].name.indexOf("铁镐") > -1) {
                                WG.go("扬州城-矿山");
                                WG.Send("wa");
                                return;
                            } else {
                                for (let i = 0; i < data.items.length; i++) {
                                    let item = data.items[i];
                                    if (item.name.indexOf("铁镐") > -1) {
                                        tiegao_id = item.id;
                                        break;
                                    }
                                }
                                if (tiegao_id) {
                                    WG.Send("eq " + tiegao_id);
                                    WG.go("扬州城-矿山");
                                    WG.Send("wa");
                                    return;
                                } else {
                                    WG.go("扬州城-打铁铺");
                                    WG.Send("look 1");
                                }
                            }
                        }
                    }
                    if (data.type == 'text' && data.msg == '你要看什么？') {
                        let id = WG.find_item("铁匠");
                        if (id) {
                            tiejiang_id = id;
                            WG.Send('list ' + id);
                        } else {
                            messageAppend("<hio>自动挖矿</hio>未发现铁匠");
                            WG.zdwk("remove");
                        }
                    } else if (data.type == 'text') {
                        if (data.msg == '你挥着铁镐开始认真挖矿。') WG.zdwk("remove");
                        else if ((data.msg == "你现在正忙。" || data.msg == "你正在战斗，待会再说。") && wk_busy == false) {
                            wk_busy = true;

                            setTimeout(() => {
                                wk_busy = false;
                                WG.Send("stopstate;pack");
                            }, 5000);
                        }

                    }
                    if (data.type == 'dialog' && data.dialog == 'list' && data.seller == tiejiang_id) {
                        let item_id;
                        for (let i = 0; i < data.selllist.length; i++) {
                            let item = data.selllist[i];
                            if (item.name == "<wht>铁镐</wht>") {
                                item_id = item.id;
                                break;
                            }
                        }
                        if (item_id) {
                            WG.Send('buy 1 ' + item_id + ' from ' + tiejiang_id);
                        } else {
                            messageAppend("<hio>自动挖矿</hio>无法购买<wht>铁镐</wht>");
                            WG.zdwk("remove");
                        }
                    }

                });
                WG.Send("stopstate;pack");
            } else {
                var t = $(".room_items .room-item:first .item-name").text();
                t = t.indexOf("<挖矿");

                if (t == -1) {
                    messageAppend("当前不在挖矿状态");
                    if (timer == 0) {
                        console.log(timer);
                        WG.go("扬州城-矿山");
                        WG.eq("铁镐");
                        WG.Send("wa");
                        timer = setInterval(WG.zdwk, 5000);
                    }
                } else {
                    WG.timer_close();
                }

                if (WG.at("扬州城-矿山") && t == -1) {
                    //不能挖矿，自动买铁镐
                    WG.go("扬州城-打铁铺");
                    WG.buy(goods["铁镐"]);
                    //买完等待下一次检查
                    messageAppend("自动买铁镐");
                    return;
                }
                if (WG.at("扬州城-打铁铺")) {
                    var lists = $(".dialog-list > .obj-list:eq(1)");
                    var id;
                    var name;
                    if (lists.length) {
                        messageAppend("查找铁镐ID");
                        for (var a of lists.children()) {
                            a = $(a);
                            id = a.attr("obj");
                            name = $(a.children()[0]).html();
                            if (name == "铁镐") {
                                equip["铁镐"] = id;

                                WG.eq("铁镐");

                            }
                        }
                        GM_setValue(role + "_equip", equip);
                        WG.go("扬州城-矿山");
                        WG.Send("wa");
                    }
                    return;
                }
            }
        },
        timer_close: function () {
            if (timer) {
                clearInterval(timer);
                timer = 0;
            }
        },
        wudao_auto: function () {
            //创建定时器
            if (timer == 0) {
                timer = setInterval(WG.wudao_auto, 2000);
            }
            if (!WG.at("武道塔")) {
                //进入武道塔
                WG.go("武道塔");
                WG.ask("守门人", 1);
                WG.Send("go enter");
            } else {
                //武道塔内处理
                messageAppend("武道塔");
                var w = $(".room_items .room-item:last");
                var t = w.text();
                if (t.indexOf("守护者") != -1) {
                    WG.Send("kill " + w.attr("itemid"));
                    WG.wudao_autopfm();
                } else {
                    WG.Send("go up");
                }
            }
        },
        wudao_autopfm: function () {
            var pfm = wudao_pfm.split(',');
            for (var p of pfm) {
                if ($("div.combat-panel div.combat-commands span.pfm-item:eq(" + p + ") span").css("left") == "0px")
                    $("div.combat-panel div.combat-commands span.pfm-item:eq(" + p + ") ").click();
            }
        },
        xue_auto: function () {
            var t = $(".room_items .room-item:first .item-name").text();
            t = t.indexOf("<打坐") != -1 || t.indexOf("<学习") != -1 || t.indexOf("<练习") != -1;
            //创建定时器
            if (timer == 0) {
                if (t == false) {
                    messageAppend("当前不在打坐或学技能");
                    return;
                }
                timer = setInterval(WG.xue_auto, 1000);
            }
            if (t == false) {
                //学习状态中止，自动去挖矿
                WG.timer_close();
                WG.zdwk();
            } else {
                messageAppend("自动打坐学技能");
            }
        },
        fbnum: 0,
        needGrove: 0,
        oncegrove: function () {
            this.fbnum += 1;
            messageAppend("第" + this.fbnum + "次");
            WG.Send("cr yz/lw/shangu;cr over");
            if (this.needGrove <= this.fbnum) {
                WG.Send("taskover signin");
                messageAppend("<hiy>" + this.fbnum + "次副本小树林秒进秒退已完成</hiy>");
                WG.remove_hook(Helper.daily_hook);
                Helper.daily_hook = undefined;
                this.timer_close();
                //WG.zdwk();
                this.needGrove = 0;
                this.fbnum = 0;
            }
        },
        grove_ask_info: function () {
            return prompt("请输入需要秒进秒退的副本次数", "");
        },
        grove_auto: function (needG = null) {
            if (timer == 0) {
                if (needG == null) {
                    this.needGrove = this.grove_ask_info();
                } else {
                    this.needGrove = needG;
                }
                if (this.needGrove) //如果返回的有内容
                {
                    if (parseFloat(this.needGrove).toString() == "NaN") {
                        messageAppend("请输入数字");
                        return;
                    }
                    messageAppend("开始秒进秒退小树林" + this.needGrove + "次");

                    timer = setInterval(() => {
                        this.oncegrove()
                    }, 1000);
                }
            }
        },
        showhideborad: function () {
            if ($('.WG_log').css('display') == 'none') {
                $('.WG_log').show();
            } else {
                $('.WG_log').hide();
            }
        },
        calc: function () {
            messageClear();
            var html = UI.jsqui;
            messageAppend(html);
            $("#qnjs").on('click', function () {
                messageAppend("需要潜能:" + Helper.dian(Number($("#c").val()), Number($("#m").val()), Number($("#se").val())));
            });
            $("#kaihua").on('click', function () {
                messageAppend("你的分值:" + Helper.gen(Number($("#nl").val()), Number($("#xg").val()), Number($("#hg").val())));
            });
        },
        //设置
        setting: function () {
            messageClear();
            var a = UI.syssetting;
            messageAppend(a);
            $('#family').val(family);
            $("#family").change(function () {
                family = $("#family").val();
                GM_setValue(role + "_family", family);
            });
            $('#wudao_pfm').val(wudao_pfm);
            $('#wudao_pfm').focusout(function () {
                wudao_pfm = $('#wudao_pfm').val();
                GM_setValue(role + "_wudao_pfm", wudao_pfm);
            });
            $('#sm_loser').val(sm_loser);
            $('#sm_loser').focusout(function () {
                sm_loser = $('#sm_loser').val();
                GM_setValue(role + "_sm_loser", sm_loser);
            });
            $('#ks_pfm').val(ks_pfm);
            $('#ks_pfm').focusout(function () {
                ks_pfm = $('#ks_pfm').val();
                GM_setValue(role + "_ks_pfm", ks_pfm);
            });
            $("#ks_wait").val(ks_wait);
            $('#ks_wait').focusout(function () {
                ks_wait = $('#ks_wait').val();
                GM_setValue(role + "_ks_wait", ks_wait);
            })
            $('#marry_kiss').val(automarry);
            $('#marry_kiss').change(function () {
                automarry = $('#marry_kiss').val();
                GM_setValue(role + "_automarry", automarry);
            });
            $('#ks_Boss').val(autoKsBoss);
            $('#ks_Boss').change(function () {
                autoKsBoss = $('#ks_Boss').val();
                GM_setValue(role + "_autoKsBoss", autoKsBoss);
            });
            $('#auto_eq').val(autoeq);
            $('#auto_eq').change(function () {
                autoeq = $('#auto_eq').val();
                GM_setValue(role + "_auto_eq", autoeq);

            });
            $('#autopfmswitch').val(auto_pfmswitch);
            $('#autopfmswitch').change(function () {
                auto_pfmswitch = $('#autopfmswitch').val();
                GM_setValue(role + "_auto_pfmswitch", auto_pfmswitch);
                if (auto_pfmswitch == '已开启') {
                    G.auto_preform = true;
                } else {
                    G.auto_preform = false;
                }
            });
            //自命令显示设置
            $("#zmlshowsetting").val(zmlshowsetting);
            $("#zmlshowsetting").change(function () {
                zmlshowsetting = $('#zmlshowsetting').val();
                GM_setValue(role + "_zmlshowsetting", zmlshowsetting);
                Helper.zml_showp();
            });
            $('#getitemShow').val(getitemShow);
            $('#getitemShow').change(function () {
                getitemShow = $('#getitemShow').val();
                GM_setValue(role + "_getitemShow", getitemShow);
                if (getitemShow == '已开启') {
                    G.getitemShow = true;
                } else {
                    G.getitemShow = false;
                }
            });
            $('#unauto_pfm').val(unauto_pfm);
            $('#unauto_pfm').change(function () {
                unauto_pfm = $('#unauto_pfm').val();
                GM_setValue(role + "_unauto_pfm", unauto_pfm);
                var unpfm = unauto_pfm.split(',');
                for (var pfmname of unpfm) {
                    if (pfmname)
                        blackpfm.push(pfmname);
                }
            });
            // //自定义存取
            // var zdy_item_store = '';
            // //自定义丢弃
            // var zdy_item_drop = '';
            // //自定义分解
            // var zdy_item_fenjie = '';
            $('#store_info').val(zdy_item_store);
            $('#store_info').change(function () {
                zdy_item_store = $('#store_info').val();
                GM_setValue(role + "_zdy_item_store", zdy_item_store);
                store_list = zdy_item_store.split(",");
            });
            $('#store_drop_info').val(zdy_item_drop);
            $('#store_drop_info').change(function () {
                zdy_item_drop = $('#store_drop_info').val();
                GM_setValue(role + "_zdy_item_drop", zdy_item_drop);
                drop_list = zdy_item_drop.split(",");
            });
            $('#store_fenjie_info').val(zdy_item_fenjie);
            $('#store_fenjie_info').change(function () {
                zdy_item_fenjie = $('#store_fenjie_info').val();
                GM_setValue(role + "_zdy_item_fenjie", zdy_item_fenjie);
                fenjie_list = zdy_item_fenjie.split(",");
            });
            $('#auto_command').val(auto_command);
            $('#auto_command').change(function () {
                auto_command = $('#auto_command').val();
                GM_setValue(role + "_auto_command", auto_command);
            });
            $("#blacklist").val(blacklist);
            $('#blacklist').change(function () {
                blacklist = $('#blacklist').val();
                GM_setValue(role + "_blacklist", blacklist);
            });
            $(".updete_id_all").on("click", WG.updete_id_all);
        },
        hooks: [],
        hook_index: 0,
        add_hook: function (types, fn) {
            var hook = {
                'index': WG.hook_index++,
                'types': types,
                'fn': fn
            };
            WG.hooks.push(hook);
            return hook.index;
        },
        remove_hook: function (hookindex) {
            var that = this;
            console.log("remove_hook");
            for (var i = 0; i < that.hooks.length; i++) {
                if (that.hooks[i].index == hookindex) {
                    that.hooks.baoremove(i);
                }
            }
        },
        run_hook: function (type, data) {
            //console.log(data);
            for (var i = 0; i < this.hooks.length; i++) {
                // if (this.hooks[i] !== undefined && this.hooks[i].type == type) {
                //     this.hooks[i].fn(data);
                // }
                var listener = this.hooks[i];
                if (listener.types == data.type || (listener.types instanceof Array && $
                        .inArray(data.type, listener.types) >= 0)) {
                    listener.fn(data);
                }
            }
        },
        receive_message: function (msg) {
            ws_on_message.apply(this, arguments);
            if (!msg || !msg.data) return;
            var data;
            if (msg.data[0] == '{' || msg.data[0] == '[') {
                var func = new Function("return " + msg.data + ";");
                data = func();
            } else {
                data = {
                    type: 'text',
                    msg: msg.data
                };
            }
            if (G.cmd_echo) {
                console.log(data);
            }
            WG.run_hook(data.type, data);
        },
        auto_preform_switch: function () {

            if (G.auto_preform) {
                G.auto_preform = false;
                messageAppend("<hio>自动施法</hio>关闭");
                WG.auto_preform("stop");
            } else {
                G.auto_preform = true;
                messageAppend("<hio>自动施法</hio>开启");
                WG.auto_preform();
            }
        },
        auto_preform: function (v) {
            if (v == "stop") {
                if (G.preform_timer) {
                    clearInterval(G.preform_timer);
                    G.preform_timer = undefined;
                    $(".auto_perform").css("background", "");
                }
                return;
            }
            if (G.preform_timer || G.auto_preform == false) return;
            $(".auto_perform").css("background", "#3E0000");
            G.preform_timer = setInterval(() => {
                //出招时重新获取黑名单
                unauto_pfm = GM_getValue(role + "_unauto_pfm", unauto_pfm);
                var unpfm = unauto_pfm.split(',');
                for (var pfmname of unpfm) {
                    if (!WG.inArray(pfmname, blackpfm))
                        blackpfm.push(pfmname);
                }
                if (G.in_fight == false) WG.auto_preform("stop");
                for (var skill of G.skills) {
                    if (family.indexOf("逍遥") >= 0) {
                        if (skill.id == "unarmed.duo") {
                            continue;
                        }
                    }
                    if (WG.inArray(skill.id, blackpfm)) {
                        continue;
                    }
                    if (!G.gcd && !G.cds.get(skill.id)) {
                        WG.Send("perform " + skill.id);
                        break;
                    }
                }
            }, 350);
        },
    };
    var Helper = {
        formatCurrencyTenThou: function (num) {
            num = num.toString().replace(/\$|\,/g, '');
            if (isNaN(num)) num = "0";
            var sign = (num == (num = Math.abs(num)));
            num = Math.floor(num * 10 + 0.50000000001); //cents = num%10;
            num = Math.floor(num / 10).toString();
            for (var i = 0; i < Math.floor((num.length - (1 + i)) / 3); i++) {
                num = num.substring(0, num.length - (4 * i + 3)) + ',' + num.substring(num.length - (4 * i + 3));
            }
            return (((sign) ? '' : '-') + num);
        },
        gen: function (nl, xg, hg) {
            var jg = nl / 100 + xg * hg / 10;
            var sd = this.formatCurrencyTenThou(jg);
            return sd;
        },
        dian: function (c, m, se) {
            var j = c + m;
            var jj = m - c;
            var jjc = jj / 2;
            var z = j * jjc * se * 5;
            var sd = this.formatCurrencyTenThou(z);
            return sd;
        },
        //找boss,boss不在,-1,
        findboss: function (data, bossname, callback) {
            for (let i = 0; i < data.items.length; i++) {
                if (data.items[i] != 0) {
                    if (data.items[i].name.indexOf(bossname) >= 0) {
                        callback(data.items[i].id);
                    }
                }
            }
            callback(-1);
        },
        ksboss: undefined,
        marryhy: undefined,
        kksBoss: function (data) {
            var boss_place = data.content.match("出现在([^%]+)一带。");
            var boss_name = data.content.match("听说([^%]+)出现在");
            if (boss_name == null || boss_place == null) {
                return;
            }
            blacklist = GM_getValue(role + "_blacklist", blacklist);
            blacklist = blacklist instanceof Array ? blacklist : blacklist.split(",");
            if (WG.inArray(boss_name, blacklist)) {
                messageAppend("黑名单boss,忽略!");
                return;
            }
            boss_name = data.content.match("听说([^%]+)出现在")[1];
            boss_place = data.content.match("出现在([^%]+)一带。")[1];
            autoKsBoss = GM_getValue(role + "_autoKsBoss", autoKsBoss);
            ks_pfm = GM_getValue(role + "_ks_pfm", ks_pfm);
            ks_wait = GM_getValue(role + "_ks_wait", ks_wait);
            autoeq = GM_getValue(role + "_auto_eq", autoeq);
            console.log("boss");
            console.log(boss_place);
            messageAppend("自动前往BOSS地点");
            WG.Send("stopstate");
            WG.go(boss_place);
            this.ksboss = WG.add_hook(["items", "itemadd", "die"], function (data) {
                if (data.type == "items") {
                    if (!WG.at(boss_place)) {
                        return;
                    }
                    Helper.findboss(data, boss_name, function (bid) {
                        if (bid != -1) {
                            next = 999;
                            Helper.eqhelper(autoeq);
                            setTimeout(() => {
                                WG.Send("kill " + bid);
                                //WG.Send("select " + bid);
                                next = 0;
                            }, Number(ks_pfm));
                        } else {
                            if (next == 999) {
                                console.log('found');
                                return;
                            }
                            let lj = needfind[boss_place];
                            if (needfind[boss_place] != undefined && next < lj.length) {
                                setTimeout(() => {
                                    console.log(lj[next]);
                                    WG.Send(lj[next]);
                                    next++;
                                }, 1000);
                            } else {
                                console.log("not found");
                            }
                        }
                    });
                }
                if (data.type == "itemadd") {
                    if (data.name.indexOf(boss_name) >= 0) {
                        next = 0;
                        WG.get_all();
                        WG.remove_hook(this.index);
                    }
                }
                if (data.type == "die") {
                    next = 0;
                    WG.Send('relive');
                    WG.remove_hook(this.index);
                }
            });
            setTimeout(() => {
                console.log("复活挖矿");
                WG.Send('relive');
                WG.remove_hook(this.ksboss);
                auto_command = GM_getValue(role + "_auto_command", auto_command);
                if (auto_command && auto_command != null && auto_command != "" && auto_command != "null") {
                    WG.SendCmd(auto_command);
                } else {
                    WG.zdwk();
                }
                next = 0;
            }, 1000 * ks_wait);
        },
        xiyan: async function () {
            WG.Send("stopstate");
            WG.go("扬州城-喜宴");
            this.marryhy = WG.add_hook(['items', 'cmds', 'text', 'msg'], function (data) {
                if (data.type == 'items') {
                    for (let idx = 0; idx < data.items.length; idx++) {
                        if (data.items[idx] != 0) {
                            if (data.items[idx].name.indexOf(">婚宴礼桌<") >= 0) {
                                console.log("拾取");
                                WG.Send('get all from ' + data.items[idx].id);
                                console.log("xy" + this.index);
                                WG.remove_hook(this.index);
                                break;
                            }
                        }
                    }
                } else if (data.type == 'text') {
                    if (data.msg == "你要给谁东西？") {
                        console.log("没人");
                    }
                    if (/^店小二拦住你说道：怎么又是你，每次都跑这么快，等下再进去。$/.test(data.msg)) {
                        console.log("cd");
                        messageAppend("<hiy>你太勤快了, 1秒后回去挖矿</hiy>")
                    }
                    if (/^店小二拦住你说道：这位(.+)，不好意思，婚宴宾客已经太多了。$/.test(data.msg)) {
                        console.log("客满");
                        messageAppend("<hiy>你来太晚了, 1秒后回去挖矿</hiy>")

                    }
                } else if (data.type == 'cmds') {
                    for (let idx = 0; idx < data.items.length; idx++) {
                        if (data.items[idx].name == '1金贺礼') {
                            WG.SendCmd(data.items[idx].cmd + ';go up;$wait 2000;go down;go up');
                            console.log("交钱");
                            break;
                        }
                    }
                }
            });
            setTimeout(() => {
                console.log("挖矿");
                WG.remove_hook(this.marryhy);
                if (auto_command && auto_command != null && auto_command != "" && auto_command != "null") {
                    WG.SendCmd(auto_command);
                } else {
                    WG.zdwk();
                }
                next = 0;
            }, 30000);
        },

        saveRoomstate(data) {
            roomData = data.items;
        },

        eqx: null,
        eqhelper(type) {
            if (type == undefined || type == 0 || type > eqlist.length) {
                return;
            }
            if (eqlist == null || eqlist[type] == "") {
                messageAppend("套装未保存,保存当前装备作为套装" + type + "!", 1);
                this.eqx = WG.add_hook("dialog", (data) => {
                    if (data.dialog == "pack" && data.eqs != undefined) {
                        eqlist[type] = data.eqs;
                        GM_setValue(role + "_eqlist", eqlist);
                        messageAppend("套装" + type + "保存成功!", 1);
                        WG.remove_hook(this.eqx);
                    }
                });
                WG.Send("pack");
            } else {
                eqlist = GM_getValue(role + "_eqlist", eqlist);
                let p_cmds = "";
                for (let i = 1; i < eqlist[type].length; i++) {
                    if (eqlist[type][i] != null) {

                        p_cmds += ("$wait 20;eq " + eqlist[type][i].id + ";");
                    }
                }

                if (eqlist[type][0] != null) {
                    p_cmds += ("$wait 40;eq " + eqlist[type][0].id + ";");
                }
                WG.SendCmd(p_cmds);
                messageAppend("套装装备成功" + type + "!", 1);
            }
        },
        eqhelperdel: function (type) {
            eqlist = GM_getValue(role + "_eqlist", eqlist);
            eqlist[type] = [];
            GM_setValue(role + "_eqlist", eqlist);
            messageAppend("清除套装" + type + "设置成功!", 1);
        },
        uneqall: function () {
            this.eqx = WG.add_hook("dialog", (data) => {
                if (data.dialog == "pack" && data.eqs != undefined) {
                    for (let i = 0; i < data.eqs.length; i++) {
                        if (data.eqs[i] != null) {
                            WG.Send("uneq " + data.eqs[i].id);
                        }
                    }
                    WG.remove_hook(this.eqx);
                }
            });
            WG.Send("pack");
            messageAppend("取消所有装备成功!", 1);
        },

        fight_listener: undefined,
        auto_fight: function () {

            if (Helper.fight_listener) {
                messageAppend("<hio>自动比试</hio>结束");
                WG.remove_hook(Helper.fight_listener);
                Helper.fight_listener = undefined;
                return;
            }
            let name = prompt("请输入NPC名称,例如:\"高根明\"");
            let id = Helper.find_item(name);

            if (id == null) return;
            Helper.fight_listener = WG.add_hook(["text", "sc", "combat"], async function (data) {
                if (data.type == "combat" && data.end) {
                    let item = G.items.get(G.id);
                    if (item.mp / item.max_mp < 0.8) {
                        WG.SendCmd("dazuo");
                    }
                    WG.SendCmd("liaoshang");
                } else if (data.type == "sc" && data.id == id) {
                    let item = G.items.get(id);
                    if (item.hp >= item.max_hp) {
                        WG.Send("stopstate;fight " + id);
                    }
                } else if (data.type == 'sc' && data.id == G.id) {
                    if (data.hp >= data.max_hp) {
                        WG.Send("stopstate;fight " + id);
                    }
                } else if (data.type == 'text') {
                    if (data.msg.indexOf("你先调整好自己的状态再来找别人比试吧") >= 0) {
                        WG.SendCmd("liaoshang");
                    }
                    if (data.msg.indexOf("你想趁人之危吗") >= 0) {
                        WG.SendCmd("dazuo");
                    }
                    if (data.msg.indexOf(">你疗伤完毕，深深吸了口气") >= 0) {
                        WG.Send("stopstate;fight " + id);
                    }
                }

            });
            WG.Send("stopstate;fight " + id);
            messageAppend("<hio>自动比试</hio>开始");
        },
        find_item: function (name) {
            for (let [k, v] of G.items) {
                if (v.name == name) {
                    return k;
                }
            }
            return null;
        },
        recover: function (hp, mp, cd, callback) {
            //返回定时器
            if (hp == 0) {
                if (WG.recover_timer) {
                    clearTimeout(WG.recover_timer);
                    WG.recover_timer = undefined;
                }
                return;
            }
            WG.Send("dazuo");
            WG.recover_timer = setInterval(function () {
                //检查状态
                let item = G.items.get(G.id);
                if (item.mp / item.max_mp < mp) { //内力控制
                    if (item.state != "打坐") {
                        WG.Send("stopstate;dazuo");
                    }
                    return;
                }
                if (item.hp / item.max_hp < hp) {
                    //血满
                    if (item.state != "疗伤") {
                        WG.Send("stopstate;liaoshang");
                    }
                    return;
                }
                if (item.state) WG.Send("stopstate");
                if (cd) {
                    for (let [k, v] of G.cds) {
                        if (k == "force.tu") continue;
                        if (v) return;
                    }
                }
                clearInterval(WG.recover_timer);
                callback();
            }, 1000);
        },
        useitem_hook: undefined,
        auto_useitem: async function () {
            var useflag = true;
            if (!Helper.useitem_hook) {
                Helper.useitem_hook = WG.add_hook("text", function (data) {
                    if (data.msg.indexOf("你身上没有这个东西") >= 0 || data.msg.indexOf("太多") >= 0 || data.msg.indexOf("不能使用") >= 0) {
                        useflag = false;
                        WG.remove_hook(Helper.useitem_hook);
                        Helper.useitem_hook = undefined;
                    }
                })
            }
            let name = prompt("请输入物品id,在背包中点击查看物品,即可在提示窗口看到物品id输出");
            if (!name) {
                WG.remove_hook(Helper.useitem_hook);
                Helper.useitem_hook = undefined;
                return;
            }
            let num = prompt("请输入物品使用次数,例如:\"10\"", '10');
            if (name) {
                if (name.length != 11) {
                    L.msg('id不合法');
                    WG.remove_hook(Helper.useitem_hook);
                    Helper.useitem_hook = undefined;
                    return;
                }
                for (var i = 0; i < num; i++) {
                    if (useflag) {
                        WG.Send('use ' + name);
                        await WG.sleep(1000);
                    } else {
                        WG.remove_hook(Helper.useitem_hook);
                        Helper.useitem_hook = undefined;
                        return;
                    }
                }
            }
            WG.remove_hook(Helper.useitem_hook);
            Helper.useitem_hook = undefined;
        },

        auto_Development_medicine: function () {
            messageClear();
            var a = UI.lyui;
            messageAppend(a);

            $('.startDev').on('click', function () {
                if (WG.at('住房-炼药房') || WG.at('帮会-炼药房')) {
                    Helper.auto_start_dev_med($('#medicint_info').val().replace(" ", ""), $('#medicine_level').val());
                } else {
                    L.msg("请先前往炼药房");
                }
            });
            $('.stopDev').on('click', function () {
                WG.Send("stopstate");
            });
        },
        findMedItems_hook: undefined,
        auto_start_dev_med: function (med_item, level) {
            if (med_item) {
                if (med_item.split(",").length < 2) {
                    L.msg("素材不足");
                    return;
                }
            } else {
                L.msg("素材不足");
                return;
            }
            var med_items = med_item.split(',');

            Helper.findMedItems_hook = WG.add_hook("dialog", function (data) {
                if (data.dialog == "pack" && data.items != undefined && data.items.length >= 0) {
                    let med_items_id = [];
                    for (var med_item of med_items) {
                        if (JSON.stringify(data.items).indexOf(med_item) >= 0) {
                            for (var item of data.items) {
                                if (item.name.indexOf(med_item) >= 0) {
                                    med_items_id.push(item.id);
                                }
                            }
                        }

                    }
                    if (med_items_id.length != med_items.length) {
                        L.msg("素材不足,请检查背包是否存在相应素材");
                        return;
                    }
                    var p_Cmd = Helper.make_med_cmd(med_items_id, level);
                    console.log(p_Cmd);
                    WG.SendStep(p_Cmd);
                    WG.remove_hook(Helper.findMedItems_hook);
                }
            });
            WG.Send('pack');

        },
        make_med_cmd: function (medItem_id, level) {
            var startCmd = "lianyao2 start " + level;
            var endCmd = "lianyao2 stop";
            var midCmd = "lianyao2 add ";
            var result = startCmd + ";";
            for (var medid of medItem_id) {
                result += midCmd + medid + ";"
            }
            result += endCmd;
            return result;
        },
        zmlfire: async function (zml) {
            if (zml) {

                messageAppend("运行" + zml.name, 2);
                if (zml.zmlType == 0 || zml.zmlType == "" || zml.zmlType == undefined) {
                    await WG.SendCmd(zml.zmlRun);
                } else if (zml.zmlType == 1) {
                    if (ToRaid) {
                        ToRaid.perform(zml.zmlRun);
                    }
                } else if (zml.zmlType == 2) {
                    eval(zml.zmlRun);
                }

            }
        },
        zml: function () {
            zml = GM_getValue(role + "_zml", zml);
            messageClear();
            var a = UI.zmlandztjkui;
            messageAppend(a);
            zml.forEach(function (v, k) {
                var btn = "<span class='addrun" + k + "'>" + v.name + "</span>";
                $('#zml_show').append(btn);

            })
            zml.forEach(function (v, k) {
                $(".addrun" + k).on("click", function () {
                    Helper.zmlfire(v);
                });
            });

            $(".editzml").on("click", function () {
                Helper.zml_edit();
            });
            $(".editztjk").on("click", function () {
                Helper.ztjk_edit();
            });
            $(".startzdjk").on("click", function () {
                Helper.ztjk_func();
            });
            $(".stopzdjk").on("click", function () {
                if (Helper.ztjk_hook) {
                    WG.remove_hook(Helper.ztjk_hook);
                    Helper.ztjk_hook = undefined;
                    messageAppend("已取消注入", 2);
                    return;
                }
                messageAppend("未注入", 2);
            });

        },
        zml_edit: function (info = "") {
            zml = GM_getValue(role + "_zml", zml);
            messageClear();
            L.msg(info);
            var edithtml = UI.zmlsetting;
            messageAppend(edithtml);
            $(".getSharezml").on('click', () => {
                var id = prompt("请输入分享码");
                S.getShareJson(id, (res) => {
                    let v = JSON.parse(res.json);
                    if (v.zmlRun != undefined) {
                        $("#zml_name").val(v.name);
                        $("#zml_type").val(v.zmlType);
                        $("#zml_info").val(v.zmlRun);
                    } else {
                        L.msg("不合法")
                    }
                });
            });
            $(".editadd").on('click', function () {
                let zmltext = $("#zml_info").val();
                let zmlname = $("#zml_name").val().replace(" ", "");
                let zmltype = $("#zml_type").val();
                let zmljson = {
                    "name": zmlname,
                    "zmlRun": zmltext,
                    "zmlShow": 0,
                    "zmlType": zmltype
                };
                let _flag = true;
                zml.forEach(function (v, k) {
                    if (v.name == zmlname) {
                        zmljson.zmlShow = v.zmlShow;
                        zml[k] = zmljson;
                        _flag = false;
                    }
                });
                if (_flag) {
                    zml.push(zmljson);
                }
                GM_setValue(role + "_zml", zml);
                Helper.zml_edit("保存成功");
            });
            $(".editdel").on('click', function () {
                let zmlname = $("#zml_name").val();
                zml.forEach(function (v, k) {
                    if (v.name == zmlname) {
                        zml.baoremove(k);
                        GM_setValue(role + "_zml", zml);

                        Helper.zml_edit("删除成功");
                    }
                });

            });

            zml.forEach(function (v, k) {
                var btn = "<span class='addrun" + k + "'>编辑" + v.name + "</span>";
                var btn2 = "<span class='shortcut" + k + "'>设置快速使用" + v.name + "</span>";
                var btn3 = "<span class='share" + k + "'>分享" + v.name + "</span>";
                $('#zml_show').append(btn);
                $('#zml_show').append(btn2);
                $('#zml_show').append(btn3);
                $('#zml_show').append("<br/>");

            });

            zml.forEach(function (v, k) {
                $(".addrun" + k).on("click", function () {

                    $("#zml_name").val(v.name);
                    $("#zml_type").val(v.zmlType);
                    $("#zml_info").val(v.zmlRun);
                });

                $(".shortcut" + k).on("click", function () {
                    zmlshowsetting = GM_getValue(role + "_zmlshowsetting", zmlshowsetting);
                    //<span class="zdy-item act-item-zdy" zml="use j8ea35f34ce">大还丹</span>
                    let a = $(".room-commands");

                    if (zmlshowsetting == 1) {
                        a = $(".zdy-commands");
                    }

                    for (let item of a.children()) {
                        if (item.textContent == v.name) {
                            item.remove();
                            v.zmlShow = 0;
                            GM_setValue(role + "_zml", zml);
                            messageAppend("删除快速使用" + v.name, 1);
                            return;
                        }
                    }
                    a.append("<span class=\"zdy-item act-item-zdy\">" + v.name + "</span>")
                    v.zmlShow = 1;
                    GM_setValue(role + "_zml", zml);
                    messageAppend("设置快速使用" + v.name, 1);
                    //绑定事件
                    $('.act-item-zdy').off('click');
                    $(".act-item-zdy").on('click', function () {
                        T.usezml(0, this.textContent, "");
                    });
                });
                $(".addrun" + k).on("click", function () {

                    $("#zml_name").val(v.name);
                    $("#zml_type").val(v.zmlType);
                    $("#zml_info").val(v.zmlRun);
                });
                $(".share" + k).on("click", function () {
                    S.shareJson(G.id, v);
                });
            });
        },
        isseted: false,
        zml_showp: function () {
            zmlshowsetting = GM_getValue(role + "_zmlshowsetting", zmlshowsetting);

            for (let zmlitem of zml) {
                let a = $(".room-commands");
                if (zmlshowsetting == 1) {
                    for (let item of a.children()) {
                        if (item.textContent == zmlitem.name) {
                            item.remove();
                        }
                    }
                    a = $(".zdy-commands");
                    if (!Helper.isseted) {
                        let px = $('.tool-bar.right-bar').css("bottom");
                        px.replace("px", "");
                        px = parseInt(px);
                        px = px + 24;
                        $('.tool-bar.right-bar').css("bottom", px + "px");
                        Helper.isseted = true;
                    }

                } else {
                    for (let item of $(".zdy-commands").children()) {
                        if (item.textContent == zmlitem.name) {
                            item.remove();
                        }
                    }
                }

                if (zmlitem.zmlShow == 1) {

                    a.append("<span class=\"zdy-item act-item-zdy\">" + zmlitem.name + "</span>")
                    messageAppend("设置快速使用" + zmlitem.name, 1);
                    //绑定事件
                    $('.act-item-zdy').off('click');
                    $(".act-item-zdy").on('click', function () {
                        T.usezml(0, this.textContent, "");
                    });
                }
            }
        },
        ztjk_edit: function () {

            //[{"name":"","type":"state","action":"remove","keyword":"busy","ishave":"0","send":""}]
            ztjk_item = GM_getValue(role + "_ztjk", ztjk_item);
            messageClear();
            var edithtml = UI.ztjksetting;
            messageAppend(edithtml);
            $(".ztjk_sharedfind").on('click', () => {
                var id = prompt("请输入分享码");
                S.getShareJson(id, (res) => {
                    let v = JSON.parse(res.json);
                    if (v.type != undefined) {
                        $('#ztjk_name').val(v.name);
                        $('#ztjk_type').val(v.type);
                        $('#ztjk_action').val(v.action);
                        $('#ztjk_keyword').val(v.keyword);
                        $('#ztjk_ishave').val(v.ishave);
                        $('#ztjk_send').val(v.send);
                        $('#ztjk_senduser').val(v.senduser);
                        $("#ztjk_maxcount").val(v.maxcount);
                    } else {
                        L.msg("不合法")
                    }
                });
            });
            $('.ztjk_editadd').on("click", function () {
                var ztjk = {
                    name: $('#ztjk_name').val(),
                    type: $('#ztjk_type').val(),
                    action: $('#ztjk_action').val(),
                    keyword: $('#ztjk_keyword').val(),
                    ishave: $('#ztjk_ishave').val(),
                    send: $('#ztjk_send').val(),
                    senduser: $('#ztjk_senduser').val(),
                    isactive: 1,
                    maxcount: $('#ztjk_maxcount').val()
                };
                let _flag = true;
                ztjk_item.forEach(function (v, k) {
                    if (v.name == $('#ztjk_name').val()) {
                        ztjk_item[k] = ztjk;
                        _flag = false;
                    }
                });
                if (_flag) {
                    ztjk_item.push(ztjk);
                }
                GM_setValue(role + "_ztjk", ztjk_item);
                Helper.ztjk_func();
            });
            $(".ztjk_editdel").on('click', function () {
                let name = $('#ztjk_name').val();
                ztjk_item.forEach(function (v, k) {
                    if (v.name == name) {
                        ztjk_item.baoremove(k);
                        GM_setValue(role + "_ztjk", ztjk_item);
                        Helper.ztjk_edit();
                        messageAppend("删除成功", 2);
                        Helper.ztjk_func();
                    }
                });
            })
            ztjk_item.forEach(function (v, k) {
                var btn = "<span class='addrun" + k + "'>编辑" + v.name + "</span>";
                $('#ztjk_show').append(btn);
                var tmptext = "注入";
                if (v.isactive && v.isactive == 1) {
                    tmptext = "暂停";
                }
                var setbtn = "<span class='setaction" + k + "'>" + tmptext + v.name + "</span>";
                $('#ztjk_set').append(setbtn);
                var btn3 = "<span class='shareztjk" + k + "'>分享" + v.name + "</span>";
                $('#ztjk_show').append(btn3);
            });
            ztjk_item.forEach(function (v, k) {
                $(".addrun" + k).on("click", function () {
                    $('#ztjk_name').val(v.name);
                    $('#ztjk_type').val(v.type);
                    $('#ztjk_action').val(v.action);
                    $('#ztjk_keyword').val(v.keyword);
                    $('#ztjk_ishave').val(v.ishave);
                    $('#ztjk_send').val(v.send);
                    $('#ztjk_senduser').val(v.senduser);
                    $("#ztjk_maxcount").val(v.maxcount);
                });
                $('.setaction' + k).on('click', function () {
                    if (this.textContent.indexOf("暂停") >= 0) {
                        ztjk_item[k].isactive = 0;
                    } else {
                        ztjk_item[k].isactive = 1;
                    }
                    GM_setValue(role + "_ztjk", ztjk_item);
                    Helper.ztjk_func();
                    Helper.ztjk_edit();
                });
                $('.shareztjk' + k).on('click', function () {
                    S.shareJson(G.id, v);
                });
            });

        },
        ztjk_hook: undefined,
        ztjk_func: function () {
            if (Helper.ztjk_hook) {
                WG.remove_hook(Helper.ztjk_hook);
            }
            Helper.ztjk_hook = undefined;
            ztjk_item = GM_getValue(role + "_ztjk", ztjk_item);
            Helper.ztjk_hook = WG.add_hook(["dispfm", "enapfm", "dialog", "room", "itemadd", "itemremove", "status", "text", "msg", "die", "combat", "sc"], function (data) {
                ztjk_item.forEach(function (v, k) {
                    if (v.isactive != 1) {
                        return;
                    }
                    if (data.type == v.type) {
                        let keywords = v.keyword.split("|");
                        switch (v.type) {
                            case "status":
                                if (!data.name) {
                                    if (v.action == data.action) {
                                        for (var keyworditem of keywords) {
                                            if (data.sid.indexOf(keyworditem) >= 0) {
                                                if (v.ishave == "0" && data.id != G.id) {
                                                    messageAppend("已触发" + v.name, 1);
                                                    WG.SendCmd(v.send);
                                                } else if (v.ishave == "1" && data.id == G.id) {
                                                    if (data.count != undefined && v.maxcount) {
                                                        if (parseInt(data.count) < parseInt(v.maxcount)) {
                                                            messageAppend("已触发" + v.name, 1);
                                                            WG.SendCmd(v.send);
                                                        }
                                                    } else {
                                                        messageAppend("已触发" + v.name, 1);
                                                        WG.SendCmd(v.send);
                                                    }
                                                }
                                            }
                                        }
                                    }
                                } else {
                                    if (v.action == data.action) {
                                        for (var keyworditem of keywords) {
                                            if (data.sid.indexOf(keyworditem) >= 0 || data.name.indexOf(keyworditem) >= 0) {
                                                if (v.ishave == "0" && data.id != G.id) {
                                                    messageAppend("已触发" + v.name, 1);
                                                    WG.SendCmd(v.send);
                                                } else if (v.ishave == "1" && data.id == G.id) {
                                                    if (data.count != undefined && v.maxcount) {
                                                        if (parseInt(data.count) < parseInt(v.maxcount)) {
                                                            messageAppend("当前层数" + data.count + ",已触发" + v.name, 1);
                                                            WG.SendCmd(v.send);
                                                        }
                                                    } else {
                                                        messageAppend("已触发" + v.name, 1);
                                                        WG.SendCmd(v.send);
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                                break;
                            case "text":
                                for (var keyworditem of keywords) {
                                    if (data.msg.indexOf(keyworditem) >= 0) {
                                        messageAppend("已触发" + v.name, 1);
                                        WG.SendCmd(v.send);
                                    }
                                }
                                break;
                            case "msg":
                                if (!v.senduser || v.senduser == "" || v.senduser == null) {
                                    for (var keyworditem of keywords) {
                                        if (data.content.indexOf(keyworditem) >= 0) {
                                            messageAppend("已触发" + v.name, 1);
                                            WG.SendCmd(v.send);
                                        }
                                    }
                                    return;
                                }
                                let sendusers = v.senduser.split("|");
                                for (let item of sendusers) {
                                    if (data.name == item) {
                                        for (var keyworditem of keywords) {
                                            if (data.content.indexOf(keyworditem) >= 0) {
                                                messageAppend("已触发" + v.name, 1);
                                                WG.SendCmd(v.send);
                                            }
                                        }
                                    } else if ((item == "谣言" && data.ch == "rumor") ||
                                        (item == "系统" && data.ch == 'sys') ||
                                        (item == "门派" && data.ch == 'fam') ||
                                        (item == "帮派" && data.ch == 'pty')) {
                                        for (var keyworditem of keywords) {
                                            if (data.content.indexOf(keyworditem) >= 0) {
                                                messageAppend("已触发" + v.name, 1);
                                                WG.SendCmd(v.send);
                                            }
                                        }
                                    }
                                    // else if (item == "系统" && data.ch == 'sys') {
                                    //     for (var keyworditem of keywords) {
                                    //         if (data.content.indexOf(keyworditem) >= 0) {
                                    //             messageAppend("已触发" + v.name, 1);
                                    //             WG.SendCmd(v.send);
                                    //         }
                                    //     }
                                    // }
                                }
                                break;

                            case "die":
                                messageAppend("已触发" + v.name, 1);
                                WG.SendCmd(v.send);
                                break;
                            case "itemadd":
                                for (var keyworditem of keywords) {
                                    if (data.name.indexOf(keyworditem) >= 0) {
                                        messageAppend("已触发" + v.name, 1);
                                        WG.SendCmd(v.send);
                                    }
                                }
                                break;
                            case "room":
                                for (var keyworditem of keywords) {
                                    if (data.name.indexOf(keyworditem) >= 0) {
                                        messageAppend("已触发" + v.name, 1);
                                        WG.SendCmd(v.send);
                                    }
                                }
                                break;
                            case "dialog":
                                if (data.dialog && data.dialog == "pack") {
                                    for (var keyworditem of keywords) {
                                        if (data.name && data.name.indexOf(keyworditem) >= 0) {
                                            messageAppend("已触发" + v.name, 1);
                                            messageAppend("物品ID" + data.id, 1);
                                            let p = v.send.replace("{id}", data.id);
                                            WG.SendCmd(p);
                                        }
                                    }
                                }
                                break;
                            case "combat":
                                for (var keyworditem of keywords) {
                                    if (keyworditem == "start" && data.start == 1) {
                                        messageAppend("已触发" + v.name, 1);
                                        WG.SendCmd(v.send);
                                    } else if (keyworditem == "end" && data.end == 1) {
                                        messageAppend("已触发" + v.name, 1);
                                        WG.SendCmd(v.send);
                                    }
                                }
                                break;
                            case "sc":
                                let item = G.items.get(G.id);
                                if (v.ishave == "0") {
                                    //查找id
                                    if (!v.senduser) {}
                                    let pid = Helper.find_item(v.senduser);
                                    item = G.items.get(pid);
                                }
                                if (item && item.hp) {
                                    if ((item.hp / item.max_hp) * 100 < (parseInt(keywords[0]))) {
                                        messageAppend("已触发" + v.name, 1);
                                        WG.SendCmd(v.send);
                                    }
                                }
                                if (item && item.mp) {
                                    if ((item.mp / item.max_mp) * 100 < (parseInt(keywords[1]))) {
                                        messageAppend("已触发" + v.name, 1);
                                        WG.SendCmd(v.send);
                                    }
                                }
                                break;
                            case "enapfm":
                                for (let item of keywords) {
                                    if (item == data.id) {
                                        messageAppend("已触发" + v.name, 1);
                                        WG.SendCmd(v.send);
                                    }
                                }
                                break;
                            case "dispfm":
                                for (let item of keywords) {
                                    if (item == data.id) {
                                        messageAppend("已触发" + v.name, 1);
                                        WG.SendCmd(v.send);
                                    }
                                }
                                break;
                            default:
                                break;
                        }
                    }
                });

            });
            messageAppend("已重新注入自动监控");
        },
        daily_hook: undefined,
        oneKeyDaily: async function () {
            messageAppend("执行请安.", 1);
            await Helper.oneKeyQA();
            messageAppend("本脚本会自动执行师门及自动进退小树林,请确保精力足够再执行", 1);
            var fbnums = 0;
            Helper.daily_hook = WG.add_hook("dialog", async function (data) {
                if (data.dialog == "tasks") {
                    if (data.items) {
                        let dailylog = data.items[1].desc;
                        let dailystate = data.items[1].state;
                        if (dailystate == 3) {
                            messageAppend("日常已完成", 1);
                            //WG.zdwk();
                            WG.remove_hook(Helper.daily_hook);
                            Helper.daily_hook = undefined;
                        } else {
                            let str = dailylog;
                            str = str.replace(/<(?!\/?p\b)[^>]+>/ig, '');
                            let str1 = str.split("副本");

                            let n = str1[0].match("：([^%]+)/20")[1];
                            let n1 = str1[1].match("：([^%]+)/20")[1];
                            n = 20 - parseInt(n);
                            fbnums = 20 - parseInt(n1);
                            messageAppend("还需要" + n + "次师门任务," + fbnums + "次副本,才可签到");
                            if (n != 0) {
                                //$(".sm_button").click();
                                WG.sm_state = 0;
                                setTimeout(WG.sm, 200);
                            } else {
                                WG.sm_state = -1;
                            }

                            //WG.remove_hook(Helper.daily_hook);
                            //Helper.daily_hook = undefined;
                        }

                    }
                }
            });

            KEY.do_command("tasks");
            KEY.do_command("tasks");

            await WG.sleep(2000);
            while (WG.sm_state >= 0) {
                await WG.sleep(2000);
            }

            WG.grove_auto(fbnums);

            // var sxplace = sm_array[family].sxplace;
            // var sx = sm_array[family].sx;
            // if (sxplace.indexOf("-") == 0) {
            //     WG.Send(sxplace.replace('-', ''));
            // } else {
            //     WG.go(sxplace);
            // }
            // await WG.sleep(1000);
            // WG.SendCmd("ask2 $findPlayerByName(\"" + sx + "\")");
            // await WG.sleep(1000);

        },
        oneKeyQA: async function () {
            WG.Send("stopstate");
            WG.sm_state = 0;
            var sxplace = sm_array[family].sxplace;
            var sx = sm_array[family].sx;
            if (sxplace.indexOf("-") == 0) {
                WG.Send(sxplace.replace('-', ''));
            } else {
                WG.go(sxplace);
            }
            await WG.sleep(1000);
            WG.SendCmd("ask2 $findPlayerByName(\"" + sx + "\")");
            await WG.sleep(1000);

        },
        sd_hook: undefined,
        oneKeySD: function () {
            var n = 0;
            messageAppend("本脚本自动执行购买扫荡符,进行追捕扫荡,请确保元宝足够\n注意! 超过上限会自动放弃", 1);
            Helper.sd_hook = WG.add_hook(["dialog", "text"], async function (data) {
                var id = 0;
                var loop = 2;
                if (data.type == 'text' && data.msg) {
                    id = WG.getIdByName("程药发");
                    if (data.msg.indexOf("无法快速完") >= 0) {
                        WG.Send("ask1 " + id);
                        await WG.sleep(200);
                        WG.Send("ask2 " + id);
                        await WG.sleep(200);
                        while (loop) {
                            loop--;
                            console.log("ask3 " + id);
                            WG.Send("ask3 " + id);
                            await WG.sleep(1000);
                        }

                        //messageAppend("追捕已完成", 1);
                        //WG.Send("ask3 " + id);
                        //WG.zdwk();
                        //WG.remove_hook(Helper.sd_hook);
                        //Helper.sd_hook = undefined;
                    }
                    //<hig>你的追捕任务完成了，目前完成20/20个，已连续完成40个。</hig>
                    if (data.msg.indexOf("追捕任务完成了") >= 0) {
                        let str = data.msg;
                        str = str.replace(/<(?!\/?p\b)[^>]+>/ig, '');
                        n = str.match("目前完成([^%]+)/20")[1];
                        if (n == "20") {
                            messageAppend("追捕已完成", 1);
                            await WG.sleep(2000);
                            WG.remove_hook(Helper.sd_hook);
                            Helper.sd_hook = undefined;
                        }
                    }
                    if (data.msg.indexOf("你的扫荡符不够。") >= 0) {
                        id = WG.getIdByName("程药发");

                        messageAppend("还需要" + n + "次扫荡,自动购入" + n + "张扫荡符");
                        WG.Send("shop 0 " + n);
                        await WG.sleep(1000);
                        while (loop) {
                            loop--;
                            console.log("ask3 " + id);
                            WG.Send("ask3 " + id);
                            await WG.sleep(1000);
                        }

                    }
                }
                if (data.dialog == "tasks") {
                    if (data.items) {
                        let dailylog = data.items[3].desc;

                        let str = dailylog;
                        str = str.replace(/<(?!\/?p\b)[^>]+>/ig, '');

                        n = str.match("完成([^%]+)/20")[1];
                        n = 20 - parseInt(n);
                        if (n == 0) {
                            messageAppend("追捕已完成", 1);
                            //WG.zdwk();
                            WG.remove_hook(Helper.sd_hook);
                            Helper.sd_hook = undefined;
                            return;
                        } else {
                            do {
                                WG.go("扬州城-衙门正厅");
                                await WG.sleep(1000);
                            }
                            while (!WG.getIdByName("程药发"))
                            WG.SendCmd("ask3 $pname(\"程药发\")");
                        }

                    }
                }
            });
            WG.Send("stopstate");
            KEY.do_command("tasks");
            KEY.do_command("tasks");
        },
        yj_hook: undefined,
        oneKeyyj: async function () {
            WG.SendCmd("stopstate;$to 扬州城-药铺;$wait 1000;buy 10 " +
                goods["养精丹"].id +
                " from " +
                npcs["药铺老板 平一指"] +
                ";$wait 1000");
            await WG.sleep(4000);
            let lyj = '';
            let byj = '';
            Helper.yj_hook = WG.add_hook("dialog", function (data) {
                if (data.items) {
                    for (let item of data.items) {
                        if (item.name == '<hic>养精丹</hic>') {
                            byj = item.id;
                        }
                        if (item.name == "<hig>养精丹</hig>") {
                            lyj = item.id;
                        }
                    }
                    let send = '';
                    for (let i = 0; i < 10; i++) {
                        send += "$wait 500;use " + lyj + ";$wait 500;use " + byj + ";";
                    }
                    WG.SendCmd(send);
                }
                WG.remove_hook(Helper.yj_hook);
            });
            WG.Send("pack");
            await WG.sleep(20000);
        }


    };
    //助手函数
    var T = {
        //private
        _recmd: function (cmds) {
            if (cmds) {
                cmds = cmds instanceof Array ? cmds : cmds.split(';');
                cmds.baoremove(0);
                cmds = cmds.join(";");
                return cmds;
            } else {
                return "";
            }
        },
        recmd: function (idx, cmds) {
            for (let i = 0; i < idx + 1; i++) {
                cmds = T._recmd(cmds);
            }
            return cmds;
        },
        findhook: undefined,
        _findItem: async function (itemname, callback) {
            console.log("finditem" + itemname);
            T.findhook = WG.add_hook("dialog", async function (data) {
                if (data.items) {
                    for (let item of data.items) {
                        if (item.name == itemname) {
                            callback(item.id);
                            WG.remove_hook(T.findhook);
                        }
                    }
                    callback("");
                }
                WG.remove_hook(T.findhook);
            });

            WG.Send("pack");
        },
        //public
        pname: function (idx = 0, n, cmds) {
            T.findPlayerByName(idx, n, cmds);
        },
        findPlayerByName: function (idx = 0, n, cmds) {
            cmds = T.recmd(idx - 1, cmds);
            if (cmds.indexOf(",") >= 0) {
                cmds = cmds.split(",");
            } else {
                cmds = cmds.split(";");
            }
            let p = cmds[0].split(" ")[0];
            cmds = T.recmd(0, cmds);
            n = n.replace("-", " ");
            console.log("findPlayerByName" + n);

            for (let i = 0; i < roomData.length; i++) {
                if (roomData[i].name && roomData[i].name.indexOf(n) >= 0) {
                    WG.Send(p + " " + roomData[i].id);
                }
            }
            WG.SendCmd(cmds);
        },
        findItem: async function (idx = 0, n, cmds) {
            cmds = T.recmd(idx - 1, cmds);
            if (cmds.indexOf(",") >= 0) {
                cmds = cmds.split(",");
            } else {
                cmds = cmds.split(";");
            }
            let p = cmds[0].split(" ")[0];
            cmds = T.recmd(0, cmds);
            console.log("finditem" + n);
            T.findhook = WG.add_hook("dialog", async function (data) {
                if (data.items) {
                    for (let item of data.items) {
                        if (item.name == n) {
                            if (p == "fenjie" || p == "drop") {
                                if (item.name.indexOf("★") >= 0) {
                                    messageAppend("高级物品 ,不分解");
                                    continue;
                                }
                            }
                            WG.SendCmd(p + " " + item.id);
                        }
                    }
                }
                WG.remove_hook(T.findhook);
                await WG.sleep(20);
                WG.SendCmd(cmds);
            });
            WG.Send("pack");

        },
        wait: async function (idx = 0, n, cmds) {
            cmds = T.recmd(idx, cmds);
            console.log("延时:" + n + "ms,延时触发:" + cmds);
            await WG.sleep(parseInt(n));
            WG.SendCmd(cmds);
        },
        killall: async function (idx = 0, n = null, cmds) {
            cmds = T.recmd(idx, cmds);
            console.log("叫杀");
            WG.kill_all();
            await WG.sleep(100);
            WG.SendCmd(cmds);
        },
        getall: async function (idx = 0, n = null, cmds) {
            cmds = T.recmd(idx, cmds);
            console.log("拾取");
            WG.get_all();
            await WG.sleep(100);
            WG.SendCmd(cmds);
        },
        cleanall: async function (idx = 0, n = null, cmds) {
            cmds = T.recmd(idx, cmds);
            console.log("清包");
            WG.clean_all();
            await WG.sleep(100);
            WG.SendCmd(cmds);
        },
        to: async function (idx = 0, n, cmds) {
            cmds = T.recmd(idx, cmds);
            WG.go(n);
            await WG.sleep(100);
            WG.SendCmd(cmds);
        },
        eq: async function (idx = 0, n, cmds) {
            cmds = T.recmd(idx, cmds);
            if (n == "0") {
                Helper.uneqall();
            } else {
                Helper.eqhelper(n);
            }
            await WG.sleep(100);
            WG.SendCmd(cmds);
        },
        zdwk: async function (idx = 0, n, cmds) {
            cmds = T.recmd(idx, cmds);
            WG.zdwk();
            await WG.sleep(100);
            WG.SendCmd(cmds);
        },
        killhook: undefined,
        killw: async function (idx = 0, n, cmds) {
            cmds = T.recmd(idx, cmds);
            var killid = "";
            for (let i = 0; i < roomData.length; i++) {
                if (roomData[i].name && roomData[i].name.indexOf(n) >= 0) {
                    killid = roomData[i].id;
                }
            }
            T.killhook = WG.add_hook('itemremove', function (data) {
                if (data.id == killid) {
                    WG.SendCmd(cmds);
                    WG.remove_hook(T.killhook);
                    T.killhook = undefined;
                }
            });
            WG.SendCmd("kill " + killid);
        },
        eqhook: undefined,
        eqw: async function (idx = 0, n, cmds) {
            var pcmds = T.recmd(idx, cmds);
            if (n.indexOf("<") >= 0) {
                T._findItem(n, async function (id) {
                    let p_itemid = id;
                    let p_flag = true;
                    if (p_itemid == "") {
                        p_flag = false;
                        WG.SendCmd(pcmds);
                        return;
                    }
                    T.eqhook = WG.add_hook('dialog', function (data) {
                        if (data.eq == 0 && data.id == p_itemid) {
                            p_flag = false;
                            WG.SendCmd(pcmds);
                            WG.remove_hook(T.eqhook);
                            T.eqhook = undefined;
                        }
                    });
                    while (p_flag) {
                        WG.Send("pack");
                        WG.SendCmd('eq ' + p_itemid);
                        await WG.sleep(1000);
                    }

                });
            } else {
                let p_itemid = n;
                let p_flag = true;
                if (p_itemid == "") {
                    p_flag = false;
                    WG.SendCmd(pcmds);
                    return;
                }
                T.eqhook = WG.add_hook(['text', 'dialog'], function (data) {
                    if (data.type == 'dialog') {
                        if (data.eq == 0 && data.id == p_itemid) {
                            p_flag = false;
                            WG.SendCmd(pcmds);
                            WG.remove_hook(T.eqhook);
                            T.eqhook = undefined;
                        }
                    }
                    if (data.type == 'text') {
                        if (data.msg.indexOf("你要装备什么") >= 0) {
                            p_flag = false;
                            WG.SendCmd(pcmds);
                            WG.remove_hook(T.eqhook);
                            T.eqhook = undefined;
                        }
                    }
                });
                while (p_flag) {
                    WG.Send("pack");
                    WG.SendCmd('eq ' + p_itemid);
                    await WG.sleep(1000);
                }
            }
        },
        usezml: async function (idx = 0, n, cmds) {
            cmds = T.recmd(idx, cmds);
            zml = GM_getValue(role + "_zml", zml);
            for (var zmlitem of zml) {
                if (zmlitem.name == n) {
                    await Helper.zmlfire(zmlitem);
                }
            }
            await WG.sleep(100);
            WG.SendCmd(cmds);
        },
        waitpfm: async function (idx = 0, n, cmds) {
            cmds = T.recmd(idx, cmds);
            let _flag = true;
            while (_flag) {
                if (!G.gcd && !G.cds.get(n)) {
                    WG.Send("perform " + n);
                    _flag = false;
                    await WG.sleep(10);
                    WG.SendCmd(cmds);
                }
                await WG.sleep(20);
            }
        },
        startjk: async function (idx = 0, n, cmds) {
            cmds = T.recmd(idx, cmds);
            ztjk_item = GM_getValue(role + "_ztjk", ztjk_item);
            for (var item of ztjk_item) {
                if (item.name == n) {
                    item.isactive = 1;
                    GM_setValue(role + "_ztjk", ztjk_item);
                    Helper.ztjk_func();
                    messageAppend("已注入" + item.name);
                    break;
                }
            }
            await WG.sleep(100);
            WG.SendCmd(cmds);
        },
        stopjk: async function (idx = 0, n, cmds) {
            cmds = T.recmd(idx, cmds);
            ztjk_item = GM_getValue(role + "_ztjk", ztjk_item);
            for (var item of ztjk_item) {
                if (item.name == n) {
                    item.isactive = 0;
                    GM_setValue(role + "_ztjk", ztjk_item);
                    Helper.ztjk_func();
                    messageAppend("已暂停" + item.name);
                    break;
                }
            }
            await WG.sleep(100);
            WG.SendCmd(cmds);
        },
        sm: async function (idx = 0, n, cmds) {
            cmds = T.recmd(idx, cmds);
            WG.sm_button();

            while ($('.sm_button').text().indexOf("停止") >= 0) {
                await WG.sleep(1000);
            }
            await WG.sleep(100);
            WG.SendCmd(cmds);
        },
        daily: async function (idx = 0, n, cmds) {
            cmds = T.recmd(idx, cmds);
            await Helper.oneKeyyj();
            Helper.oneKeyDaily();
            await WG.sleep(1000);
            while (Helper.daily_hook) {
                await WG.sleep(1000);
            }
            await WG.sleep(1000);
            Helper.oneKeySD();
            while (Helper.sd_hook) {
                await WG.sleep(1000);
            }

            await WG.sleep(100);
            WG.SendCmd(cmds);
        },
        xiyan: async function (idx = 0, n, cmds) {
            cmds = T.recmd(idx, cmds);
            Helper.xiyan();
            await WG.sleep(1000);
            while (Helper.marryhy) {
                await WG.sleep(1000);
            }
            await WG.sleep(100);
            WG.SendCmd(cmds);
        },
        yamen: async function (idx = 0, n, cmds) {
            cmds = T.recmd(idx, cmds);
            WG.go_yamen_task();
            await WG.sleep(1000);
            while (WG.yamen_lister) {
                await WG.sleep(1000);
            }
            await WG.sleep(100);
            WG.SendCmd(cmds);
        },
        boss: async function (idx = 0, n, cmds) {
            cmds = T.recmd(idx, cmds);
            Helper.kksBoss({
                content: "听说xxx出现在逍遥派-青草坪一带。"
            });
            await WG.sleep(1000);
            while (Helper.ksboss) {
                await WG.sleep(1000);
            }
            await WG.sleep(100);
            WG.SendCmd(cmds);
        },
        stoppfm: async function (idx = 0, n, cmds) {
            cmds = T.recmd(idx, cmds);
            if (G.auto_preform) {
                G.auto_preform = false;
                messageAppend("<hio>自动施法</hio>关闭");
                WG.auto_preform("stop");
            }
            await WG.sleep(100);
            WG.SendCmd(cmds);
        },
        startpfm: async function (idx = 0, n, cmds) {
            cmds = T.recmd(idx, cmds);
            if (!G.auto_preform) {
                G.auto_preform = true;
                messageAppend("<hio>自动施法</hio>开启");
                WG.auto_preform();
            }
            await WG.sleep(100);
            WG.SendCmd(cmds);
        },
        stopautopfm: async function (idx = 0, n, cmds) {
            cmds = T.recmd(idx, cmds);
            var dellist = n.split(",");
            for (let p of dellist) {
                if (!WG.inArray(p, blackpfm)) {
                    blackpfm.push(p);
                }
            }
            console.log("当前自动施法黑名单为:" + blackpfm);
            await WG.sleep(100);
            WG.SendCmd(cmds);
        },
        startautopfm: async function (idx = 0, n, cmds) {
            cmds = T.recmd(idx, cmds);
            let dellist = n.split(",");
            for (var i = 0; i < blackpfm.length; i++) {
                for (var item of dellist) {
                    if (item == blackpfm[i]) {
                        blackpfm.baoremove(i);
                    }
                }
            }
            console.log("当前自动施法黑名单为:" + blackpfm);
            await WG.sleep(100);
            WG.SendCmd(cmds);
        }

    };
    var ProConsole = {
        init: function () {
            //判断
            if (!L.isMobile()) {
                layer.open({
                    type: 1,
                    title: "运行命令",
                    shade: false,
                    offset: "rb",
                    zIndex: 961024,
                    success: function (layero, index) {
                        layer.style(index, {
                            marginLeft: -220,
                        });
                    },
                    content: $(".runtest")
                });
                var lastrun = GM_getValue("_lastrun", "");
                if (lastrun != "") {
                    $("#testmain").val(lastrun);
                }
                $("#runtesta").on('click', function () {
                    if ($('#testmain').val().split("\n")[0].indexOf("//") >= 0) {
                        if (ToRaid) {
                            ToRaid.perform($('#testmain').val());
                        }
                    } else if ($('#testmain').val().split("\n")[0].indexOf("#js") >= 0) {
                        var jscode = $('#testmain').val().split("\n");
                        jscode.baoremove(0)
                        eval(jscode.join(""));
                    } else {
                        WG.SendCmd($('#testmain').val());
                    }

                });
                $("#testmain").focusout(function () {
                    GM_setValue("_lastrun", $('#testmain').val());
                })
            }

        }

    }
    //UI
    var UI = {
        codeInput: `<div class="runtest layui-layer-wrap" style="display: none;">
            <textarea class="site-demo-text" id="testmain" data-enpassusermodified="yes">//<-第一行输入双斜杠即可运行流程命令 ,第一行输入#js 即可运行JS\n</textarea>
            <a class="layui-btn layui-btn-normal" id="runtesta" >立即运行</a>
        </div>`,
        btnui: `
<div class='WG_log'><pre></pre></div>
<div class='WG_button'>
<span class='zdy-item sm_button'>师门(Q)</span>
<span class='zdy-item go_yamen_task'>追捕(W)</span>
<span class='zdy-item kill_all'>击杀(E)</span>
<span class='zdy-item get_all'>拾取(R)</span>
<span class='zdy-item sell_all'>清包(T)</span>
<span class='zdy-item zdwk'>挖矿(Y)</span>
 <span class = "zdy-item auto_perform" style = "float:right;" > 自动攻击 </span>
                <span class="zdy-item cmd_echo" style="float:right;">代码</span>
</div>
`,
        syssetting: `<div class="zdy_dialog" style="text-align:right;width:280px">
    有空的话请点个star,您的支持是我最大的动力<a href="https://github.com/knva/wsmud_plugins" target="_blank">https://github.com/knva/wsmud_plugins</a>
    <span>
        <label for="family">门派选择：</label><select id="family" style="width:80px">
            <option value="武当">武当</option>
            <option value="华山">华山</option>
            <option value="少林">少林</option>
            <option value="峨嵋">峨嵋</option>
            <option value="逍遥">逍遥</option>
            <option value="丐帮">丐帮</option>
            <option value="武馆">武馆</option>
            <option value="杀手楼">杀手楼</option>
        </select>
    </span>
    <span><label for="sm_loser">师门自动放弃： </label><select id="sm_loser" style="width:80px">
            <option value="已停止">已停止</option>
            <option value="已开启">已开启</option>
        </select>
    </span>
    <span> <label for="zmlshowsetting"> 自命令显示位置： </label><select id="zmlshowsetting" style="width:80px">
        <option value="0"> 物品栏 </option>
        <option value="1"> 技能栏下方 </option>
    </select>
    </span>
    <span><label for="wudao_pfm">武道自动攻击： </label><input id="wudao_pfm" name="wudao_pfm" type="text" style="width:80px" value>
    </span>
    <span><label for="getitemShow">显示获得物品： </label><select id="getitemShow" style="width:80px">
            <option value="已停止"> 已停止 </option>
            <option value="已开启"> 已开启 </option>
        </select>
    </span>
    <span><label for="marry_kiss">自动喜宴： </label><select id="marry_kiss" style="width:80px">
            <option value="已停止">已停止</option>
            <option value="已开启">已开启</option>
        </select>
    </span>
    <span><label for="ks_Boss">自动传到boss： </label><select id="ks_Boss" style="width:80px">
            <option value="已停止">已停止</option>
            <option value="已开启">已开启</option>
        </select>
    </span>
    <span><label for="auto_eq">BOSS击杀时自动换装： </label><select id="auto_eq" style="width:80px">
            <option value="0">已停止</option>
            <option value="1">套装1</option>
            <option value="2">套装2</option>
            <option value="3">套装3</option>
        </select>
    </span>
    <span><label for="ks_pfm">BOSS叫杀延时(ms)： </label><input id="ks_pfm" name="ks_pfm" type="text" style="width:80px" value>
    </span>
    <span><label for="ks_wait">BOSS击杀等待延迟(s)： </label><input id="ks_wait" name="ks_wait" type="text" style="width:80px" value="120">
    </span>
    <span> <label for="autopfmswitch"> 自动施法开关： </label><select id="autopfmswitch" style="width:80px">
            <option value="已停止"> 已停止 </option>
            <option value="已开启"> 已开启 </option>
        </select>
    </span>
    <span><label for="unautopfm"> 自动施法黑名单(使用半角逗号分隔)： </label>
        <textarea class="settingbox hide zdy-box" id="unauto_pfm" name="unauto_pfm" style="display: inline-block;">  </textarea>
    </span>

    <label for="store_info"> 输入自动存储的物品名称(使用半角逗号分隔):</label>
    <textarea class="settingbox hide zdy-box" id="store_info" style="display: inline-block;">  </textarea>
    <label for="store_drop_info"> 输入自动丢弃的物品名称(使用半角逗号分隔):</label>
    <textarea class="settingbox hide zdy-box" id="store_drop_info" style="display: inline-block;">  </textarea>
    <label for="store_fenjie_info"> 输入自动分解的物品名称(使用半角逗号分隔):</label>
    <textarea class="settingbox hide zdy-box" id="store_fenjie_info" style="display: inline-block;">  </textarea>

    <label for="auto_command"> 输入喜宴及boss后命令(留空为自动挖矿或修炼):</label>
    <textarea class="settingbox hide zdy-box" id="auto_command" style="display: inline-block;">  </textarea>
    <label for="blacklist"> 输入黑名单boss名称(用半角逗号分隔):</label>
    <textarea class="settingbox hide zdy-box" id="blacklist" style="display: inline-block;">  </textarea>
    <div class="item-commands"><span class="updete_id_all">初始化ID</span></div>
</div>
`,
        zmlsetting: `<div class='zdy_dialog' style='text-align:right;width:280px'>
<span><label for="zml_name"> 输入自定义命令名称:</label></span><span><input id ="zml_name" style='width:80px' type="text"  name="zml_name" value=""></span>
    <span> <label for="zml_type"> 自命令类型： </label><select id="zml_type" style="width:80px">
            <option value="0"> 插件原生 </option>
            <option value="1"> Raidjs流程 </option>
            <option value="2"> JS原生 </option>
        </select>
    </span>
<span><label for="zml_info"> 输入自定义命令(用半角分号(;)分隔):</label></span>
<textarea class = "settingbox hide zdy-box"style = "display: inline-block;"id = 'zml_info'></textarea>
<div class = "item-commands"><span class = "getSharezml" > 查询分享 </span> <span class = "editadd" > 保存 </span>  <span class = "editdel"> 删除 </span> </div>
<div class = "item-commands"  id = "zml_show"></div>
</div> `,
        zmlandztjkui: `<div class='zdy_dialog' style='text-align:right;width:280px'>
            <div class = "item-commands" > <span class = "editzml" > 编辑自命令 </span> </div>
            <div class = "item-commands" > <span class = "editztjk" > 编辑自定义监控 </span>
            <span class = "startzdjk" > 注入所有监控 </span>
            <span class = "stopzdjk" > 暂停所有监控 </span> </div>
            <div class = "item-commands"  id = "zml_show"></div>

            </div>`,
        ztjksetting: `<div class='zdy_dialog' style='text-align:right;width:280px'>
            <span><label> 请打开插件首页,查看文档及例子,本人血量状态监控 请按如下规则输入关键字 90|90 这样监控的是hp 90% mp 90% 以下触发</label></span>
<span><label for="ztjk_name"> 名称:</label><input id ="ztjk_name" style='width:80px' type="text"  name="ztjk_name" value=""></span>
<span><label for="ztjk_type"> 类型(type):</label><select style = 'width:80px' id = "ztjk_type" >
    <option value = "status" > 状态(status) </option>
    <option value = "text" > 文本(text) </option>
    <option value = "msg" > 聊天(msg) </option>
    <option value = "die" > 死亡(die) </option>
    <option value = "itemadd" > 人物刷新(itemadd) </option>
    <option value = "room" > 地图切换(room) </option>
    <option value = "dialog" > 背包监控(dialog) </option>
    <option value = "combat" > 战斗状态(combat) </option>
    <option value = "sc" > 血量状态(sc) </option>
    <option value = "enapfm" > 技能监控(enapfm) </option>
    <option value = "dispfm" > 技能监控(dispfm) </option>
    </select></span>
<span id='actionp' style='display:block'><label for="ztjk_action"> 动作(action):</label><input id ="ztjk_action" style='width:80px' type="text"  name="ztjk_action" value=""></span>
<span><label for="ztjk_keyword"> 关键字(使用半角 | 分割):</label><input id ="ztjk_keyword" style='width:80px' type="text"  name="ztjk_keyword" value=""></span>
<span><label for = "ztjk_ishave" > 触发对象: </label><select style = 'width:80px' id = "ztjk_ishave" >
    <option value = "0" > 其他人 </option>
    <option value = "1" > 本人 </option>
    </select></span>
<span id='senduserp' style='display:block'><label for="ztjk_senduser"> MSG/其他人名称(使用半角 | 分割):</label><input id ="ztjk_senduser" style="width:80px;" type="text"  name="ztjk_senduser" value=""></span>
<span  style='display:block'><label> Buff层数:</label><input id ="ztjk_maxcount" style="width:80px;" type="text"  name="ztjk_maxcount" value=""></span>
<span><label for="ztjk_send"> 输入自定义命令(用半角分号(;)分隔):</label></span>
 <textarea class = "settingbox hide zdy-box"style = "display: inline-block;"id = 'ztjk_send'></textarea>
<div class = "item-commands" ><span class = "ztjk_sharedfind" > 查询分享 </span> <span class = "ztjk_editadd" > 保存 </span>  <span class = "ztjk_editdel" > 删除 </span></div>
<div class = "item-commands"  id = "ztjk_show"></div>
<div class = "item-commands"  id = "ztjk_set"></div>
</div> `,
        jsqui: `<div class='zdy_dialog'>
<div style="width:50%;float:left">
<span>潜能计算器</span>
<input type="number" id="c" placeholder="初始等级" style="width:50%" class="mui-input-speech"><br/>
<input type="number" id="m" placeholder="目标等级" style="width:50%"><br/>
<select id="se" style="width:50%">
<option value='0'>选择技能颜色</option>
<option value='1' style="color: #c0c0c0;">白色</option>
<option value='2' style="color:#00ff00;">绿色</option>
<option value='3' style="color:#00ffff;">蓝色</option>
<option value='4' style="color:#ffff00;">黄色</option>
<option value='5' style="color:#912cee;">紫色</option>
<option value='6' style="color: #ffa600;">橙色</option>
</select><br/>
<input type="button" value="计算" style="width:50%"  id="qnjs"><br/>
</div>
<div style="width:50%;float:left">
<span>开花计算器</span>
<input type="number" id="nl" placeholder="当前内力" style="width:50%" class="mui-input-speech"><br/>
<input type="number" id="xg" placeholder="先天根骨" style="width:50%"><br/>
<input type="number" id="hg" placeholder="后天根骨" style="width:50%"><br/>
<input type="button" value="计算" id = "kaihua" style="width:50%" <br/>
<label>人花分值：5000  地花分值：6500  天花分值：8000</label>
</div>

</div>`,
        lyui: `<div class='zdy_dialog' style='text-align:right;width:280px'>
            有空的话请点个star,您的支持是我最大的动力
            <a target="_blank"  href="https://github.com/knva/wsmud_plugins">https://github.com/knva/wsmud_plugins</a>
            药方链接:<a target="_blank"  href="https://suqing.fun/wsmud/yaofang/">https://suqing.fun/wsmud/yaofang/</a>
<span>
<label for = "medicine_level" > 级别选择： </label><select style='width:80px' id="medicine_level">
<option value="1">绿色</option>
<option value="2">蓝色</option>
<option value="3">黄色</option>
<option value="4">紫色</option>
<option value="5">橙色</option>
</select></span>
<span><label for="medicint_info"> 输入使用的顺序(使用半角逗号分隔):</label></span>
<textarea class = "settingbox hide zdy-box" style = "display: inline-block;" id = 'medicint_info'>石楠叶,金银花,金银花,金银花,当归</textarea>
<div class = "item-commands" > <span class = "startDev" > 开始 </span><span class = "stopDev" > 停止 </span> </div>
</div>`,
    }

    //全局变量
    var G = {
        id: undefined,
        state: undefined,
        room_name: undefined,
        family: undefined,
        items: new Map(),
        stat_boss_success: 0,
        stat_boss_find: 0,
        stat_xiyan_success: 0,
        stat_xiyan_find: 0,
        cds: new Map(),
        in_fight: false,
        auto_preform: false,
        can_auto: false,
        level: undefined,
        getitemShow: undefined,
        wk_listener: undefined,
        status: new Map(),

    };

    //GlobalInit
    var GI = {
        init: function () {

            WG.add_hook("items", function (data) {
                Helper.saveRoomstate(data);

            });

            WG.add_hook(["status", "login", "room", "items", "itemadd", "itemremove", "sc", "text", "state", "msg", "perform", "dispfm", "combat"], function (data) {
                if (data.type == "login") {
                    G.id = data.id;
                } else if (data.type == "room") {
                    let tmp = data.path.split("/");
                    G.map = tmp[0];
                    G.room = tmp[1];
                    if (G.map == 'home' || G.room == 'kuang')
                        G.can_auto = true;
                    else
                        G.can_auto = false;

                    G.room_name = data.name;
                    //强制结束pfm
                    if (G.in_fight) {
                        G.in_fight = false;
                        WG.auto_preform("stop");
                    }

                } else if (data.type == "items") {
                    G.items = new Map();
                    for (var i = 0; i < data.items.length; i++) {
                        let item = data.items[i];
                        if (item.id) {
                            let n = $.trim($('<body>' + item.name + '</body>').text());
                            let i = n.lastIndexOf(' ');
                            let j = n.lastIndexOf('<');
                            let t = "";
                            let s = "";
                            if (j >= 0) {
                                s = n.substr(j + 1, 2);
                            }
                            if (i >= 0) {
                                t = n.substr(0, i);
                                n = n.substr(i + 1).replace(/<.*>/g, '');
                            }

                            G.items.set(item.id, {
                                name: n,
                                title: t,
                                state: s,
                                max_hp: item.max_hp,
                                max_mp: item.max_mp,
                                hp: item.hp,
                                mp: item.mp,
                                p: item.p,
                                damage: 0
                            });
                        }

                    }
                } else if (data.type == "itemadd") {
                    if (data.id) {
                        let n = $.trim($('<body>' + data.name + '</body>').text());
                        let i = n.lastIndexOf(' ');
                        let j = n.lastIndexOf('<');
                        let t = "";
                        let s = "";
                        if (i >= 0) {
                            t = n.substr(0, i);
                            if (j >= 0) {
                                s = n.substr(j + 1, 2);
                            }
                            n = n.substr(i + 1).replace(/<.*>/g, '');
                        }
                        G.items.set(data.id, {
                            name: n,
                            title: t,
                            state: s,
                            max_hp: data.max_hp,
                            max_mp: data.max_mp,
                            hp: data.hp,
                            mp: data.mp,
                            p: data.p,
                            damage: 0
                        });
                    }
                } else if (data.type == "itemremove") {
                    G.items.delete(data.id);
                } else if (data.type == "sc") {
                    let item = G.items.get(data.id);
                    if (data.hp !== undefined) {
                        item.hp = data.hp;
                        if (data.id != G.id) {
                            G.scid = data.id; //伤害统计需要
                        }
                        // Helper.showallhp();
                    }
                    if (data.mp !== undefined) {
                        item.mp = data.mp;
                    }
                } else if (data.type == "perform") {
                    G.skills = data.skills;
                } else if (data.type == 'dispfm') {
                    if (data.id) {
                        if (data.distime) {}
                        G.cds.set(data.id, true);
                        var _id = data.id;
                        setTimeout(function () {
                            G.cds.set(_id, false);
                            //技能cd时间到
                            let pfmtimeTips = {
                                data: JSON.stringify({
                                    type: "enapfm",
                                    id: _id
                                })
                            };
                            WG.receive_message(pfmtimeTips);
                        }, data.distime);
                    }
                    if (data.rtime) {
                        G.gcd = true;
                        setTimeout(function () {
                            G.gcd = false;
                        }, data.rtime);
                    } else {
                        G.gcd = false;
                    }
                } else if (data.type == "combat") {
                    if (data.start) {
                        G.in_fight = true;
                        WG.auto_preform();
                    }
                    if (data.end) {
                        G.in_fight = false;
                        WG.auto_preform("stop");
                    }
                } else if (data.type == "status") {
                    if (data.count != undefined) {
                        G.status.set(data.id, {
                            "sid": data.sid,
                            "count": data.count
                        });
                    }
                }
            });
            WG.add_hook("state", function (data) {
                console.dir(data);
            });
            WG.add_hook("dialog", function (data) {
                //console.dir(data);
                if (data.dialog == "pack" && data.items != undefined && data.items.length >= 0) {
                    //equip =
                    for (var i = 0; i < data.items.length; i++) {
                        if (data.items[i].name.indexOf("铁镐") >= 0) {
                            equip["铁镐"] = data.items[i].id;
                            //messageAppend("铁镐ID:" + data.items[i].id);
                        }
                    }
                    for (var j = 0; j < data.eqs.length; j++) {
                        if (data.eqs[j] != null && data.eqs[j].name.indexOf("铁镐") >= 0) {
                            equip["铁镐"] = data.eqs[j].id;
                            //messageAppend("铁镐ID:" + data.eqs[j].id);
                        }
                    }
                } else if (data.dialog == 'pack' && data.desc != undefined) {
                    messageClear();
                    var itemname = data.desc.split("\n")[0];
                    var htmla = `<div class="item-commands ">
                <span class = "copyid" data-clipboard-target = ".target1" > ` + itemname + ":" + data.id +
                        `复制到剪贴板 </span></div> `;
                    messageAppend(htmla);
                    $(".copyid").on('click', () => {
                        var copydata = data.id;
                        GM_setClipboard(copydata);
                        messageAppend("复制成功");
                    });
                }
                if (data.dialog == 'score') {
                    if (!G.level) {
                        G.level = data.level;
                        console.log("欢迎" + G.level);
                    }
                }
            });
            WG.add_hook("msg", function (data) {
                if (data.ch == "sys") {
                    var automarry = GM_getValue(role + "_automarry", automarry);
                    if (data.content.indexOf("，婚礼将在一分钟后开始。") >= 0) {
                        console.dir(data);
                        if (automarry == "已开启") {
                            if (stopauto) {
                                let b = "<div class=\"item-commands\"><span  id = 'onekeyjh'>参加喜宴</span></div>"
                                messageClear();
                                messageAppend("<hiy>点击参加喜宴</hiy>");
                                messageAppend(b);
                                $('#onekeyjh').on('click', function () {
                                    Helper.xiyan();
                                });
                            } else {
                                console.log("xiyan");
                                messageAppend("自动前往婚宴地点");
                                Helper.xiyan();
                            }
                        } else if (automarry == "已停止") {
                            let b = "<div class=\"item-commands\"><span  id = 'onekeyjh'>参加喜宴</span></div>"
                            messageClear();
                            messageAppend("<hiy>点击参加喜宴</hiy>");
                            messageAppend(b);
                            $('#onekeyjh').on('click', function () {
                                Helper.xiyan();
                            });
                        }
                    }
                }
                if (data.ch == "rumor") {
                    if (data.content.indexOf("听说") >= 0 &&
                        data.content.indexOf("出现在") >= 0 &&
                        data.content.indexOf("一带。") >= 0) {
                        console.dir(data);
                        if (autoKsBoss == "已开启") {
                            if (stopauto) {
                                var c = "<div class=\"item-commands\"><span id = 'onekeyKsboss'>传送到boss</span></div>";
                                messageClear();
                                messageAppend("boss已出现");
                                messageAppend(c);
                                $('#onekeyKsboss').on('click', function () {
                                    Helper.kksBoss(data);
                                });
                            } else {
                                Helper.kksBoss(data);
                            }
                        } else if (autoKsBoss == "已停止") {
                            var c = "<div class=\"item-commands\"><span id = 'onekeyKsboss'>传送到boss</span></div>";
                            messageClear();
                            messageAppend("boss已出现");
                            messageAppend(c);
                            $('#onekeyKsboss').on('click', function () {
                                Helper.kksBoss(data);
                            });
                        }
                    }
                }
            });
            WG.add_hook('text', function (data) {
                if (G.getitemShow) {
                    if (data.msg.indexOf("恭喜你得到") >= 0 ||
                        (data.msg.indexOf("获得") >= 0 &&
                            data.msg.indexOf("经验") == -1) ||
                        data.msg.indexOf("你找到") >= 0 ||
                        data.msg.indexOf("你从") >= 0 ||
                        data.msg.indexOf("得到") >= 0) {
                        messageAppend(data.msg);
                    }
                }
            });
        },

    };

    var S = {
        serverUrl: "https://wsmud.ii74.com",
        GetJson: function (path, data) {
            let res = '';
            $.post(S.serverUrl + path, data, (data) => {
                res = data;
            });
            return res;
        },
        shareJson: function (usernaem, json) {
            $.post(S.serverUrl + "/sharejk", {
                username: usernaem,
                json: JSON.stringify(json)
            }, (res) => {
                if (res && res.code == 0) {
                    GM_setClipboard(res.shareid);
                    messageAppend("复制成功" + res.msg + ":" + res.shareid);
                } else {
                    messageAppend("失败了" + res.msg);
                }
            })
        },
        getShareJson: function (id, callback) {
            $.post(S.serverUrl + "/getjk", {
                shareid: id
            }, (res) => {
                if (res && res.code == 0) {
                    callback(res);
                } else {
                    messageAppend("失败了" + res.msg);
                }
            });

        }

    };
    $(document).ready(function () {

        $('head').append('<link href="https://s1.pstatp.com/cdn/expire-1-y/jquery-contextmenu/2.6.3/jquery.contextMenu.min.css" rel="stylesheet">');
        $('head').append('<link href="https://cdn.bootcss.com/layer/2.3/skin/layer.css" rel="stylesheet">');
        $('body').append(UI.codeInput);
        setTimeout(() => {
            var server = document.createElement('script');
            server.setAttribute('src', 'https://cdn.bootcss.com/layer/2.3/layer.js');
            document.head.appendChild(server);
            console.log("layer 加载完毕!");

        }, 2000);
        KEY.init();
        WG.init();
        GI.init();
        unsafeWindow.WG = WG;
        unsafeWindow.T = T;
        unsafeWindow.L = L;
        unsafeWindow.messageClear = messageClear;
        unsafeWindow.messageAppend = messageAppend;
        $.contextMenu({
            selector: '.container',
            items: {
                "关闭自动": {
                    name: "关闭自动",
                    visible: function (key, opt) {
                        return timer != 0;
                    },
                    callback: function (key, opt) {
                        WG.timer_close();
                    },
                },
                "自动": {
                    name: "自动",
                    visible: function (key, opt) {
                        return timer == 0;
                    },
                    "items": {
                        "自动武道": {
                            name: "自动武道",
                            callback: function (key, opt) {
                                WG.wudao_auto();
                            },
                        },
                        "自动小树林": {
                            name: "自动小树林",
                            callback: function (key, opt) {
                                WG.grove_auto();
                            }
                        },
                        "自动整理并清包": {
                            name: "自动整理并清包",
                            callback: function (key, opt) {
                                WG.sell_all();
                            }
                        },
                        "自动比试": {
                            name: "自动比试",
                            visible: function (key, opt) {
                                return Helper.fight_listener == undefined;
                            },
                            callback: function (key, opt) {
                                Helper.auto_fight();
                            },
                        },
                        "关闭比试": {
                            name: "关闭比试",
                            visible: function (key, opt) {
                                return Helper.fight_listener != undefined;
                            },
                            callback: function (key, opt) {
                                Helper.auto_fight();
                            },
                        },
                        "自动使用道具": {
                            name: "自动使用道具",
                            callback: function (key, opt) {
                                Helper.auto_useitem();
                            },
                        },
                        "自动研药": {
                            name: "自动研药",
                            callback: function (key, opt) {
                                Helper.auto_Development_medicine();
                            },
                        },
                        "一键日常": {
                            name: "一键日常",
                            callback: function (key, opt) {
                                Helper.oneKeyDaily();
                            },
                        },
                        "一键扫荡": {
                            name: "一键扫荡",
                            callback: function (key, opt) {
                                Helper.oneKeySD();
                            },
                        },

                    },
                },
                "换装设置": {
                    name: "换装设置",
                    "items": {
                        "xx0": {
                            name: "套装1设定或装备",
                            callback: function (key, opt) {
                                Helper.eqhelper(1);
                            },
                        },
                        "xx1": {
                            name: "清除套装1设置",
                            callback: function (key, opt) {
                                Helper.eqhelperdel(1);
                            },
                        },
                        "yy0": {
                            name: "套装2设定或装备",
                            callback: function (key, opt) {
                                Helper.eqhelper(2);
                            },
                        },
                        "yy1": {
                            name: "清除套装2设置",
                            callback: function (key, opt) {
                                Helper.eqhelperdel(2);
                            },
                        },
                        "zz0": {
                            name: "套装3设定或装备",
                            callback: function (key, opt) {
                                Helper.eqhelper(3);
                            },
                        },
                        "zz1": {
                            name: "清除套装3设置",
                            callback: function (key, opt) {
                                Helper.eqhelperdel(3);
                            },
                        },
                        "uneq": {
                            name: "取消所有装备",
                            callback: function (key, opt) {
                                Helper.uneqall();
                            },
                        },
                    }
                },
                "自命令,及自定监控": {
                    name: "自命令,及自定监控",
                    callback: function (key, opt) {
                        Helper.zml();
                    },
                },
                "手动喜宴": {
                    name: "手动喜宴",
                    callback: function (key, opt) {
                        Helper.xiyan();
                    },
                },
                "快捷传送": {
                    name: "常用地点",
                    "items": {
                        "mp0": {
                            name: "豪宅",
                            callback: function (key, opt) {
                                WG.go("住房");
                            },
                        },
                        "mp11": {
                            name: "衙门",
                            callback: function (key, opt) {
                                WG.go("扬州城-衙门正厅");
                            },
                        },
                        "mp12": {
                            name: "镖局",
                            callback: function (key, opt) {
                                WG.go("扬州城-镖局正厅");
                            },
                        },
                        "mp1": {
                            name: "当铺",
                            callback: function (key, opt) {
                                WG.go("扬州城-当铺");
                            },
                        },
                        "mp2": {
                            name: "擂台",
                            callback: function (key, opt) {
                                WG.go("扬州城-擂台");
                            },
                        },
                        "mp3": {
                            name: "帮派",
                            callback: function (key, opt) {
                                WG.go("扬州城-帮派");
                            },
                        },
                        "mp4": {
                            name: "武道",
                            callback: function (key, opt) {
                                WG.go("武道塔");
                            },
                        },
                        "mp5": {
                            name: "矿山",
                            callback: function (key, opt) {
                                WG.go("扬州城-矿山");
                            },
                        },
                        "mp6": {
                            name: "药铺",
                            callback: function (key, opt) {
                                WG.go("扬州城-药铺");
                            },
                        },
                        "mp7": {
                            name: "武庙疗伤",
                            callback: function (key, opt) {
                                WG.go("扬州城-武庙");
                                WG.Send("liaoshang");
                            },
                        }
                    },
                },
                "门派传送": {
                    name: "门派传送",
                    "items": {
                        "mp0": {
                            name: "武当",
                            callback: function (key, opt) {
                                let myDate = new Date();
                                if (myDate.getHours() >= 17) {
                                    WG.go("武当派-后山小院");
                                } else {
                                    WG.go("武当派-广场");
                                }
                            },
                        },
                        "mp1": {
                            name: "少林",
                            callback: function (key, opt) {
                                let myDate = new Date();
                                if (myDate.getHours() >= 17) {
                                    WG.go("少林派-方丈楼");
                                } else {
                                    WG.go("少林派-广场");
                                }
                            },
                        },
                        "mp2": {
                            name: "华山",
                            callback: function (key, opt) {
                                let myDate = new Date();
                                if (myDate.getHours() >= 17) {
                                    WG.go("华山派-客厅");
                                } else {
                                    WG.go("华山派-镇岳宫");
                                }
                            },
                        },
                        "mp3": {
                            name: "峨嵋",
                            callback: function (key, opt) {
                                let myDate = new Date();
                                if (myDate.getHours() >= 17) {
                                    WG.go("峨嵋派-清修洞");
                                } else {
                                    WG.go("峨嵋派-金顶")
                                }
                            },
                        },
                        "mp4": {
                            name: "逍遥",
                            callback: function (key, opt) {
                                let myDate = new Date();
                                if (myDate.getHours() >= 17) {
                                    WG.go("逍遥派-地下石室");
                                } else {
                                    WG.go("逍遥派-青草坪");
                                }
                            },
                        },
                        "mp5": {
                            name: "丐帮",
                            callback: function (key, opt) {
                                let myDate = new Date();
                                if (myDate.getHours() >= 17) {
                                    WG.go("丐帮-林间小屋");
                                } else {
                                    WG.go("丐帮-树洞内部");
                                }
                            },
                        },
                        "mp6": {
                            name: "武馆",
                            callback: function (key, opt) {
                                WG.go("扬州城-扬州武馆");
                            },
                        },
                        "mp7": {
                            name: "杀手楼",
                            callback: function (key, opt) {
                                WG.go("杀手楼-大门");
                            },
                        }
                    },
                },
                "打开仓库": {
                    name: "打开仓库",
                    callback: function (key, opt) {
                        WG.go("仓库");
                    },
                },
                "更新ID": {
                    name: "更新ID",
                    callback: function (key, opt) {
                        WG.updete_goods_id();
                        WG.updete_npc_id();
                    },
                },
                "调试BOSS": {
                    name: "调试BOSS",
                    visible: false,
                    callback: function (key, opt) {
                        //WG.SendCmd('test $findPlayerByName("冬马")');
                        Helper.kksBoss({
                            content: "听说枯荣大师出现在扬州城-广场一带。"
                        });
                    },
                },
                "流程菜单Raid.js": {
                    name: "流程菜单Raid.js",
                    callback: function (key, opt) {
                        if (unsafeWindow.ToRaid) {
                            unsafeWindow.ToRaid.menu();
                        } else {
                            messageAppend("插件未安装,请访问 https://greasyfork.org/zh-CN/scripts/375851-wsmud-raid 下载并安装");
                            window.open("https://greasyfork.org/zh-CN/scripts/375851-wsmud-raid ", '_blank').location;
                        }
                    }
                },
                "设置": {
                    name: "设置",
                    callback: function (key, opt) {
                        WG.setting();
                    },
                },
                "打开面板": {
                    name: "打开面板",
                    visible: function (key, opt) {
                        return $('.WG_log').css('display') == 'none';
                    },
                    callback: function (key, opt) {
                        WG.showhideborad();
                    },
                },
                "关闭面板": {
                    name: "关闭面板",
                    visible: function (key, opt) {
                        return $('.WG_log').css('display') != 'none';
                    },
                    callback: function (key, opt) {
                        WG.showhideborad();
                    },
                }
            }
        });
    });
})();
