var unit = new function() {

	var inst = this,
		baseURL = 'http://dl.dropbox.com/u/14871851/booklets',
		sentences = [],
		$cont;
	
	var loadList = function(bookletId, listId) {
		var url = baseURL + '/' + bookletId + '/' + listId + '/trans.json';
		$.getJSON(url, function(data){
			$.each(data, function(idx){
				var id = bookletId + '-' + listId + '-' + idx*2;
				this['id'] = id;
				sentences.push(this);
			});
			inst.displayRandom();
		});
	};
	
	this.start = function() {
		/*
		$.getJSON('units/speakingSentences/data/booklets.json', function(data){
			$booklets = $("#booklets");
			$booklets.append('<ul>');
			$.each(data, function(){
				$booklets.append("<li>" + this.id + " " + this.label + "</li>");
			});
			$booklets.append('</ul>');			
			
		}).error(function(e){
			console.error(e);
		});*/
		$cont = $('#sentencesContainer');
		loadList('TB1', 'L1');
	};
	
	this.getUrl = function(itemId) {
		var tok = itemId.split('-'),
			soundId = tok[2].length == 1? '0'+tok[2]: tok[2];
		return baseURL + '/' + tok[0] + '/' + tok[1] + '/' + soundId + '.mp3';
	};
	
	this.playSound = function(itemId) {
		Utils.play( inst.getUrl(itemId) );
	};

	var display = function(sent) {		
		$cont.html('<h2>' + sent.esp + '</h2>');
		inst.playSound(sent.id);
	};
	
	this.displayRandom = function() {
		var idx = parseInt(Math.random()*sentences.length),
			s = sentences[idx];
		display(s);
	};
};


(function(){
	$.get('units/randomSentences/markup.html?' + (new Date()).getTime(), function(data){
		$('#unitContainer').html(data);
		unit.start();
	});
})();

