var unit = new function() {
	
	var instance = this;
	
	this.start = function() {
		var p = Raphael("svg-canvas", '100%', 400);
		var $line = p.path('M50,50l0,0');
		var $circle = p.circle(50, 50, 8)
						.attr('cursor', 'hand')
						.attr('stroke', 'transparent')
						.attr('fill', '#385')
						.drag(function(dx, dy, x, y, mE){
							console.log(dx, dy, x, y);
							this.transform(this.data("oldt") + "T" + dx + "," + dy);
							var fX = 50+dx, fY = 50+dy, m
							$line.attr('path', 'M50,50 q300,300 500,150	T' + (50+dx) + ',' + (50+dy));
							//$line.attr('path', 'M50,50c20,30 50,20 ' + );
							this.data("move", "T" + dx + "," + dy);
						}, function(x, y){
						 	this.data("oldt", this.transform());
						 	this.attr('fill-opacity', .5);
						}, function(mE){
							console.log('end event at ', mE);	
							//$line.remove();
							//$line = p.path('M50,50L' + mE.offsetX + ',' + mE.offsetY);
							this.attr('fill', '#385');
							this.attr('fill-opacity', 1);
						});
		
		
	};
};
		
(function(){
	
	//Resource loading
	$.get('units/wordLinking/markup.html?nc=' + new Date().getTime(), function(data){
		$('#unitContainer').html(data);
		
		yepnope({ 
			load : 'resources/svg/raphael-min.js',
			complete : function() {
				console.log('All loaded');
				unit.start();
			}
		});	
	});
	
})();