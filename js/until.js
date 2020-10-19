
var a_get = getGETArray();
//var g_s_api = 'php/';
var g_s_api = 'https://figurosity.glitch.me/';
var g_localKey = 'figurosity_';
// 本地储存前缀
var g_config = local_readJson('config', {
});

function getGETArray() {
    var a_result = [], a_exp;
    var a_params = window.location.search.slice(1).split('&');
    for (var k in a_params) {
        a_exp = a_params[k].split('=');
        if (a_exp.length > 1) {
            a_result[a_exp[0]] = decodeURIComponent(a_exp[1]);
        }
    }
    return a_result;
}

function local_saveJson(key, data) {
    if (window.localStorage) {
        key = g_localKey + key;
        data = JSON.stringify(data);
        if(data == undefined) data = '[]';
        return localStorage.setItem(key, data);
    }
    return false;
}

function local_readJson(key, defaul = '') {
    if(!window.localStorage) return defaul;
    key = g_localKey + key;
    var r = JSON.parse(localStorage.getItem(key));
    return r === null ? defaul : r;
}

function getLocalItem(key, defaul = '') {
    var r = null;
    if(window.localStorage){
        r = localStorage.getItem(g_localKey + key);
    }
    return r === null ? defaul : r;
}

function setLocalItem(key, value) {
    if(window.localStorage){
       return localStorage.setItem(g_localKey + key, value);
    }
    return false;
}

function randNum(min, max){
    return parseInt(Math.random()*(max-min+1)+min,10);
}

function getTimeFormat(i){
    var h = 0, m = 0;
    if(i >= 3600){
        h = parseInt(i / 3600);
        i = i % 3600;
    }
    if(i >= 60){
        m = parseInt(i / 60)
        i = i % 60;
    }
    return getFull(h, true, ':') + getFull(m, false, ':') + getFull(i, false, '');
}

function getFull(h, isHour, s){
    return (h === 0 && isHour ? '' : (h < 10 ? '0' + h : h) + s)
}

function replaceTime(t){
    return t.replace('T', ' ').split('.')[0];
}


function cutString(str, s, e){
    var i_start = str.indexOf(s);
    if(i_start != -1){
        i_start += s.length;
        var i_end = str.indexOf(e, i_start);
        if(i_end != -1){
            return str.substr(i_start, i_end - i_start);
        }
    }
    return '';
}

function getString(arr, def = ''){
    console.log(arr);
    arr.map(function(d){
        if(typeof(d) == 'string' && d.length > 0) return d;
    });
    return def;
}

function utf8_to_b64(str) {
    return window.btoa(unescape(encodeURIComponent(str)));
}

function b64_to_utf8(str) {
    return decodeURIComponent(escape(window.atob(str)));
}


function add_favorite(id){
    var json = getDetail(id);
    if(json != undefined){
        favorite($('.card[data-id='+id+']'), json);
    }
}

// 收藏模块
var g_v_favorites = local_readJson('favorites', {});
function favorite(dom=null, json=null, b=null) {
    /*if (json === null)
        json = g_v_viewing.data;*/
    var key = "_" + json.song.id;
    if (g_v_favorites[key] == undefined) {
        if (b === null)
            b = true;
    } else {
        if (b === null)
            b = false;
    }
    if (b) {
        g_v_favorites[key] = json;
    } else {
        delete (g_v_favorites[key]);
    }
    if (dom.length > 0) {
        var heart = dom.find('.-heart');
        console.log(heart);
        if(b){
            heart.addClass('text-danger').removeClass('text-white-50');
        }else{
            heart.removeClass('text-danger').addClass('text-white-50');
        }
    }
    local_saveJson('favorites', g_v_favorites);
    return b;
}