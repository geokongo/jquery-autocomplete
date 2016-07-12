/*!
 * jQuery AutoSuggest Plugin v1.3.2
 * https://github.com/GeoffreyOliver/jquery-autosuggest
 * 
 * This plugin provides autosuggestion while typing into a textbox input field
 * It relies on a set of suggestions provided by the suggestionsProvider module or ajax call
 * If there are identical suggestions, it will attempt to type ahead of you.
 * 
 * Copyright 2015 - 2020 Geoffrey Bans
 * Released under the MIT license
 */
(function($){

	/**
	 *@var {} The event trigger targeted textbox
	 */
	var textbox;

	/**
	 *@var {} The reference to the dropdown DOM div list
	 */
	var layer;

	/**
	 *@var Integer The index of the current suggestion in the suggestions array
	 */
	var current = -1;

	/**
	 *@var Integer The number of seconds before fetching fresh data
	 */
	var duration = 600;

	/**
	 *@var {} The window localStorage object
	 */
	var store = window.sessionStorage;

	/**
	 *@var bool true|false Defines whether typeAhead functionality is allowed for this particular keypress
	 */
	var typeahead;
	
	/**
	 *@var String The name used to identify this timestamp in the storage.
	 */
	var timestamp = 'jquery-autosuggest-timestamp-77663434589485';

	/**
	 *@var String The name used to identify this data record in the storage.
	 */
	var storedata = 'jquery-autosuggest-data-77663434589485';

	//plugin definition
	$.fn.autosuggest = function(options){
		
		createDropdown();

		//setting the default options
		var settings = $.extend({

			suggestionsProvider: null,
			sugggestionsArray: null,
			typeAhead: true,
			ajaxurl: null,
			cache: false,
			limit: 10,
			cacheduration: 600,
			fixedwith: null,
			setparams: false,
			urlparams: {}

		}, options);

		//set the keydown event listeners
		$(this).on('keydown', function(event){
			
			textbox = event.target;
			handleKeydown(event)

		});

		//set the keyup event lister
		$(this).on('keyup', function(event){
			
			textbox = event.target;
			handleKeyup(event);

		});

		//set the blur event listener
		$(this).on('blur', function(event){
			
			textbox = event.target;
			hideSuggestions();

		});

		//setting the window resize event listener
		$(window).resize(function(){

			layer.style.width = (settings.fixedwith) ? settings.fixedwith + "px" : textbox.offsetWidth + "px";
			
			//position and show the dropdown list
			layer.style.left = getLeft() + "px";
			layer.style.top = (getTop() + textbox.offsetHeight) + "px";

		});

		/**
		 *This method checks if the keyup event involved a character key,
		 *All non character keys are to be ignored
		 *@param {} e The keyup event trigger object
		 *@return {} true|false True if character key and typeAhead, otherwise false
		 */
		function handleKeyup(event){

			if(event.keyCode == 8 || event.keyCode == 46){
				//do not type ahead for backspace and delete
				typeahead = false;
				getData(); //valid character, get suggestions
			}
			if(event.keyCode < 32 || (event.keyCode >= 33 && event.keyCode <= 46) || (event.keyCode >= 112 && event.keyCode <= 123)){
				//do not type ahead for other non character keys
				typeahead = false;
				//invalid character for loading suggestions. do nothing
			}
			else{
				//for all other character keys, type ahead
				typeahead = true;
				getData(); //valid character for loading suggestions
			}

		}

		/**
		 *This method handles the up arrow, down arrow and enter keys and requires the event object to be passed.
		 *
		 *@param {} event The keydown event trigger object
		 *@param null This method does not return any value
		 */
		function handleKeydown(event){
			switch(event.keyCode){
				case 38: //up arrow
					previousSuggestion();
					break;
				case 40: //down arrow
					nextSuggestion();
					break;
				case 13: //enter
					hideSuggestions();
					break;

			}
		}

		/**
		 *This method provides the first suggestion for autocomplete type ahead
		 *@param [] suggestions Array of the available suggestions
		 *@param Bool true|false typeAhead Indicates whether or not the type ahead functionality should be used
		 */
		function doSuggestForUserDefined(data){

			if (data.length > 0) {

				if(typeahead === true && settings.typeAhead === true){
					
					typeAhead(data[0]);
					showSuggestions(data);

				}
				else{
					showSuggestions(data);
				}

			} 
			else {
				//no data
				hideSuggestions();
			}

		}		

		/**
		 *This method provides the first suggestion for autocomplete type ahead
		 *@param [] suggestions Array of the available suggestions
		 *@param Bool true|false typeAhead Indicates whether or not the type ahead functionality should be used
		 */
		function doSuggestForPluginDefined(data){

			if (data.length > 0) {

				//look up suggestions
				var suggestions = findSuggestions(textbox.value, data);

				if(suggestions.identical.length > 0){
					if (typeahead === true && settings.typeAhead === true) {
						typeAhead(suggestions.identical[0]);
					}
					showSuggestions(suggestions.identical.concat(suggestions.similar));			
				}
				else if(suggestions.similar.length > 0){
					showSuggestions(suggestions.similar);
				}
				else {
					//no matches
					hideSuggestions();
				}

			} 
			else {
				//no data
				hideSuggestions();
			}

		}

		/**
		 *This method completes the word while the user is still typing
		 *@param String suggestion The work/phrase suggestion to prefill
		 *@return null This method does not return any value
		 */
		function typeAhead(suggestion){
			if(textbox.createTextRange || textbox.setSelectionRange){
				var len = textbox.value.length;
				textbox.value = suggestion;
				selectRange(len,suggestion.length);
			}
		}

		/**
		 *This method defines the uncompleted part of the suggestion to high in a separate color
		 *The part already typed by user is not to be highlighted.
		 *Highlighting is only done for EI and FireFox browsers
		 *@param Integer start The character index from where to start highlighting
		 *@param Integer length The full length of the suggested word/phrase
		 *@return null This method does not return a value 
		 */
		function selectRange(start, length){
			if(textbox.createTextRange){
				var range = textbox.createTextRange();
				range.moveStart('character', start);
				range.moveEnd('character', length - textbox.value.length);
				range.select();
			}
			else if(textbox.setSelectionRange){
				textbox.setSelectionRange(start, length);
			}

			textbox.focus();
		}

		/**
		 *This method hides the autosuggestion dropdown list after it has been show
		 *
		 *@param null This method does not take any parameter
		 *@return null This method does not return any value
		 */
		function hideSuggestions(){
			layer.style.visibility = "hidden";
		}

		/**
		 *This method highlights the current suggestion in the dropdown list
		 *
		 *@param {} suggestionNode The div element of the current suggestion
		 *@return null This method does not return any value
		 */
		function highlightSuggestion(suggestionNode){
			for(var i = 0; i < layer.childNodes.length; i++){
				var node = layer.childNodes[i];

				if (node == suggestionNode) {
					node.className = "current";
				}
				else if(node.className == "current"){
					node.className = "";
				}
			}
		}

		/**
		 *This method creates the outermost <div> and defines the event
		 *handlers for the dropdown list
		 *
		 *@param {} inputbox The textbox element object reference
		 *@return null This method does not return any value
		 */
		function createDropdown(inputbox = null){
			//set the textbox property value
			textbox = textbox || inputbox;

			layer = document.createElement("div");
			layer.className = "jquery-autosuggest-suggestions";
			layer.style.visibility = "hidden";

			document.body.appendChild(layer);

			//assign the event handlers
			layer.onmousedown = layer.onmouseup = layer.onmouseover = function(event){
				var event = event || window.event;
				var target = event.target || event.srcElement;

				if (event.type == "mousedown") {
					textbox.value = target.firstChild.nodeValue;
					hideSuggestions();
				} 
				else if(event.type == "mouseover"){
					highlightSuggestion(target);
				}
				else{
					textbox.focus();
				}
			}

			//insert the css style definition
			insertCSS();
		}

		/**
		 *This method tells us how many pixels away from the left of the offsetParent the textbox is.
		 *We calculate this all the way upto the <body> tag
		 *
		 *@param null This method does not take any parameter
		 *@return Integer The number of pixels from the left
		 */
		function getLeft(){
			var node = textbox;
			var left = 0;

			while(node.tagName != "BODY"){
				left += node.offsetLeft;
				node = node.offsetParent;
			}

			return left;
		}

		/**
		 *This method tells us how many pixels away from the top of the offsetParent the textbox is.
		 *We calculate this all the way upto the <body> tag
		 *
		 *@param null This method does not take any parameter
		 *@return Integer The number of pixels from the left
		 */
		function getTop(){
			var node = textbox;
			var top = 0;

			while(node.tagName != "BODY"){
				top += node.offsetTop;
				node = node.offsetParent;
			}

			return top;		
		}

		/**
		 *This method accepts an array of suggestions as an argument and then adds the 
		 *suggestions into the dropdown list and displays it
		 *
		 *@param [] suggestion The array with the suggestions to show
		 *@return null This method does not return a value
		 */
		function showSuggestions(suggestions){
			var div = null;
			layer.innerHTML = "";
			layer.style.width = (settings.fixedwith) ? settings.fixedwith + "px" : textbox.offsetWidth + "px";

			//loop through the suggestions array adding one at a time
			for( var i = 0; i < suggestions.length; i++){
				div = document.createElement("div");
				div.appendChild(document.createTextNode(suggestions[i]));
				layer.appendChild(div);
			}

			//position and show the dropdown list
			layer.style.left = getLeft() + "px";
			layer.style.top = (getTop() + textbox.offsetHeight) + "px";
			layer.style.visibility = "visible";
		}

		/**
		 *This method ensures that when the down arrow key is pressed, the next suggesion in the dropdown list is higlighted
		 *
		 *@param null This method does not require any parameter
		 */
		function nextSuggestion(){
			var suggestionNodes = layer.childNodes;

			if (suggestionNodes.length > 0 && current < suggestionNodes.length - 1) {
				var node = suggestionNodes[++current];
				highlightSuggestion(node);

				textbox.value = node.firstChild.nodeValue;
			}
		}	

		/**
		 * This method ensures that when the up arrow key is pressed, the prevous suggesion in the dropdown list is higlighted
		 *
		 * @param null This method does not require any parameter
		 */
		function previousSuggestion(){
			var suggestionNodes = layer.childNodes;

			if (suggestionNodes.length > 0 && current > 0) {
				var node = suggestionNodes[--current];
				highlightSuggestion(node);

				textbox.value = node.firstChild.nodeValue;
			}
		}

		/**
		 * This method gets the data to use for matching suggestions. 
		 * If not in the localStorage and array list not provided, data is fetched from the server using ajax if ajaxurl is provided.
		 * @param null This  method does not require any parameters
		 * @return {} JSON object containing the data against which to lookup suggestions
		 */
		function getData(){
			
			//load suggestions suggestionsProvider method if it was specified
			if(settings.suggestionsProvider !== null){

				//check if caching is enabled
				if (store && settings.cache === true) {
					
					//check time stamp here...
					var now = new Date();
					var lastTime = store.getItem(timestamp);
					var lastStamp = new Date(lastTime);

					//the data still valid
					if ((lastStamp.getTime() + (settings.cacheduration * 1000)) > now.getTime()) {
							
				
					} 
					else {
						//excecute the callback and cache the response
						//check for namespaces in the suggestionsProvider function.
						var namespaces = settings.suggestionsProvider.split('.');
						
						//check for existing namespaces upto 4 namespace
						if (namespaces.length > 0) {

							switch(namespaces.length){
								case 4:
									
									var res = window[namespaces[0]][namespaces[1]][namespaces[2]][namespaces[3]](textbox.value);
									var now = new Date();
									store.setItem(storedata, JSON.stringify(res));
									store.setItem(timestamp, now.toISOString());
									doSuggestForUserDefined(res);
									break;
								case 3:
									var res = window[namespaces[0]][namespaces[1]][namespaces[2]](textbox.value);
									var now = new Date();
									store.setItem(storedata, JSON.stringify(res));
									store.setItem(timestamp, now.toISOString());									
									doSuggestForUserDefined(res);
									break;
								case 2:
									var res = window[namespaces[0]][namespaces[1]](textbox.value);
									var now = new Date();
									store.setItem(storedata, JSON.stringify(res));
									store.setItem(timestamp, now.toISOString());									
									doSuggestForUserDefined(res);
									break;
								case 1:
									var res = window[suggestionsProvider](textbox.value);
									var now = new Date();
									store.setItem(storedata, JSON.stringify(res));
									store.setItem(timestamp, now.toISOString());									
									doSuggestForUserDefined(res);
									break;
							}

						} 

					}
				} 
				else {
					//excecute callback
					//check for namespaces in the suggestionsProvider function.
					var namespaces = settings.suggestionsProvider.split('.');
					
					//check for existing namespaces upto 4 namespace
					if (namespaces.length > 0) {

						switch(namespaces.length){
							case 4:
								
								doSuggestForUserDefined(window[namespaces[0]][namespaces[1]][namespaces[2]][namespaces[3]](textbox.value));
								break;
							case 3:
								doSuggestForUserDefined(window[namespaces[0]][namespaces[1]][namespaces[2]](textbox.value));
								break;
							case 2:
								doSuggestForUserDefined(window[namespaces[0]][namespaces[1]](textbox.value));
								break;
							case 1:
								doSuggestForUserDefined(window[suggestionsProvider](textbox.value));
								break;
						}

					}				

				}

			}
			//check if any suggestions list array was provided
			else if (settings.sugggestionsArray !== null) {
				//pass array by value
				doSuggestForPluginDefined(settings.sugggestionsArray.slice(0));

			} 
			//check if ajax url is provided and fetch data
			else if(settings.ajaxurl !== null) {

				//check if local storage is enabled
				if (store !== null && settings.cache === true) {

					//compose data key
					var timestampKey = encodeURIComponent(settings.ajaxurl);
					var timestampData = encodeURIComponent(settings.ajaxurl)+"data";
					
					//is there data stored already?
					if (store.getItem(timestampKey) !== null) {
						
						//check time stamp here...
						var now = new Date();
						var lastTime = store.getItem(timestampKey);
						var lastStamp = new Date(lastTime);

						//the data expired
						if ((lastStamp.getTime() + (settings.cacheduration * 1000)) < now.getTime()) {
							
							var params = "";
							if (settings.setparams === true) {

								//compose the urls params
								params+= "?query=" + textbox.value;

								$.each(settings.params, function(key,value){
									params+= "&" + key + "=" + value;
								});

							}	

							$.ajax({

								url: settings.ajaxurl + params,
								type: 'GET',
								dataType: 'json',
								success: function(response){

									var now = new Date();
									store.setItem(timestampData, JSON.stringify(response));
									store.setItem(timestampKey, now.toISOString());
									doSuggestForPluginDefined(response);
								},
								error: function(err){
									console.error('There was an error with the ajax request in jquery.autosuggest');
								}

							});

						} 
						//store data is up to date? use it
						else {
							doSuggestForPluginDefined(JSON.parse(store.getItem(timestampData)));
						}

					} 
					// no data in store? check online
					else {

						var params = "";
						if (settings.setparams === true) {

							//compose the urls params
							params+= "?query=" + textbox.value;

							$.each(settings.params, function(key,value){
								params+= "&" + key + "=" + value;
							});

						}						

						$.ajax({

							url: settings.ajaxurl + params,
							type: 'GET',
							dataType: 'json',
							success: function(response){

								var now = new Date();
								store.setItem(timestampData, JSON.stringify(response));
								store.setItem(timestampKey, now.toISOString());
								doSuggestForPluginDefined(response);

							},
							error: function(error){
								console.error('There was an error with the ajax request in jquery.autosuggest');
							}

						});

					}

				} 
				//there is no local storage, fetch data from the server
				else {

					var params = "";
					if (settings.setparams === true) {

						//compose the urls params
						params+= "?query=" + textbox.value;

						$.each(settings.params, function(key,value){
							params+= "&" + key + "=" + value;
						});

					}

					$.ajax({

						url: settings.ajaxurl + params,
						type: 'GET',
						dataType: 'json',
						success: function(response){
							doSuggestForPluginDefined(response);
						},
						error: function(err){
							//there was an error
							console.error('There was an error with the ajax request in jquery.autosuggest!');
						}

					});

				}

			}
			//if none of the above - do nothing!
			else {
				console.error("No data source provided for jquery.autosuggest!");
			} 

		}

		/**
		 * This method finds and returns suggestions based on the user input.
		 *
		 * @param String input The user's text input.
		 * @param [] items The array of items to use for matching suggestions.
		 * @return [] Array of matched suggestions
		 *
		 */
		function findSuggestions(input, items){


			var suggestions = {
				identical: [],
				similar: []
			};

			//find suggestions
			var regex = new RegExp(escapeString(input), "i");

			if (input.length > 0) {

				while( ((suggestions.identical.length) != settings.limit) && items.length != 0){

					var item = items.shift();

					if (item.indexOf(input) == 0) {
						suggestions.identical.push(item);
					} 
					else if (item.search(regex) == 0) {
						suggestions.similar.unshift(item);
					}
					else if(item.search(regex) !== -1){
						suggestions.similar.push(item);
					}

				}


			}

			if (suggestions.identical.length == settings.limit) {
				
				suggestions.similar = []; //remove the similar matches
			
			} 
			else {
				suggestions.similar = suggestions.similar.slice(0,(settings.limit - suggestions.identical.length));
			}

			return suggestions;

		}

		/**
		 * This method shuffles the elements of an array
		 * 
		 * @param [] array The array to reshuffle
		 * @return null It modifies the original array
		 */
		function reshuffle(array){
			var j, x, i;
		    for (i = a.length; i; i -= 1) {
		        j = Math.floor(Math.random() * i);
		        x = a[i - 1];
		        a[i - 1] = a[j];
		        a[j] = x;
		    }

		}

		/**
		 * This method escapes special characters in a string
		 * @param String input The input string to be escaped
		 * @return String The output string after escaping
		 */
		function escapeString(input){
			return input.replace(/([.?*+^$[\]\\(){}|-])/g, "\\$1");
		}

		/**
		 * This method inserts the css styles for the dropdown into the DOM
		 * @param null
		 * @return null
		 */
		function insertCSS(){

			//define the css style string
			var dropdownCSS = "div.jquery-autosuggest-suggestions { margin-bottom: 8px;background-color: #ffffff; border-radius: 1px;border: 1px solid #dddddd;position: absolute;}";
			dropdownCSS += "div.jquery-autosuggest-suggestions div {cursor: default;padding: 0px 3px;font-size: 16.099999999999998px;font-weight: 200;line-height: 1.4;border-bottom: 1px solid rgba(128,128,128,0.1);}";
			dropdownCSS += "div.jquery-autosuggest-suggestions div.current {background-color: #428bca;color: white;}";

			var documentHead = document.head || document.getElementsByTagName('head')[0];
			var stylesheetNode = document.createElement('style');

			stylesheetNode.type = 'text/css';

			if (stylesheetNode.styleSheet){

			  stylesheetNode.styleSheet.cssText = css;

			} 
			else {

			  stylesheetNode.appendChild(document.createTextNode(dropdownCSS));

			}

			documentHead.appendChild(stylesheetNode);
		}

	};

}(jQuery));