var g_v_favorites = local_readJson('favorites', {});
var g_config = local_readJson('config', {});

var g_i_lastScroll = 0; // 最后一次滚动的时间
var g_b_scrolling = false; // 是否正在滚动
var g_b_scroll = false; // 是否进入聚焦模式
var g_i_lastTop = 0;
var g_i_lastHeight = 0;
var g_a_details_id = []; // id信息json列表
var g_b_scrolld = false;

var g_i_favorite_start = 0;
$(function() {

	window.history.pushState(null, null, "#");
	window.addEventListener("popstate", function(event) {
		window.history.pushState(null, null, "#");
		event.preventDefault(true);
		event.stopPropagation();
		//$('#modal1').modal('close');
	});
	$(window).scroll(function(event) {
		if(g_b_scrolling){
			event.preventDefault(true);
			event.stopPropagation();
			return;		
		}
		if(g_b_scrolld) g_b_scrolld = false;

	    var scrollTop = $(this).scrollTop();
	    if(g_b_scroll){ // 滚出视频
			var offset = Math.abs(Math.abs(g_i_lastTop) - Math.abs(scrollTop));
			var opacity = offset / g_i_lastHeight;
			if(opacity >= 0.8){
				$('#mask').fadeOut('fast'); // 隐藏遮罩
				g_b_scroll = false;
			}else{
				if(opacity < 0.5) opacity = 0.5;
				$('#mask').css('opacity', opacity);
			}
			return;
	    }
	    var i = $(document).height() - (scrollTop + $(this).height());
		var now = new Date().getTime() / 1000;
        g_i_lastScroll = now;	   
	    if (i <= 100) {
	        //滚动条到达底部
            if (!g_b_loading && now - g_i_loading_last >= 3) {
                g_i_loading_last = now;
                next_page();
            }
	    } else if (scrollTop <= 0) {//滚动条到达顶部
	    }
	});	
	setInterval(function(){
	   // 取屏幕中间元素
	   //if(g_b_scrolling) return;
	   if(g_b_loading || new Date().getTime() / 1000 - g_i_lastScroll < 0.5) return;
		var d = $(document.elementFromPoint($(this).width() / 2, $(this).height() / 2));
		if(d.length == 0) return;

		if(d.attr('id') == 'mask'){
			d.fadeOut('slow');
			return;
		}
		d = d.parents(".card");
		if(d.length === 0) return;
		if($('#mask').css('display') == 'none'){
			$('#mask').fadeIn('slow'); // 显示
		}

		setPlaying(d);
	}, 300);
	$(document).on('click', '.-btn_copyUrl', function(event) {
		if($(this).attr('data-copiable') == undefined){
			var clipboard = new ClipboardJS('.-btn_copyUrl');
			clipboard.on('success', function(e) {
			    e.clearSelection();
			    e.destroy();
			});
			this.click();
		}
		
	});

	$('button[data-value]').click(function() {
		$(this).parents('.btn-group').find('.btn-info').removeClass('btn-info');
		$(this).addClass('btn-info');
		var type = $('.nav-link.active').html().toLocaleLowerCase();
		if(type == 'ranking'){
			g_api.params_ranking[$(this).attr('data-key')] = $(this).attr('data-value')
		}else{
			g_api.params[$(this).attr('data-key')] = $(this).attr('data-value');
			g_api.params.start = 0;
		}
		$('#pills-'+type).find('.-pv-list').html('');
		data_query(type);
	});
	init();
});   

function setPlaying(d){
	if(!d.hasClass('-video_playing')){
		$('.-video_playing').removeClass('-video_playing');
		d.addClass('-video_playing');
		scrollToCenter(d);
	}
}

function switchUI(type){
	$('#mask').hide();
	var con = $('#pills-'+type);

	if(con.find('.-pv-list .card').length === 0){
		$('body, html').animate({scrollTop: '0px'}, 0);
		if(type == 'user'){
			favorte_list_load();
		}else{
			data_query(type);
		}
	}
     g_i_lastScroll = new Date().getTime() / 1000 + 2;	   

}

function next_page(){
	var type = $('.nav-link.active').html().toLocaleLowerCase();
	if(type == 'user'){
		favorte_list_load();
	}else{
		data_query(type);
	}
}

function favorte_list_load(){
	var keys = Object.keys(g_v_favorites);
	var h = '', value;
	for(var i=g_i_favorite_start;i<30;i++){
		if(i >= keys.length) break;
		value = g_v_favorites[keys[i]];
		h = h + data_parseData(value, value.url);
	}
	g_i_favorite_start += i;
	console.log(g_i_favorite_start);
	$('#pills-user .-pv-list').append(h);
}

function scrollToCenter(dom, f){
	if(dom.offset() === undefined) return;
	var top = dom.offset().top - ($(window).height() - dom.height()) / 2;
	g_i_lastHeight = dom.height() / 2;
	g_i_lastTop = top;
	g_b_scrolling = true;
	$("html, body").animate({
		scrollTop: top+'px',
	}, 1000, function(){
		g_b_scroll = true;
		g_b_scrolling = false;
		$('#mask').fadeIn('slow', function() {

			$('video').each(function(i, d){
		  		if(!d.paused) d.pause(); // stop media
		  	});	
			if(dom.attr('data-loaded') != 1 && dom.attr('data-html') != undefined){
				player_apply(dom.find('.card-img-top'), dom.attr('data-html'), dom.attr('data-id'));
				dom.attr('data-loaded', 1);
			}else{
				var video = dom.find('video');
				if(video.length > 0){
					if(video[0].paused) video[0].play(); // 继续播放
					return;
				}
			}
			if(typeof(f) == 'function') f();
		});
	});		
}

function showUI(id) {
    $('.container').each(function(index, el) {
        if (el.id == id) {
            $(el).removeClass('hide');
        } else {
            $(el).addClass('hide');
        }
    });
}

const animateCSS = (element, animation, attr) =>

  new Promise((resolve, reject) => {

	  if(attr.styles == undefined) attr.styles = [];
	  if(attr.loop == undefined) attr.loop = true;
	  if(attr.prefix == undefined) attr.prefix = 'animate__';
	  if(attr.callback == undefined) attr.callback = function(){}


    const animationName = `${attr.prefix}${animation}`;
    const node = element[0];

    node.classList.add(`${attr.prefix}animated`, animationName);
    for(var style of attr.styles){
    	node.style.setProperty(style[0], style[1]);
    }
    // When the animation ends, we clean the classes and resolve the Promise
    function handleAnimationEnd() {
      node.classList.remove(`${attr.prefix}animated`, animationName);
      resolve('Animation ended');
      if(typeof(attr.callback) == 'function') attr.callback();
    }
    if(attr.loop){
    	node.addEventListener('animationend', handleAnimationEnd, {once: true});
    }
  });


  // 流程
  function init(){
  	data_query('newst');
  }

  // http

  var g_api = {
  	'type': '',
  	'api': 'https://neysummer-vocaloidpv.glitch.me/',
  	// 'api': 'php/',
  	'params': {
		'start': 0,
		'getTotalCount': 'true',
		'maxResults': 10,
		'query': '',
		'fields': 'AdditionalNames%2CThumbUrl',
		'lang': 'Default',
		'nameMatchMode': 'Auto',
		'sort': 'AdditionDate',
		'songTypes': '',
		'childTags': 'false',
		'artistParticipationStatus': 'Everything',
		'releaseEventId': '',
		'onlyWithPvs': 'true',
		'pvServices': '',
		'since': '',
		'userCollectionId': '',
		'status': ''
  	},
  	"params_ranking": {
  		'durationHours': 168,
  		'fields': 'AdditionalNames%2CThumbUrl%2CTags',
  		'vocalist': '', 
  		'filterBy': 'CreateDate',
  		'languagePreference': 0
  	}
  }
  g_api.defaultParams = g_api.params;

  function data_query(type){
  	setLoading(true);

  	g_api.type = type;
  	switch(type){
  		case 'newst':

  			break;
  	}
	 g_i_loading_last = new Date().getTime() / 1000;
  	var url = g_api.api + 'api.php?type=' + type + '&' + data_getParms(type);
  	$.ajax({
  		url: url,
  		dataType: 'json'
  	})
  	.done(function(json) {
  		data_load(type, json);
  	})
  	.fail(function() {
  		console.log("error");
  	})
  	.always(function() {
        g_i_lastScroll = new Date().getTime() / 1000 + 2;	   
  		setLoading(false);
  	});
  }

  function data_load(type, json){
  	console.log(type, json);
	switch(type){
		case 'newst':
			break;
	}

	var html = '', dom, card, c =0, player = '', isFavorited = false, url = '';

	if(json.items !== undefined){
		json = json.items;
	}
	g_api.params.start += Object.keys(json).length;
	for(var data of json){
		c++;
		// if(c > 3) break;
		if(data.publishDate === undefined) data.publishDate = data.createDate;
		delete(data.favoritedTimes, data.defaultName, data.createDate, data.ratingScore, data.status, data.version);
		g_a_details_id["_"+data.id] = data;

		// 获取player地址
		$.ajax({
			url: g_api.api+'api.php?type=getPlayerURL&id='+data.id,
			dataType: 'json'
		})
		.done(function(detail) {
			card = $('.card[data-id="'+detail.song.id+'"]');
			if(card.length > 0 && g_a_details_id["_"+detail.song.id] != undefined){
				dom = card.find('.card-img-top');
				player = detail.playerHtml;
				url = cutString(player, 'src="', '"');
				if(player.toLocaleLowerCase().indexOf('</audio>') !== -1){
				  		player = '<video src="'+url+'" poster="'+getString([detail.thumbUrl, detail.song.thumbUrl], 'images/a.jpg')+'" preload="auto" controls autoplay></video>';	
				}
				card.find('.-btn_copyUrl').attr('data-clipboard-text', url);
				g_a_details_id["_"+detail.song.id].url = url;

				// TODO 视频
				if(card.hasClass('-video_playing')){ // 聚焦中
					player_apply(dom, player); // 直接应用
				}else{
					card.attr('data-html', player);
				}
			}
		})
		.fail(function() {
		})
		.always(function() {
		});

		// {"additionalNames":"","artistString":"Kaku S feat. 巡音ルカ V4X (Unknown)","createDate":"2020-10-19T07:03:23.363","defaultName":"retro future","defaultNameLanguage":"English","favoritedTimes":0,"id":299032,"lengthSeconds":314,"name":"retro future","publishDate":"2019-06-24T00:00:00Z","pvServices":"Piapro","ratingScore":0,"songType":"Original","status":"Finished","version":1}
// <img class="mw-100" src="./images/loading.gif" alt="`+data.artistString+`">
		html = html + data_parseData(data);
	}
	// totalCount
	$('#pills-'+type+' .-pv-list').append(html);
  }

  function data_parseData(data, url = ''){
	var	isFavorited = g_v_favorites["_"+data.id] !== undefined;
  	return `
		<div class="card mb-4" data-id="`+data.id+`" `+(url !== '' ? ' data-html="'+url+'"' : '')+`>
	<div  class="card-img-top">
  		
  </div>
  <div class="card-body">

    <div class="btn-group dropleft float-right" role="group">
  <button type="button" class="btn btn-secondary" onclick="add_favorite(`+data.id+`);">
<svg width="1em" height="1em" viewBox="0 0 16 16" class="bi bi-heart-fill -heart `+(isFavorited ? 'text-danger' : 'text-white-50')+`" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
  <path fill-rule="evenodd" d="M8 1.314C12.438-3.248 23.534 4.735 8 15-7.534 4.736 3.562-3.248 8 1.314z"/>
</svg>
 </button>
  <button type="button" class="btn btn-secondary"><img src="images/tag.svg"></button>

  <div class="btn-group" role="group">
    <button id="btnGroupDrop1" type="button" class="btn btn-secondary dropdown-toggle" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
    </button>
    <div class="dropdown-menu dropdown-menu-right dropdown-menu-lg-left" aria-labelledby="btnGroupDrop1">
      <a class="dropdown-item" href="javascript: downloadVideo('`+data.id+`')"><img src="./images/download.svg"><span>Download</span></a>
      <a class="dropdown-item" onclick="openInNew(`+data.id+`)"><img src="./images/house.svg"><span>Open in new</span></a>
      <a class="dropdown-item -btn_copyUrl" onclick="hsycms.tips('tips', 'copied!', function(){}, 2000)"><img src="./images/house.svg"><span>Copy URL</span></a>

    </div>
  </div>
</div>
    <h5 class="card-title">`+data.name+`</h5>
    <p class="card-text">
      <a class="badge badge-dark text-white">`+getTimeFormat(data.lengthSeconds)+`</a>
      <a class="badge badge-dark text-white">`+data.defaultNameLanguage+`</a>
      <a class="badge badge-dark text-white">`+data.songType+`</a>
      <a class="badge badge-dark text-white">`+data.artistString+`</a>
    </p>
    
    <button class="btn btn-light float-right" onclick="next_video();" ><img src="./images/arrow-down.svg"></button>
    <p class="card-text"><small class="text-muted">`+data.publishDate.replace('T', ' ').split(' ')[0]+`</small></p>
  </div>
</div>
		`;
  }

  function next_video(){
  	var playing = $('.-video_playing');
  	var next = playing.next();
  	if(next.length > 0){
  		g_b_loading = true; // 屏蔽事件
  		setPlaying(next);
  		animateCSS(playing, 'bounceOut',{

  			callback: function(){
  				setTimeout(function(){
  					g_b_loading = false;
	  				playing.show();

	  			}, 1000);
  			}
  		});
  	}
  }

  function openInNew(id){
  	var j = g_a_details_id["_"+id];
  	if(j.url !== undefined){
  		window.open(j.url, '_blank');
  	}
  }

  function player_apply(dom, html, id){
	removeIframe();

	if(html.indexOf('src=') === -1){ // 源地址
		if(html.substr(-4) == '.mp3'){ // 音频
			var j = g_v_favorites["_"+id] !== undefined ? g_v_favorites["_"+id] : g_a_details_id["_"+id];
			console.log(j);
			html = '<video src="'+html+'" poster="'+(j !== undefined ? j.thumbUrl : 'images/a.jpg')+'" preload="auto" controls autoplay></video>';	
		}else{
			html = "<iframe class='embed-responsive-item' src='"+html+"'></iframe>";
		}
	}else{
  		html = html.replace('src=', 'class="embed-responsive-item" src=');
	}

  	dom.html('<div class="embed-responsive embed-responsive-16by9">'+html+'</div>');
  	g_b_scrolld = true;
  	setTimeout(function(){
  	 if(g_b_scrolld){ //
  		scrollToCenter($('.-video_playing'));// 再次滚动,因为大小改变了
  	 }
  	}, 100);
  }

  function removeIframe(){
	$('iframe').each(function(i, d){
			$(d).parents('.card').attr('data-loaded', null); // 清除记录
			$(d).parents('.embed-responsive').remove(); // 移除
		});
  }

  function data_getParms(type){
  	var params;
  	switch(type){
  		case 'newst':
  			params = g_api.params;
  			break; 

  		case 'ranking':
  			params = g_api.params_ranking;
  			break;
	}
	let value, arr = [];
	for(let key in params){
		value = params[key];
		arr.push(key + '=' + value);
	}
  	return 'data='+utf8_to_b64(arr.join('&'));
  }
  function downloadVideo(id){
  	var html = $('.card[data-id='+id+']').attr('data-html');
	if(html !== undefined){
		var url = cutString(html, 'src="', '"');
		if(url !== ''){
			$.ajax({
				url: g_api.api+'getVideoUrl.php?dump=true&url='+utf8_to_b64(url)
			})
			.done(function(data) {
				window.open(data, "_blank");
			})
			.fail(function() {
				console.log("error");
			})
			.always(function() {
			});
		}
	}
  }

var g_b_loading = false;
function setLoading(b, title = 'cancel'){
     g_b_loading = b;
	if(b){
      hsycms.loading('loading',title);
  }else{
  	 hsycms.hideLoading('loading');
  }
}


function getDetail(id){
    if(g_a_details_id['_'+id] !== undefined) return g_a_details_id['_'+id];    
}
