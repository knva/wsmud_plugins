
const unsafeWindow = window;
const GM_info = {};

var httpRequest = new XMLHttpRequest();//第一步：建立所需的对象
httpRequest.open('GET', 'http://wsmud.ii74.com/S/version', true);//第二步：打开连接  将请求参数写在url中  ps:"./Ptest.php?name=test&nameone=testone"
httpRequest.send();//第三步：发送请求  将请求参数写在URL中
/**
 * 获取数据后的处理程序
 */
httpRequest.onreadystatechange = function () {
  if (httpRequest.readyState == 4 && httpRequest.status == 200) {
    var json = httpRequest.responseText;//获取到json字符串，还需解析
    console.log(json);
    GM_info.script = JSON.parse(json);
  }
};


GM_info.script = {"version":""}
function GM_addStyle(css) {
  try {
    var style = document.createElement('style');
    style.textContent = css;
    (document.head || document.body || document.documentElement || document).appendChild(style);
  } catch (e) {
    console.log('GM_addStyle: ' + e);
  }
}

function GM_setValue(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch(e) {
    console.log('GM_setValue: ' + e);
  }
}

function GM_getValue(key, defaultValue) {
  let value = localStorage.getItem(key);
  if (!value) {
    return defaultValue;
  }
  try {
    return JSON.parse(value);
  } catch (e) {
    console.log('GM_getValue: ' + e);
    return defaultValue;
  }
}
function GM_listValues(){
    let len = localStorage.length;
    let list = [];
    for(let i = 0 ; i < len; i++){
		if(localStorage.key(i)!='roles'){
			list.push(localStorage.key(i))
		}
    }
    return list;
}
function GM_deleteValue(key) {
  localStorage.removeItem(key);
}

function GM_setClipboard(content) {
  let transfer = document.createElement('input');
  document.body.appendChild(transfer);
  transfer.value = content;
  transfer.focus();
  transfer.select();
  try {
    document.execCommand('copy');
  } catch(e) {
    console.log('GM_setClipboard: ' + e.message);
  }
  transfer.blur();
  document.body.removeChild(transfer);
}
function GM_export(){
    try{
        let lis =GM_listValues();
        let data = {};
        for(let i = 0 ; i<lis.length;i++){
            data[lis[i]] = GM_getValue(lis[i]);
        }
        let res = JSON.stringify(data);
        console.log(res);
        android.myexport(res);
    }
    catch(e){
        console.log('GM_export: ' + e.message);
    }
}
function GM_import(content){
    let _json = content;
    for(let item in _json){
        GM_setValue(item,_json[item])
    }
}