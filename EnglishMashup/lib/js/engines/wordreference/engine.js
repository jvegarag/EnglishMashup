var WordReference = function(baseEngine) {

	var apiKey = '8d994',
		instance = this,
		otherTranslations = ['SecondTranslation', 'ThirdTranslation'],
		pageUrl = 'http://www.wordreference.com/es/translation.asp',
		enBaseUrl = 'http://www.wordreference.com/audio/en/uk/ogg/',
		usBaseUrl = 'http://www.wordreference.com/audio/en/us/';
	
	var getBaseUrl = function() {
		var source = baseEngine.sourceDic,
			target = baseEngine.targetDic;
		return 'http://api.wordreference.com/'+ apiKey +'/json/' + 
					source + target;
	};
	
	this.translateWord = function(word, callback) {
		var url = getBaseUrl() + "/" + word; 
		$.getJSON(url, function(data){
			console.log('Raw data', data);
			var markup = [
			       '<div id="wrCarousel" class="carousel slide" data-interval="false">',
			       	    '<div class="carousel-inner scroll-pane">',
			       	    	'<div class="active item">',
			      	  	  		'<table class="wr result table table-bordered table-striped">',
			      	  	  			'<caption>Principal Translations</caption>',
			      	  	  			'<tr><th>English</th><th>Spanish</th></tr>',
			      	  	  				'<tbody>', getPrincipalTranslationsMarkup(data), '</tbody>',
			      	  	  		'</table>',
		      	  	  		'</div>',
		      	  	  	    '<div class="item">',
		      	  	  			'<table class="wr result table table-bordered table-striped">',
		      	  	  			'<caption>Additional Translations</caption>',
		      	  	  				'<tr><th>English</th><th>Spanish</th></tr>',
		      	  	  					'<tbody>', getAdditionalTranslationsMarkup(data), '<tbody>',
		      	  	  			'</table>',
		      	  	  	    '</div>',
		      	  	  	    '<div class="item">',
	      	  	  			'<table class="wr result table table-bordered table-striped">',
	      	  	  			'<caption>Compounds</caption>',
	      	  	  				'<tr><th>English</th><th>Spanish</th></tr>',
	      	  	  					'<tbody>', getCompoundsMarkup(data['original']), '<tbody>',
	      	  	  			'</table>',
	      	  	  	    '</div>',
	      	  	  	    '</div>',
	      	  	  	    '<a class="carousel-control left" href="#wrCarousel" data-slide="prev">&lsaquo;</a>',
	      	  	  	    '<a class="carousel-control right" href="#wrCarousel" data-slide="next">&rsaquo;</a>',
		      	   '</div>'
			      ].join('');
			callback(markup);
		});
	};
	
	
	this.speakWordUk = function(word, callback) {
		var url = pageUrl + '?tranword=' + word;
		$.get(url, function(resp){
			var audioId = null;
			try {
				audioId = $(resp).find('#aud').val();
			} catch(e) { }
			finally {
				var url = enBaseUrl + audioId + '-2.ogg';
				$('#audioPlayer')
					.attr('src', url)[0].play();
			}
			callback && callback();
		});	
	};
	
	this.speakWordUs = function(word, callback) {
		var url = pageUrl + '?tranword=' + word;
		$.get(url, function(resp){
			var audioId = null;
			try {
				audioId = $(resp).find('#aud').val();
			} catch(e) { }
			finally {
				var url = usBaseUrl + audioId + '-1.mp3';
				$('#audioPlayer')
					.attr('src', url)[0].play();
			}
			callback && callback();
		});
	};	
	
	
	var getTermMarkup = function(term, language) {
		if (language == 'en') {
			return [
			        '<i class="term">', Utils.speakableMarkup( term['term'] ), '</i>',
			        '<i class="pos">', term['POS'], '</i>',
			        '<i class="sense">', term['sense']?'('+ Utils.speakableMarkup( term['sense'] )+')':'', '</i>',
			        '<i class="usage">',  term['usage'], '</i>'
			].join('');
		}
		else {	
			return [
			        '<i class="term">', term['term'], '</i>',
			        '<i class="pos">', term['POS'], '</i>',
			        '<i class="sense">', term['sense']?'('+term['sense']+')':'', '</i>',
			        '<i class="usage">',  term['usage'], '</i>'
			].join('');
		}
	};
	
	var getEntryMarkup = function(entry) {
		var markup = [
		    '<tr>',
			    '<td>',
			    	getTermMarkup(entry['OriginalTerm'], baseEngine.sourceDic),
			    '</td>',
			    '<td>',
			    	getTermMarkup(entry['FirstTranslation'], baseEngine.targetDic),
			    '</td>',
			'</tr>'
		];
		
		$.each(otherTranslations, function(idx){
			var key = this;
			if (entry[key]) {
				markup.push('<tr>');
				markup.push('<td>&nbsp;</td> <td>' + getTermMarkup( entry[key] ) + '</td>');
				markup.push('</tr>');
			}
		});
		
		return markup.join('');        
	};
	
	var getPrincipalTranslationsMarkup = function(data) {
		var markup = []
		for(var i=0; i<3; i++) {
			var section = data['term' + i];
			if (section) {
				var mainTranslations = section['Entries']? section['Entries']: section['PrincipalTranslations'];
				if (mainTranslations) {
					$.each(mainTranslations, function(key, value){
						markup.push( getEntryMarkup(value) );
					});
				}
			}
		}
		return markup.join('');
	};
	
	var getAdditionalTranslationsMarkup = function(data) {
		var markup = [];
		for(var i=0; i<3; i++) {
			var section = data['term' + i];
			if (section) {
				var mainTranslations = section['Entries']? section['Entries']: section['AdditionalTranslations'];
				if (mainTranslations) {
					$.each(mainTranslations, function(key, value){
						markup.push( getEntryMarkup(value) );
					});
				}
			}
		}
		return markup.join('');			
	};
	
	var getCompoundsMarkup = function(section) {
		var markup = [];
		if (section) {
			var mainTranslations = section['Entries']? section['Entries']: section['Compounds'];
			$.each(mainTranslations, function(key, value){
				markup.push( getEntryMarkup(value) );
			});
		}
		return markup.join('');	
	};
	
	this.theasaurus = function() {
		
	};
	
	this.monolingual = function() {
		
	};
	
	
	this.init = function(callback) {
		Core.addConfigOption('wordSpeakingEngine', 'Wordreference UK', this.speakWordUk);
		Core.addConfigOption('wordSpeakingEngine', 'Wordreference US', this.speakWordUs);
	};
	
};

