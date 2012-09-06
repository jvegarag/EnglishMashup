var unit = new function() {
	
	var instance = this,
		$wordsContainer = null;
	
	var addEntry = function(eng, spa) {
		var markup = [
		      '<tr>',
		      	 '<td class="speak">', Utils.speakableMarkup(eng), '</td>', '<td>', spa ,'</td>',
		      '</tr>'
		].join('');
		$wordsContainer.append(markup);
	};
	
	this.start = function() {
		$wordsContainer = $('#wordsContainer');
		
		var enDS = EnglishEngine.datasources.english;
		$.each(enDS, function(key, value){
			addEntry(key, value['spanishentry']);
		});
		
	};
};
		

(function(){
		
	$.get('units/vocabulary/markup.html?' + (new Date()).getTime(), function(data){
		$('#unitContainer').html(data);
		unit.start();
	});
		
})();