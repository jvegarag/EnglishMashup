var Utils = {
	
	speakableMarkup : function(text) {
		var tokens = text.split(' '), markup = [];
		$.each(tokens, function(idx){
			markup.push('<span>' + this + '</span>');
		});
		return markup.join('&nbsp;');
	},
	
	toSpeakableText : function(container, text) {
		var speakableMarkup = this.speakableMarkup(text);
		var $cont = $(container);				
		$cont.append( speakableMarkup );
		$cont.find('span').each(function(){
			var $this = $(this),
				word = $this.text();
			$this.popover({
				'html' : true,
				'trigger' : 'hover',
				'delay' : 500,
				'placement' : 'bottom',
				'title': word + ' (<i>phonetic</i>) - click for speak',
				'content' : 'Translating...',						
			}).bind('show', function(event) {					
				msEngine.translate(word, function(translation){
					$('.popover-content:first').html(translation);
				});
				EnglishEngine.phonetic(word, function(transcription){
					$('.popover-title:first > i').html(transcription);
				});
			});
		});
	},
	
	addEntryToDS : function(datasource, key, entryObj) {
		datasource[key] = entryObj;
	}
};

/** Redirect proxy for JSONP calls **/			
var proxyCallback = {				
	callback : function() {
		if (typeof this.redirect === 'function') {
			this.redirect.apply(this.redirect, arguments);
			this.redirect = null;
		}
		else {
			alert('Redirect proxy not defined');
		}
	},
	redirect :  null
};

var EnglishEngine = function(conf){
			
	this.translate = function(text, callback) {
		conf.translate(text, callback);
	};
	
	this.speak = function(text) {
		conf.speak(text);
	};

	conf.initEngine();
};

/** Static functions **/
EnglishEngine.retrieveData = function() {
	var googleSpreadsheetKey = '0AplTiHy702EOdEV5aDRzYXZ3N2pfZlNxOTNEdDNfaHc';			
	var url = 'https://spreadsheets.google.com/feeds/list/' + 
			  googleSpreadsheetKey + 
			  '/od6/public/values?alt=json-in-script&callback=proxyCallback.callback';
	
	
	//Configure a redirect callback
	proxyCallback.redirect = function(jsonSpreadsheet) {
		var entries = jsonSpreadsheet.feed || [];
		console.log(entries);
		EnglishEngine.datasources = {
			'length' : 0,
			'position' : {},
			'spanish' : {},
			'english' : {}
		};
		$.each(entries.entry, function(idx) {
			var entry = this;
			var entryObj = {
					'flags' : entry['gsx$flags']['$t'],
					'englishentry' : entry['gsx$englishentry']['$t'],
					'spanishentry' : entry['gsx$spanishentry']['$t']
				};
			Utils.addEntryToDS(EnglishEngine.datasources['position'], idx, entryObj);
			Utils.addEntryToDS(EnglishEngine.datasources['english'], entry['gsx$englishentry']['$t'], entryObj);
			Utils.addEntryToDS(EnglishEngine.datasources['spanish'], entry['gsx$englishentry']['$t'], entryObj);
			EnglishEngine.datasources.length = idx+1;
		});
		console.log('Data retrieved');				
	};
	
	console.log('Retrieving data from google spreadshets...');
	$.getScript(url);
};

EnglishEngine.speakWord = function(word) {
	var howjsayUrl = 'http://howjsay.com/mp3/' + encodeURIComponent(word.toLowerCase()) + '.mp3?' + (new Date().getTime());
	$('#audioPlayer')
		.attr('src', howjsayUrl)[0].play();
};

EnglishEngine.phonetic = function(text, callback) {
	var data = {
		'intext': text,
		'ipa': 0,
		'stress': 'on'
	};
	$.ajax({
		type: 'POST',
		url: 'http://upodn.com/phon.php',
		data: data,
		success: function(html) {	
			var el = $(html).find('font')[3];
			var transcription = $(el).text().trim();
			callback(transcription);
		}
	});
};


var init = function() {
	
	EnglishEngine.retrieveData();
	
	var msEngine = new EnglishEngine({
		fromLang : 'en',
		toLang : 'es',
		initEngine : function() {
			var that = this;
			var	data = {
				grant_type : 'client_credentials',
				scope : 'http://api.microsofttranslator.com',
				client_id : '61793d78-d949-4cc2-9a36-04a349c15ef3',
				client_secret : '6JGrj+LMlU5ArRFAPrkSPyxp6IrbkBczZqtmOlEOQ2c='			
			};
			
			$.ajax({
				type: 'POST',
				url: 'https://datamarket.accesscontrol.windows.net/v2/OAuth2-13',
				data: data,
				success: function(data) {
					that.accessToken = data.access_token;
				}
			});
		},
		translate : function(text, callback) {
			var url = "http://api.microsofttranslator.com/V2/Ajax.svc/Translate?" +
				"appId=Bearer " + encodeURIComponent(this.accessToken) +
				"&from=" + encodeURIComponent(this.fromLang) +
				"&to=" + encodeURIComponent(this.toLang) +
				"&text=" + encodeURIComponent(text) +
				"&oncomplete=proxyCallback.callback";
			//Configure a redirection proxy for the callback
			var trans = '';
			proxyCallback.redirect = function(translation) {
				trans = translation;
			};
			$.getScript(url, function() { 
				callback(trans);
			});
		},
		
		speak : function(text) {
			var format = "audio/mp3";
			var option = "MinSize";		
			var url = "http://api.microsofttranslator.com/V2/Ajax.svc/Speak?" + 
					"oncomplete=" + 'proxyCallback.callback' + 
					"&appId=Bearer " + encodeURIComponent(this.accessToken) + 
					"&text=" + encodeURIComponent(text) + 
					"&language=" + encodeURIComponent(this.fromLang) + 
					"&format=" + encodeURIComponent(format) + 
					"&options=" + option;
					
			//Configure a redirection proxy for the callback
			proxyCallback.redirect = function(audio) {
				$('#audioPlayer')
					.attr('src', audio)[0].play();
			};
			$.getScript(url);
		},
		
		accessToken : null
	});			
	
	$(document)
		.on('click', '.speak > span', function(event){
			var $this = $(this);						
			EnglishEngine.speakWord($this.text());					
			event.stopPropagation();
		})
//			.on('hover', 'span', function(event){
//				console.log(this);
//			})				
		.on('click', '.speak', function(){
			msEngine.speak($(this).text());
		});

};

