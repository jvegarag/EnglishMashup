var Core = {
	
	tm : null,
	
	loadUnit : function(name) {
		$('#unitContainer').html('');
		yepnope({ 
			load : 'units/' + name + '/unit.js?' + (new Date().getTime()),
			callback : function(url, result, key) {
				
			},
			error : function() {
				alert('Error loading unit ' + name);
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
					name : 'Microsoft Translator',
					exec : function(){
						var taskObject = this;
						Engines['Microsoft'].init(function(){
							taskBatch.endTask(taskObject);
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
				
				tm.startTask({
					name : 'Unit 1',
					exec : function(){
						Core.loadUnit('vocabulary');
						tm.endTask(this.taskId);
					}
				});
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
		
		return text.replace(/[^\W]+/mig, "<span>$&</span>");
		
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





var EnglishEngine = function(conf){
	
	var instance = this;
	
	var addMethod = function(name, method) {
		if (method) instance[name] = method; 
	};
	
	addMethod('translate', function(text, callback) {
		conf.translate(text, callback);
	});
	
	addMethod('speakSentence', function(text, callback) {
		conf.speak(text);
	});
	
	addMethod('speakWord', function(text, callback) {
		conf.speak(text);
	});	
	
	this.init = function(callback) {
		conf.init(callback);
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


var Engines = {
	'Microsoft' : null,
	'Wordreference' : null,
	'Howjsay' : null,
	'Google' : null
};


Engines['Microsoft'] = new EnglishEngine({
	fromLang : 'en',
	toLang : 'es',
	init : function(successCallback) {
		var that = this;
		var	postData = {
			grant_type : 'client_credentials',
			scope : 'http://api.microsofttranslator.com',
			client_id : '61793d78-d949-4cc2-9a36-04a349c15ef3',
			client_secret : '6JGrj+LMlU5ArRFAPrkSPyxp6IrbkBczZqtmOlEOQ2c='			
		};
		
		/*
		 janky({url: "https://datamarket.accesscontrol.windows.net/v2/OAuth2-13",
	            data: postData,
	            method: 'post',
	            success: function(data) {
	            	console.log(data);
	            	that.accessToken = data.access_token;
	            	alert(successCallback);
	            	successCallback();
	            },
	            error: function() {
	              console.log('there was an error');
	            }
	    });		*/
		
		$.ajax({
			type: 'POST',
			url: 'https://datamarket.accesscontrol.windows.net/v2/OAuth2-13',
			data: postData,
			success: function(data) {
				that.accessToken = data.access_token;
				successCallback();
			}
		});
	},
	
	translate : function(text, callback) {
		var url = "http://api.microsofttranslator.com/V2/Ajax.svc/Translate?" +
			"appId=Bearer " + encodeURIComponent(this.accessToken) +
			"&from=" + encodeURIComponent(this.fromLang) +
			"&to=" + encodeURIComponent(this.toLang) +
			"&text=" + encodeURIComponent(text) +
			"&oncomplete=proxyCallback.callback";
		//Configure a redirection proxy for the callback
		var trans = '';
		proxyCallback.redirect = function(translation) {
			trans = translation;
		};
		$.getScript(url, function() { 
			callback(trans);
		});
	},
	
	speak : function(text) {
		var format = "audio/mp3";
		var option = "MinSize";		
		var url = "http://api.microsofttranslator.com/V2/Ajax.svc/Speak?" + 
				"oncomplete=" + 'proxyCallback.callback' + 
				"&appId=Bearer " + encodeURIComponent(this.accessToken) + 
				"&text=" + encodeURIComponent(text) + 
				"&language=" + encodeURIComponent(this.fromLang) + 
				"&format=" + encodeURIComponent(format) + 
				"&options=" + option;
				
		//Configure a redirection proxy for the callback
		proxyCallback.redirect = function(audio) {
			$('#audioPlayer')
				.attr('src', audio)[0].play();
		};
		$.getScript(url);
	},
	
	accessToken : null
});


$(document)
	.on('click', '.speak > span', function(event){
		var $this = $(this);						
		EnglishEngine.speakWord($this.text());					
		event.stopPropagation();
	})
	//	.on('hover', 'span', function(event){
	//		console.log(this);
	//	})				
	.on('click', '.speak', function(){
		msEngine.speak($(this).text());
	});


$('#audioPlayer')
	.bind('ended', function() {
		console.log('Finish');
	})
	.bind('error', function() {
		console.log('Error!');
	});
