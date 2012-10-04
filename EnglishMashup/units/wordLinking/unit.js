var unit = new function() {
	
	
	var getEntries = function(total) {
		var entries = [], usedPos = [], 
			ds = EnglishEngine.datasources['position'],
			dsLength = EnglishEngine.datasources.length;
		
		while(entries.length<total) {
			var pos;
			do {
				pos = parseInt(Math.random() * dsLength);
			} while(usedPos.indexOf(pos)>=0);
			
			usedPos.push(pos);
			var entry = ds[pos],
				flags = entry['flags'].split(/,\s?/);
			if (flags.indexOf('Vocabulary')>=0) {
				entries.push(ds[pos]);
			}
		}
		return entries;
	};
	
	
	var T = function(array) {
		var v = [];
		var l = array.length;
		for(var i=0; i<l; i++) {
			var el = array[i];
			v.push(el.join(','));
		}
		return v.join(' ');
	};
	
	var moveTo = function($circle, $line, x, y, xIni, yIni) {
		
		$circle.transform("T" + (x - xIni) + "," + (y - yIni));
		
		var offsetY = y - yIni,
			offsetX = x - xIni;
		var m = -1;
		if (y > yIni) m = 1; 
		var trans = T([
			           	['M', xIni, yIni],
			           	['q', offsetX/15.0, -m*y/7.0, offsetX/2, offsetY/2],
			            ['T', x, y]
			        ]);
		           	
		$line.attr('path', trans);		
	};
	
	var isAround = function(xOrg, yOrg, x, y, t) {
		return (x > xOrg - t && x < xOrg + t && y > yOrg - t && y < yOrg + t);
	};
	
	this.start = function() {
		var circleWidth = 6, hDelta = 60, xDelta = 500, totalWords = 7, matches = [], espTextNodes = [];
		
		var p = Raphael("svg-canvas", 800, 500);
		
		var entries = getEntries(totalWords),
			engEntries = [], espEntries = [];
		$.each(entries, function(){
			engEntries.push(this['englishentry']);
			espEntries.push(this['spanishentry']);
		});
		//Out of order
		espEntries.sort();
		
		var colours = ['#C84D5F', '#7DC24B', '#EC633F', '#A0D8F1', '#DDC23F', '#0A224E', '#816A4A'];
		
		var onMove = function(dx, dy, x, y, mE){
			var xIni = this.data('xIni'),
				yIni = this.data('yIni');
		
			if (mE.offsetX > 750 || mE.offsetX < 20) return;
			
			var $line = this.data('relatedLine'); 
			moveTo(this, $line, mE.offsetX, mE.offsetY, xIni, yIni);
			
			var xEnd = xIni + xDelta;
			for(var i=0; i<totalWords; i++) {
				var yEnd = hDelta*(i+1);
				if (isAround(xEnd, yEnd, mE.offsetX, mE.offsetY, 20)) {
					moveTo(this, $line, xEnd, yEnd, xIni, yIni);
					break;
				}
			}
		};
		
		var onStart = function(x, y){
		 	this.attr('fill-opacity', .5);
		 	var $line = this.data('relatedLine'); 
		 	$line.attr('stroke-opacity', .5);
		};
		
		var onEnd = function(mE){
			var xIni = this.data('xIni'),
				yIni = this.data('yIni'),
				pos = this.data('pos'),			
				$line = this.data('relatedLine'),
				xEnd = xIni + xDelta,
				around = false;
			
			for(var i=0; i<totalWords; i++) {
				var yEnd = hDelta*(i+1);
				if (isAround(xEnd, yEnd, mE.offsetX, mE.offsetY, 20)) {
					around = true;
					this.toFront();
					Core.sBox.speakWord(engEntries[pos]);
					
					//Check if matches
					var entry = this.data('entry');
					matches[i] = entry['spanishentry'] == espEntries[i];
					break;
				}
			}
			
			if (!around) {
				moveTo(this, $line, xIni, yIni*(pos+1), xIni, yIni*(pos+1));
			}
			
			this.attr('fill-opacity', 1);
			$line.attr('stroke-opacity', 1);
		};
		
		
		for(var i=0; i<totalWords; i++) {
			
			var xIni = 120, yIni = hDelta*(i+1);
			
			p.text(xIni-10, yIni, engEntries[i])
				.transform('S1.5')
				.attr('text-anchor', 'end')
				.attr('cursor', 'hand')
				.data('word', engEntries[i])
				.click(function(){
					Core.sBox.speakWord(this.data('word'));
				})
				.mouseover(function(){ this.attr('fill', 'blue'); })
				.mouseout(function(){ this.attr('fill', 'black'); });
			
			//Create the initial fixed circle
			p.circle(xIni, yIni, circleWidth)
				.attr('stroke', 'transparent')
				.attr('fill', colours[i]);
			
			var $circle = p.circle(xIni, yIni, circleWidth)
							.attr('cursor', 'hand')
							.attr('stroke', 'transparent')
							.attr('fill', colours[i])
							.data('entry', entries[i]);
			
			$circle.drag(onMove, onStart, onEnd);
			
			var $line = p.path( T( [ ['M', xIni, yIni], ['l', 0, 0] ]) )
				.attr('stroke-width', 2)
				.attr('stroke', colours[i])
				.attr('stroke-linecap', 'round');
			
			$circle.data('relatedLine', $line)
				.data('xIni', xIni)
				.data('yIni', yIni)
				.data('pos', i);
			
			//Spanish circle
			p.circle(xIni + xDelta, yIni, circleWidth)
				//.attr('stroke', 'transparent')
				.attr('fill', 'white')
				.attr('opacity', 0.5)
				.data('entry', espEntries[i]);
			
			//Spanish text
			var $text = p.text(xIni + xDelta + 10, yIni, espEntries[i])
							.transform('S1.5')
							.attr('text-anchor', 'start');
			espTextNodes.push($text);
		}
		
		$('#solveBtn')
			.click(function(){
				for(var i=0; i<espTextNodes.length; i++) {
					var $txtNode = espTextNodes[i];
					if (matches[i] === true) {
						$txtNode.attr('fill', 'green');
					}
					else {
						$txtNode.attr('fill', 'red');
					}
				}
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