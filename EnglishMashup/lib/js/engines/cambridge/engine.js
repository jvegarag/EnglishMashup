var Cambridge = function(baseEngine) {
	
	var dictionariesUrl = 'https://dictionary.cambridge.org/api/v1/dictionaries',
		//translationUrl = 'https://dictionary.cambridge.org/api/v1/dictionaries/{dictCode}/search',
		 translationUrl = 'https://dictionary.cambridge.org/api/v1/dictionaries/{dictCode}/entries/{entryId}',
		apiKey = 'gGRmbTlFxdWk7H6oDxy8byQzJDYhhIyvNhTXHsFou2R8Y9WaL9kBH0UXtoULr1VV',
		//currentDictionary = 'british';
		currentDictionary = 'english-spanish';
	
	this.getDictionaries = function() {
		$.ajax({ 
			url: dictionariesUrl, 
			headers: {accessKey: apiKey},
			success : function(data){
				console.log(data);
			}
		});
	};
	
	this.translateWord = function(word, callback) {
		var searchUrl = (translationUrl + '?q=' + word)
							.replace('{dictCode}', currentDictionary)
							.replace('{entryId}', 'house_1');
		$.ajax({
			url: searchUrl, 
			headers: {accessKey: apiKey},
			success : function(data){
				$('body').append(data.entryContent);
			}
		});
	};
	
};