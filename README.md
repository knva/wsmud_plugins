# wsmud_plugins


[![Github](https://img.shields.io/github/stars/knva/wsmud_plugins?label=Star&style=social)](https://github.com/knva/wsmud_plugins) [![Greasy Fork](https://img.shields.io/badge/Greasy%20Fork-wsmud-pluginss)](https://greasyfork.org/zh-CN/scripts/371372-wsmud-pluginss) ![GitHub code size in bytes](https://img.shields.io/github/languages/code-size/knva/wsmud_plugins) ![GitHub](https://img.shields.io/github/license/knva/wsmud_plugins)

文档地址:

[Raid.js以及wsmud_pluginss插件命令教程入口](https://www.yuque.com/wsmud/doc/gm0b8i)

### 脚本需要使用tampermonkey 插件

[tampermonkey 下载](https://www.tampermonkey.net/)

蓝奏云下载地址：https://www.lanzous.com/i8twh6h

如果安装乱码,可以访问 ,请依次安装

[Wsmud_Pluginss下载](https://github.com/knva/wsmud_plugins/raw/master/wsmud_plugins.user.js)

[Wsmud_Raid下载](https://github.com/mapleobserver/wsmud-script/raw/master/plugins/wsmud_Raid.user.js)

[Wsmud_Trigger下载](	https://github.com/mapleobserver/wsmud-script/raw/master/plugins/wsmud_Trigger.user.js)


第一次使用,请先点击右键,选择,设置,然后初始化ID ,若初始化失败,请重新安装,或者更换浏览器

请手动设置是否开启自动喜宴,自动boss,以及设定延时

请右键设置一切可以设置的东西

有问题请先看FAQ 往下面拉 ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓

插件列表:
Raid.js 自动副本插件 https://greasyfork.org/zh-CN/scripts/375851-wsmud-raid

wsmud_Trigger 触发器插件 https://greasyfork.org/zh-CN/scripts/378984

wsmud_funny 趣味界面插件 https://greasyfork.org/zh-CN/scripts/441262-wsmud-funny2

wsmud_login 登录插件  https://greasyfork.org/zh-CN/scripts/443214-wsmud-login1

wsmud 插件分享码查询 https://wsmud.ii74.com

wsmud 多开 http://wsmud.aize.org/

wsmud 单开 http://mush.fun    http://mush.aize.org

有问题请发帖,会修复

自命令例子:
用于新手任务
```
 分享码 zml44bbb8dbea398dee545c667bd0837b24
```

### **语法与%% 语法说明
 ** 为获取系统id中的物品id
例如 
```
*养精丹*
%% 为获取系统中npc的id
例如
%店小二%

使用举例
buy 1 *布衣* from %杂货铺老板 杨永福%

代码输出:

buy 1 ur1b35636d6 from 2www35636d6
你从杨永福购买了一件布衣。
```


状态监控使用说明
本功能目前支持status(状态) text(文本) msg(聊天信息,谣言请输入谣言,系统请输入系统) die(死亡) 监控 itemadd(人物刷新)监控 dialog(背包)

combat(战斗状态)聊天及文本监控可以不用输入action,战斗状态关键字为 start 或end

关键字支持或操作,使用半角 | 分割 
Buff层数为设置buff最高层数,配合action=refresh,仅限于本人监控,使用技能请使用$waitpfm 释放

血量监控,请使用hp百分比|mp百分比 的方式设置关键字 例如 90|90 就是生命值 90%以下 会触发,内力 90%以下也会触发

血量监控其他人时,请输入其他人的名字,目前仅支持一个人名
```
例子1: 补无招
类型 status
动作 remove
关键字 weapon
触发对象 本人
命令: perform sword.wu
```
```
例子1.1: 无缝忙乱
类型 status
动作 remove
关键字 busy
触发对象 其他人
命令: perform sword.poqi;perform unarmed.chan
```
```
例子2: 监控文本
类型 text
动作 
关键字  宝石|玄晶
触发对象
命令: 自行填写
```
```
例子3: 监控msg
类型 msg
动作
关键字 封印等级
触发对象
msg发送人 站牌
命令: $zdwk
```
```
例子4:监控物品获取
类型 dialog
动作
关键字 养精丹
触发对象
命令: use $findItem("<hig>养精丹</hig>");
```
```
例子4.1:监控物品获取并使用id
类型 dialog
动作
关键字 布鞋
触发对象
命令: drop {id};
```
```
例子5: 监控房间
类型 room
动作
关键字 豪宅-练功房
触发对象
命令: enable tiannanbu;
```
```
例子6: 监控人物刷新
类型 itemadd
动作
关键字 十夫长
触发对象
命令: $killall;
```
```
例子6.1: 监控人物刷新并使用id
类型 itemadd
动作
关键字 五绝宝箱
触发对象
命令: get all from {id};
增加 背包监控的物品id替换 使用方法 dialog 监控 执行命令 drop {id}; 即可丢弃获得的物品
```

监控时可以使用的占位符

存在获得id的场景时 可以使用 {id} 作为目标id
room监控 时 可以使用 {name} 占位符作为房间名

例如房间切换

type room

关键字 : 住房

命令 $syso {name}

即可触发 在信息窗口打印 房间名的效果

### 自命令使用说明
目前支持以下自命令

#### $findPlayerByName 或 $pname
返回一个房间内指定名称的绝对ID

例如

ask $findPlayerByName("冬马");ask $pname("冬马")
$findItem
返回背包内的物品绝对ID

注意: 名称要使用与背包中名称相同的字符串,包括颜色代码, 强化等级

例如

drop $findItem("<hic>养精丹</hic>")

#### $wait
等待x 毫秒

例如

$wait 10000

#### $killall
一键叫杀

#### $getall
拾取

#### $cleanall
清包

#### $to
传送

例如

$to 住房


#### $eq
换套装, $eq 0 时为脱所有装备

例如

$eq 1 

#### $eqskill
用于切换技能组设置

例如

$eqskill 1 

#### $killw
击杀完成后才会继续执行命令

例如

$killw 武道塔守护;go up

#### $eqw
装备物品后才会继续执行命令,注意,此处物品名称 应为完整物品名称,包括强化等级,物品品质代码

例如

$eqw <hiy>铁镐</hiy>;go up

#### $usezml
使用已经设置好的自命令

语法

$usezml 自命令名称;

例如

$usezml ifuleu;go up

#### $waitpfm
使用技能,直到使用出来再继续操作

语法

$waitpfm 技能代码;

例如

$waitpfm unarmed.zhen;test ifuleyou

#### $startjk 和 $stopjk
启动或取消监控

语法

$startjk 监控名;

例如

$startjk ifuleyou;

#### $startpfm 和 $stoppfm
启动或取消自动出招

语法

$startpfm;

例如

$startpfm;

#### $startautopfm 和 $stopautopfm
启动或取消指定技能的脚本自动出招

语法

$startautopfm force.tu,unarmed.zhen;

例如

$startautopfm force.tu,unarmed.zhen;

#### $sm
师门任务

#### $yamen
只能单独使用的追捕命令

建议再监控中监控 enapfm 夺魄或者其他秒逃犯的技能 自动触发 $yamen 命令

#### $zdwk
自动挖矿 武帝为自动修炼

#### $rzdwk
自动挖矿 无视境界仅挖矿 

#### $stopallauto $startallauto
本函数仅用于启动OR暂停自动boss及喜宴,若系统自动boss及喜宴未开自动,则无效

#### $sellall
用于整理背包

#### $fenjie
用于分解设置中的分解物品

#### $store
用于自动储存物品

#### $drop
用于自动丢弃物品

#### $cls
清理log输出

#### $clsSakada
清空伤害输出统计

#### $syso
打印信息

```

$syso hello

```

#### $stop
停止自动

```

$sm;$wait 5000;$stop

```

#### $music
播放<<沧海一声笑>>的音乐盒


#### $tts
播放文本转语音
```
$tts 门派战开始
```

#### $tnbuy
根据设置中的自动购买信息，在当铺购买相应物品，注意 脚本未内置停止当前动作命令
```
stopstate;$tnbuy
```

#### $atlx
自动将练习代码添加到系统设置中.当触发系统事件就会开始练习
```
stopstate;$atlx;dazuo
```

### FAQ
### 关于如何在自命令中设置自动出招
只需要在命令的最后加上一个分号即可 
例如

系统命令

setting auto_pfm force.tu,unarmed.zhen

插件自命令

setting auto_pfm force.tu,unarmed.zhen;
### 为什么$to 练功房 无法使用了
因为 v0.0.31.192 2019-03-19 - 练功房->住房-练功房,优化waitpfm 修改了相关地点

### ios想使用脚本怎么办
加ios脚本群708922326 脚本与官方同步更新

### 设置中的云同步信息丢了,能找回吗
不能找回,一旦覆盖,无法找回

### 如何使用自动存仓库与清包
右键,自动->自动整理并清包

### 我想把仓库里面的内容一键设置为自动存储
脚本设置->选择更新存储信息(覆盖) 即可一键设置

### 我想设置屏蔽某些人的世界聊天
脚本设置->开启屏蔽->输入屏蔽的人名 或者输入 屏蔽的聊天内容

### 如何完美的使用运行命令窗口

点击代码后,会显示一个窗口,直接输入即可

本插件语法
```
$to 住房-练功房;
调用raid.js 流程
```
```
\\
@print 流程
调用js
```
```
#js
console.log("js");
我不知道技能的id 怎么办
点击右下角的代码,然后使用技能,查看黄色部分代码即可
```
例如
```
perform force.tu
去掉 perform 就是技能的代码了
```

### yandex 浏览器如何使用插件
yandex 浏览器如何使用插件 https://greasyfork.org/zh-CN/forum/discussion/50536/x

### QQ群是多少
367657589

### 我想提建议或意见
请发帖或者加群367657589

### 我想共享我的代码
建议使用github 发送pull request

### 传送地点列表:
```
住房
住房-卧室
住房-小花园
住房-炼药房
住房-练功房
扬州城-钱庄
扬州城-广场
扬州城-醉仙楼
扬州城-杂货铺
扬州城-打铁铺
扬州城-药铺
扬州城-衙门正厅
扬州城-镖局正厅
扬州城-矿山
扬州城-喜宴
扬州城-擂台
扬州城-当铺
扬州城-帮派
帮会-大门
帮会-大院
帮会-练功房
帮会-聚义堂
帮会-仓库
帮会-炼药房
扬州城-扬州武馆
扬州城-武庙
武当派-广场
武当派-三清殿
武当派-石阶
武当派-练功房
武当派-太子岩
武当派-桃园小路
武当派-舍身崖
武当派-南岩峰
武当派-乌鸦岭
武当派-五老峰
武当派-虎头岩
武当派-朝天宫
武当派-三天门
武当派-紫金城
武当派-林间小径
武当派-后山小院
少林派-广场
少林派-山门殿
少林派-东侧殿
少林派-西侧殿
少林派-天王殿
少林派-大雄宝殿
少林派-钟楼
少林派-鼓楼
少林派-后殿
少林派-练武场
少林派-罗汉堂
少林派-般若堂
少林派-方丈楼
少林派-戒律院
少林派-达摩院
少林派-竹林
少林派-藏经阁
少林派-达摩洞
华山派-镇岳宫
华山派-苍龙岭
华山派-舍身崖
华山派-峭壁
华山派-山谷
华山派-山间平地
华山派-林间小屋
华山派-玉女峰
华山派-玉女祠
华山派-练武场
华山派-练功房
华山派-客厅
华山派-偏厅
华山派-寝室
华山派-玉女峰山路
华山派-玉女峰小径
华山派-思过崖
华山派-山洞
华山派-长空栈道
华山派-落雁峰
华山派-华山绝顶
峨嵋派-金顶
峨嵋派-庙门
峨嵋派-广场
峨嵋派-走廊
峨嵋派-休息室
峨嵋派-厨房
峨嵋派-练功房
峨嵋派-小屋
峨嵋派-清修洞
峨嵋派-大殿
峨嵋派-睹光台
峨嵋派-华藏庵
逍遥派-青草坪
逍遥派-林间小道
逍遥派-练功房
逍遥派-木板路
逍遥派-工匠屋
逍遥派-休息室
逍遥派-木屋
逍遥派-地下石室
丐帮-树洞内部
丐帮-树洞下
丐帮-暗道
丐帮-破庙密室
丐帮-土地庙
丐帮-林间小屋
杀手楼-大门
杀手楼-大厅
杀手楼-暗阁
杀手楼-铜楼
杀手楼-休息室
杀手楼-银楼
杀手楼-练功房
杀手楼-金楼
杀手楼-书房
杀手楼-平台
襄阳城-广场
武道塔
```


###自定义插件开发方法
按照如下规则编写你的JS文件 ,即可使用WG.send功能,及T类中的函数
```javascript
// ==UserScript==
// @name         wsmud_XXX
// @namespace    cqv
// @version      0.0.0
// @date         23/12/2018
// @modified     27/12/2018
// @homepage     网站链接
// @description  武神传说 MUD
// @author       作者名
// @match        http://game.wsmud.com/*
// @match        http://www.wsmud.com/*
// @run-at       document-end
// @grant        unsafeWindow
// @grant        GM_getValue
// @grant        GM_setValue


// ==/UserScript==

(function () {
    'use strict';

    var WG = undefined;
    var T = undefined;
    var messageAppend = undefined;
    var messageClear = undefined;
///
///代码实现
///
///
    $(document).ready(function () {
        WG = unsafeWindow.WG;
        T = unsafeWindow.T;
        messageAppend  = unsafeWindow.messageAppend;
        messageClear =  unsafeWindow.messageClear;
    });
})();
```


开发文档 https://www.yuque.com/kmb6af/fhlcr9/gm0b8i


脚本首页 https://greasyfork.org/zh-CN/scripts/371372-wsmud-pluginss


推荐使用JetBrains 软件进行开发

https://www.jetbrains.com/?from=wsmud_pluginss
