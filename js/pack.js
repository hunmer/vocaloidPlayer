

// 预载图像
function preloadImage(key, src) {
    return new Promise(function(resolve, reject) {
        let img = new Image();
        img.onload = function() {
            resolve(img);
            //加载时执行resolve函数
        }
        img.onerror = function() {
            reject(src + '这个地址错误');
            //抛出异常时执行reject函数
        }
        img.src = src;
    }
    );
}

// 下载
function download(url='') {
    if (url == '')
        url = $('#viewer img').attr('src');
    fetch(url).then(res=>res.blob().then(blob=>{
        var a = document.createElement('a');
        var url = window.URL.createObjectURL(blob);
        a.href = url;
        a.download = g_v_viewing.data.id + '-' + g_v_viewing.model + '-' + g_v_viewing.offset + '.jpg';
        a.click();
        window.URL.revokeObjectURL(url);
    }
    ))
}