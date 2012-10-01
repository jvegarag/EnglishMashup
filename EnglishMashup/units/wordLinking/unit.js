var unit = new function() {
	
	var instance = this;
	
	this.start = function() {
		
	};
};
		
(function(){
	$.get('units/wordLinking/markup.html', function(data){
		$('#unitContainer').html(data);
		unit.start();
	});
		
})();