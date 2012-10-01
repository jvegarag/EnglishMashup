var undef = function(message) { alert(message); };

var Core = {
	
	tm : null,
	
	loadEngine : function(name, callback) {
		var baseUrl = 'lib/js/engines/' + name + '/';
		yepnope({ 
			load : [baseUrl + 'engine.js', baseUrl + 'engine.css'],
			callback : function(url, result, key) {},
			complete : function() {
				callback && callback();
			},
			error : function() {
				alert('Error loading engine ' + name);
			}
		});
	},
	
	loadUnit : function(name, displayName) {
		$('#unitContainer').html('');
		
		Core.tm.startTask({
			name : displayName,
			exec : function(){
				var that = this;
				yepnope({ 
					load : 'units/' + name + '/unit.js?' + (new Date().getTime()),
					callback : function(url, result, key) {},
					complete: function() {
						Core.tm.endTask(that.taskId);
					},
					error : function() {
						alert('Error loading unit ' + name);
					}
				});
			}
		});		
		

	},
	
	loadApplication : function() {
		//Instantiates a task manager
		var tm = Core.tm = new TaskManager();
		
		//Batch for loading all engines and data
		var taskBatch = {
			batchedTasks : [],
			finishedTasks : [],
			tasks : [
				{
					name : 'Google spreadsheet',
					exec : function(){
						var taskObject = this;
						EnglishEngine.retrieveData(function(){
							taskBatch.endTask(taskObject);
						});
					}
				},
				{
					name : 'Wordreference',
					exec : function(){
						var taskObject = this;
						Core.loadEngine('wordreference', function(){
							Engines['Wordreference'] = new WordReference(englishEngine);
							Engines['Wordreference'].init();
							taskBatch.endTask(taskObject);
						});
					}
				},
				{
					name : 'Microsoft Translator',
					exec : function(){
						var taskObject = this;
						Core.loadEngine('microsoft', function(){
							Engines['Microsoft'] = new Microsoft(englishEngine);
							Engines['Microsoft'].init(function(){
								taskBatch.endTask(taskObject);
							});
						});
					}
				},
				{
					name : 'Audio player',
					exec : function(){
						var taskObject = this;
						Core.loadAudioPlayer(function(){
							taskBatch.endTask(taskObject);
						});
					}
				}
			],
			startTask : function(taskObject) {
				taskBatch.batchedTasks.push(taskObject.taskId);
			},
			endTask : function(taskObject) {
				tm.pauseTask(taskObject.taskId);
				taskBatch.finishedTasks.push(taskObject.taskId);
				var index = taskBatch.batchedTasks.indexOf(taskObject.taskId);
				taskBatch.batchedTasks.splice(index, 1);
				(taskBatch.batchedTasks.length == 0) && taskBatch.endBatch();
			},
			endBatch : function() {
				window.setTimeout(function(){
					$.each(taskBatch.finishedTasks, function(){
						tm.endTask(this);
					});
				}, 500);
				
				Core.loadUnit('vocabulary', 'Vocabulary List');
			}
		};
		
		tm.startBatch(taskBatch);
		tm.showLoading();
	},
	
	loadAudioPlayer : function(callback) {
		yepnope([
		     { load : 'resources/music-player/jquery-jplayer/jquery.jplayer.js' },
		     { load : 'resources/music-player/ttw-music-player-min.js' },
		     { load : 'resources/music-player/css/style.css',
		       callback : function(url, result, key) {
		    	   console.log(url, result, key);
		    	   callback();
		       }
		     }
		]);
	},
	
	sBox : new function() {
		
		var currentPos = -1,
			historical = [],
			that = this;
		
		var addSearch = function(word) {
			historical.push(word);
			currentPos++;
		};
		
		this.log = function() {
			console.log( historical, currentPos);
		};
		
		this.prev = function() {
			if (currentPos-1 >= 0) {
				that.searchWord(historical[--currentPos], true);
			}
		};
		
		this.next = function() {
			if (currentPos+1 < historical.length) {
				that.searchWord(historical[++currentPos], true);
			}
		};
		
		//TODO sacar esto de aqui
		this.searchWord = function(word, historical) {
			$('#searchField').val(word);
			Engines['Wordreference'].translateWord(word, function(result){
				$('#wr-search').html( result );
			});
			
			!historical && addSearch(word);
		};
		
		this.speakWord = function(word) {
			Core.wordSpeakingEngine(word);
		};
		
		this.speakSentence = function(text) {
			Core.sentenceSpeakingEngine(text);
		};
	},
	
	/** Sentence Speaking Engine **/
	sentenceSpeakingEngine : undef,
	
	/** Word Speaking Engine **/
	wordSpeakingEngine : undef,
	
	setEngine : function(engine, selectedEngine) {
		Core[engine] = selectedEngine;
	},
	
	addConfigOption : function(engine, name, callback) {
		var item = 
			[ '<li class="option">',
		  		'<a href="javascript:void(0)">', name ,'</a>',
		  	  '</li>'
		  	].join('');
		
		$(item)
			.appendTo('#' + engine)
			.find('a')
			.click(function(){
				Core.setEngine(engine, callback);
			});
	}
	
};


var TaskManager = function() {
	
	var $loadingLayer = $('#loadingLayer').modal('hide'),
		$tasksContainer = $('#taskContainer'),
		taskClasses = [ 'progress-info', 'progress-warning', 'progress-success', 'progress-danger' ],
		activeTasks = [],
		taskPrefix = 'task_',
		instance = this;
	
	this.showLoading = function() {
		$loadingLayer.modal('show');
	};
	
	this.hideLoading = function() {
		$loadingLayer.modal('hide');
	};
	
	var getTaskId = function() {
		return activeTasks.length;
	};
	
	var findTaskIndex = function(taskId) {
		var index = -1;
		$.each(activeTasks, function(idx){
			if (this.taskId == taskId) {
				index = idx;
				return false;
			}
		});
		return index;
	};
	
	var getTaskMarkup = function(taskId, taskName, progress) {
		var taskClass = taskClasses[activeTasks.length % taskClasses.length];
		return [
	        '<div class="row-fluid" id="' + taskPrefix + taskId +'">',
				'<div class="span4">' + taskName + '</div>',
				'<div class="span8">',
					'<div class="progress ' + taskClass + ' progress-striped active"> <div class="bar" style="width:' + progress + '%;"></div> </div>',
				'</div>',
			'</div>'
		].join('');
	};
	
	this.endTask = function(taskId) {
		$tasksContainer.find('#' + taskPrefix + taskId).fadeOut(function(){
			$(this).remove();
			var index = findTaskIndex(taskId);
			activeTasks.splice(index, 1);
			if (activeTasks.length == 0) {
				instance.hideLoading();
			}
		});
	};
	
	this.pauseTask = function(taskId) {
		$('#' + taskPrefix + taskId).find('div.progress').removeClass('progress-striped');
	};
	
	this.activateTask = function(taskId) {
		$('#' + taskPrefix + taskId).find('div.progress').addClass('progress-striped');
	};
	
	this.startTask = function(options) {
		var taskId = getTaskId();
		options['taskId'] = taskId;
		activeTasks.push(options);
		var taskMarkup = getTaskMarkup(taskId, options.name, 100);
		$(taskMarkup).appendTo($tasksContainer);
		options.exec.apply(options, options.arguments);
		return taskId;
	};
	
	this.startBatch = function(options) {
		$.each(options.tasks, function(idx){
			instance.startTask(this);
			options.startTask && options.startTask(this);
		});
	};
	
};


var Utils = {
	
	speakableMarkup : function(text) {
		
		return text.replace(/[^\W]+/mig, '<span class="sp">$&</span>');
		
//		var tokens = text.split(/[\W]/mig), markup = [];
//		$.each(tokens, function(idx){
//			markup.push('<span>' + this + '</span>');
//		});
//		return markup.join('&nbsp;');
	},
	
	toSpeakableText : function(container, text) {
		var speakableMarkup = this.speakableMarkup(text);
		var $cont = $(container);				
		$cont.append( speakableMarkup );
		/*
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
		});*/
	},
	
	addEntryToDS : function(datasource, key, entryObj) {
		datasource[key] = entryObj;
	}
};

/** Redirect proxy for JSONP calls **/
var ProxyCallback = function() {	
	var redirect =  null,
		instance = this,
		id = ProxyCallback.instances.length;
	
	ProxyCallback.instances[id] = instance;	
	
	this.callback = function() {
		if (typeof instance.redirect === 'function') {
			instance.redirect.apply(instance.redirect, arguments);
		}
		else {
			alert('Redirect proxy not defined');
		}
	};
	
	this.getId = function() {
		return id;
	};
	
	this.setRedirection = function(redirect) {
		instance.redirect = redirect;
	};
};

ProxyCallback.instances = [];


var EnglishEngine = function() {
	
	this.sourceDic = 'en';
	this.targetDic = 'es';
	
	var notImplemented = function() {
		alert('Not implementend');
	};
		
	this.translateWord = function(word, callback) {
		notImplemented();
	};
	
	this.translateSentence = function(text, callback) {
		notImplemented();
	};
	
	this.speakSentence = function(text, callback) {
		notImplemented();
	};
	
	this.speakWord = function(word, callback) {
		notImplemented();
	};
	
};

/** Static functions **/
EnglishEngine.retrieveData = function(success) {
	var googleSpreadsheetKey = '0AplTiHy702EOdEV5aDRzYXZ3N2pfZlNxOTNEdDNfaHc';
	var proxy = new ProxyCallback();
	
	var url = 'https://spreadsheets.google.com/feeds/list/' + 
			  googleSpreadsheetKey + 
			  '/od6/public/values?alt=json-in-script&callback=ProxyCallback.instances[' + proxy.getId() + '].callback';
	
	
	//Configure a redirect callback
	proxy.setRedirection(function(jsonSpreadsheet) {
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
	});
	
	console.log('Retrieving data from google spreadshets...');
	$.getScript(url, success);
};

EnglishEngine.speakWord = function(word) {
	var howjsayUrl = 'http://howjsay.com/mp3/' + encodeURIComponent(word.toLowerCase()) + '.mp3';// + (new Date().getTime());
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

//TODO New engine Howjsay
Core.addConfigOption('wordSpeakingEngine', 'Howjsay', EnglishEngine.speakWord);

var Engines = {
	'Microsoft' : null,
	'Wordreference' : null,
	'Howjsay' : null,
	'Google' : null
};


var englishEngine = new EnglishEngine();
//var wr = new WordReference(englishEngine);

$(document)
	.on('click', 'span.sp', function(event){
		var word = $(this).text();
		Core.sBox.searchWord(word);
		Core.sBox.speakWord(word);
		event.stopPropagation();
	})
	.on('click', '.speak', function(){
		var sentence = $(this).text();
		Core.sBox.speakSentence(sentence);
		event.stopPropagation();
	})
	.on('click', '#config li.option', function(){
		var $this = $(this);
		$this.siblings().removeClass('active');
		$this.addClass('active');
	})
	.on('click', '#main-menu li', function(){
		var $this = $(this);
		$this.siblings().removeClass('active');
		$this.addClass('active');
		
		var $link = $this.find('a'); 
		Core.loadUnit($link.attr('data-unit'), $link.attr('data-name'));
	});

$(document).ready(function(){
	
	$('#searchButton').click(function(){
		var word = $('#searchField').val();
		Core.sBox.searchWord(word);
		Core.sBox.speakWord(word);
	});
	
	$('#audioPlayer')
	.bind('ended', function() {
		console.log('Finish');
	})
	.bind('error', function() {
		console.log('Error!');
	});
	
});


