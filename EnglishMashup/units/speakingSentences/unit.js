var unit = new function() {

	var inst = this,
		$booklets,
		baseURL = 'http://dl.dropbox.com/u/14871851/booklets',
		$table;
	
	var loadList = function(bookletId, listId) {
		var url = baseURL + '/' + bookletId + '/' + listId + '/trans.json';
		$.getJSON(url, function(data){
			$.each(data, function(idx){				
				$table.append([
					         '<tr>',
					         	'<td>', (idx+1), '</td>',
					         	'<td>', this.esp, '</td>',
					         	'<td class="entry">',
					         		'<i class="resolve icon-eye-open" data-id="', bookletId, '-', listId, '-', idx*2 + 1 ,'"></i><input type="text"/>', 
					         		'<div>', this.ing, '</div>', 
					         	'</td>',
					         '</tr>'
					 ].join(''));
			});
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
		});
		*/
		$table = $("#wordsContainer");
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
};


(function(){
	$.get('units/speakingSentences/markup.html?' + (new Date()).getTime(), function(data){
		$('#unitContainer').html(data);
		unit.start();
		
		$('#wordsContainer').on('click', 'i.resolve', function(e){
			console.log(e);
			var $el = $(e.target);
			console.log($el);
			var id = $el.attr('data-id');
			
			unit.playSound(id);
		});		
		
	});
})();

