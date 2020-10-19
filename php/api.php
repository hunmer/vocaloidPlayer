<?php
	header("Access-Control-Allow-Origin: *");
	
	/*$_GET = [
		'type' => 'newst',
		'data' => 'start=0&getTotalCount=true&maxResults=10&query=&fields=AdditionalNames%2CThumbUrl&lang=Default&nameMatchMode=Auto&sort=AdditionDate&songTypes=&childTags=false&artistParticipationStatus=Everything&releaseEventId=&onlyWithPvs=true&pvServices=&since=&userCollectionId=&status='
	];*/
	// $_GET = [
	// 	'type' => 'getPlayerURL',
	// 	'id' => '299028'
	// ];	
	$_GET['data'] = base64_decode(str_replace(' ', '+', $_GET['data']));
	$_GET['test'] = 0;
	
	switch ($_GET['type']) {
		case 'newst':
			$_GET['cache'] = './cache/'.$_GET['type'].'.json';
			if($_GET['test'] && file_exists($_GET['cache'])) exit(file_get_contents($_GET['cache']));
			$url = 'https://vocadb.net/api/songs?'.$_GET['data'];
			break;

		case 'getPlayerURL':
			$_GET['cache'] = './cache/'.$_GET['id'].'.json';
			if($_GET['test'] && file_exists($_GET['cache'])) exit(file_get_contents($_GET['cache']));
			$url = 'https://vocadb.net/Song/PVPlayerWithRating?songId='.$_GET['id'];
			break;
			
		default:
			exit();
	}
	$ch = curl_init();
	$options =  array(
		CURLOPT_HEADER => false,
		// CURLOPT_POST => 1,
		CURLOPT_URL => $url,
		//CURLOPT_POSTFIELDS => http_build_query(json_decode($_GET['data'], 1)),
		CURLOPT_RETURNTRANSFER => true,
		CURLOPT_TIMEOUT => 10,
		CURLOPT_PROXYAUTH => CURLAUTH_BASIC,
		CURLOPT_HTTPHEADER => array(
			'X-FORWARDED-FOR:'.Rand_IP(),
			'CLIENT-IP:'.Rand_IP(),
			'Content-Type' => 'application/json;charset=UTF-8',
			'Origin' => 'https://vocadb.net',
			'Referer' => 'https://vocadb.net/Search?',
			'User-Agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/86.0.4240.75 Safari/537.36 Edg/86.0.622.38'
		),
		CURLOPT_SSL_VERIFYPEER => false,
		CURLOPT_SSL_VERIFYHOST => false,
	);
	//if($_GET['proxy']){
		$options[CURLOPT_PROXY] = "127.0.0.1";
		$options[CURLOPT_PROXYPORT] = 1080;
	//}
	curl_setopt_array($ch, $options);
	$content = curl_exec($ch);
	curl_close($ch);
	//var_dump($content); exit();
	if($_GET['test']){
		if(!is_dir('./cache/')) @mkdir('./cache/', 0777);
		file_put_contents($_GET['cache'], $content);		
	}
	
	exit($content);

function Rand_IP(){
	srand(microtime(true));
    return round(rand(600000, 2550000) / 10000).".".round(rand(600000, 2550000) / 10000).".".round(rand(600000, 2550000) / 10000).".".round(rand(600000, 2550000) / 10000);
}