var Microsoft = function(baseEngine) {
	
	var source = baseEngine.sourceDic,
		sourceSpeaking = source,
		target = baseEngine.targetDic,
		accessToken = null,		
		that = this;
	
	this.getAccessToken = function() {
		return accessToken;
	};
	
	this.setSourceSpeaking = function(srcLanguage) {
		sourceSpeaking = srcLanguage;
	};
	
	
	this.translateWord = function(word, callback) {
		that.translateSentence(word, callback);
	};
	
	this.translateSentence = function(text, callback) {
		var proxy = new ProxyCallback();
		var url = "http://api.microsofttranslator.com/V2/Ajax.svc/Translate?" +
			"appId=Bearer " + encodeURIComponent(this.accessToken) +
			"&from=" + encodeURIComponent(source) +
			"&to=" + encodeURIComponent(target) +
			"&text=" + encodeURIComponent(text) +
			'&oncomplete=ProxyCallback.instances[' + proxy.getId() + '].callback';
		
		//Configure a redirection proxy for the callback
		var trans = '';
		proxy.setRedirection(function(){
			trans = translation;
		});
		
		$.getScript(url, function() { 
			callback(trans);
		});
	};
	
	this.speakWord = function(word, callback) {
		that.speakSentence(word, callback);
	};
	
	this.speakSentence =  function(text, callback) {
		var proxy = new ProxyCallback();
		var format = "audio/mp3";
		var option = "MinSize";		
		var url = "http://api.microsofttranslator.com/V2/Ajax.svc/Speak?" + 
				'&oncomplete=ProxyCallback.instances[' + proxy.getId() + '].callback' + 
				"&appId=Bearer " + encodeURIComponent(accessToken) + 
				"&text=" + encodeURIComponent(text) + 
				"&language=" + encodeURIComponent(sourceSpeaking) + 
				"&format=" + encodeURIComponent(format) + 
				"&options=" + option;
		
		//Configure a redirection proxy for the callback
		proxy.setRedirection(function(audio) {
			$('#audioPlayer')
				.attr('src', audio)[0].play();
		});
		$.getScript(url);
	};
	
	
	this.init = function(successCallback) {
		var	postData = {
			grant_type : 'client_credentials',
			scope : 'http://api.microsofttranslator.com',
			client_id : '61793d78-d949-4cc2-9a36-04a349c15ef3',
			client_secret : '6JGrj+LMlU5ArRFAPrkSPyxp6IrbkBczZqtmOlEOQ2c='			
		};
		
		$.ajax({
			type: 'POST',
			url: 'https://datamarket.accesscontrol.windows.net/v2/OAuth2-13',
			data: postData,
			success: function(data) {
				accessToken = data.access_token;
				
				//Word speaking
				Core.addConfigOption('wordSpeakingEngine', 'Microsoft UK (synth)', function(){
					that.setSourceSpeaking("en-gb");
					that.speakWord.apply(that, arguments)
				});
				Core.addConfigOption('wordSpeakingEngine', 'Microsoft US (synth)', function(){
					that.setSourceSpeaking("en-us");
					that.speakWord.apply(that, arguments);
				});
				Core.addConfigOption('wordSpeakingEngine', 'Microsoft AU (synth)', function(){
					that.setSourceSpeaking("en-au");
					that.speakWord.apply(that, arguments);
				});						
				
				//Sentence Speaking
				Core.addConfigOption('sentenceSpeakingEngine', 'Microsoft UK (synth)', function(){
					that.setSourceSpeaking("en-gb");
					that.speakSentence.apply(that, arguments)
				});
				Core.addConfigOption('sentenceSpeakingEngine', 'Microsoft US (synth)', function(){
					that.setSourceSpeaking("en-us");
					that.speakSentence.apply(that, arguments);
				});
				Core.addConfigOption('sentenceSpeakingEngine', 'Microsoft AU (synth)', function(){
					that.setSourceSpeaking("en-au");
					that.speakSentence.apply(that, arguments);
				});				
				
				successCallback();
			}
		});
	};
	

};