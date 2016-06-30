/*!
 * jQuery AutoSuggest Plugin v0.0.1
 * https://github.com/GeoffreyOliver/jquery-autosuggest
 * 
 * This plugin provides autosuggestion while typing into a textbox input field
 * It relies on a set of suggestions provided by the SuggestionsProvider module or ajax call
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
	 *@var {} The suggestions provider
	 */
	var provider;

	/**
	 *@var {} The reference to the dropdown DOM div list
	 */
	var layer;

	/**
	 *@var {} The javascript event object
	 */
	var eventObject;

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
	var store = window.localStorage;
	
	var timestamp = 'users-suggestions-timestamp-7766';
	var storedata = 'users-suggestions-data-7766';

	/**
	 *@var String The name used to identify this timestamp in the storage.
	 */
	//var timestamp = 'jquery-autosuggest-timestamp-7766';

	/**
	 *@var String The name used to identify this data record in the storage.
	 */
	//var storedata = 'jquery-autosuggest-data-7766';

	//plugin definition
	$.fn.autosuggest = function(options){
		
		textbox = $(this);
		createDropdown();

		//setting the default options
		var settings = $.extend({

			suggesionsProvider: null,
			typeAhead: true,
			provider: null,
			ajaxurl: null,
			localStorage: true,
			suggestionsList: null

		}, options);

		//set the keydown event listeners
		$(this).on('keydown', function(event){
			
			eventObject = event;
			textbox = event.target;
			handleKeydown(event)

		});

		//set the keyup event lister
		$(this).on('keyup', function(event){
			
			eventObject = event;
			layer.style.width = event.target.offsetWidth + "px";

			textbox = event.target;
			//alert(textbox.offsetWidth);
			var keyed = handleKeyup(event);

			//only act for valid keypress
			if(keyed.character === true){
				//get suggestion from the provider
				doSuggest(keyed.typeAhead); 
			}

		});

		//set the blur event listener
		$(this).on('blur', function(event){
			
			eventObject = event;
			textbox = event.target;
			hideSuggestions();

		});

		/**
		 *This method checks if the keyup event involved a character key,
		 *All non character keys are to be ignored
		 *@param {} e The keyup event trigger object
		 *@return {} true|false True if character key and typeAhead, otherwise false
		 */
		function handleKeyup(event){
			var keycode = event.keyCode;

			if(keycode == 8 || keycode == 46){
				//do not type ahead for backspace and delete
				return {
					character: true,
					typeAhead: false
				}
			}
			if(keycode < 32 || (keycode >= 33 && keycode <= 46) || (keycode >= 112 && keycode <= 123)){
				//do not type ahead for other non character keys
				return {
					character: false,
					typeAhead: false
				}
			}
			else{
				//for all other character keys, type ahead
				return {
					character: true,
					typeAhead: true
				}
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
		function doSuggest(typeahead){

			//get the data
			var items = getData();

			if (items.length > 0) {

				//look up suggestions
				var suggestions = findSuggestions(eventObject.target.value, items);

				if(suggestions.length > 0){
					if (typeahead === true && settings.typeAhead === true) {
						typeAhead(suggestions[0]);
					}
					showSuggestions(suggestions);			
				}
				else{
					hideSuggestions();
				}

			} 
			else {
				//there is nothing to do
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
			layer.className = "suggestions";
			layer.style.visibility = "hidden";
			layer.style.width = textbox.offsetWidth + "px";

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
			
			//load suggestions provider method if it was specified
			if(settings.provider !== null){

				//check for namespaces in the provider function.
				var namespaces = settings.provider.split('.');
				
				//check for existing namespaces upto 4 namespace
				if (namespaces.length > 0) {

					switch(namespaces.length){
						case 4:
							return window[namespaces[0]][namespaces[1]][namespaces[2]][namespaces[3]](eventObject.target.value);
							break;
						case 3:
							return window[namespaces[0]][namespaces[1]][namespaces[2]](eventObject.target.value);
							break;
						case 2:
							return window[namespaces[0]][namespaces[1]](eventObject.target.value);
							break;
						case 1:
							return window[provider](eventObject.target.value);
							break;
					}

				} 

			}
			//check if any suggestions list array was provided
			else if (settings.suggestionsList !== null) {

				return findSuggestions(eventObject.target.value, settings.suggestionsList);

			} 
			//check if ajax url is provided and fetch data
			else if(settings.ajaxurl !== null) {

				//check if local storage is enabled
				if (settings.localStorage !== false && store !== null) {
					
					//is there data stored already?
					if (store.getItem(timestamp) !== null) {
						
						//check time stamp here...
						var now = new Date();
						var lastTime = store.getItem(timestamp);
						var lastStamp = new Date(lastTime);

						//the data expired
						if ((lastStamp.getTime() + (duration * 1000)) < now.getTime()) {
							
							//is the user connected to the internet?
							if (navigator.onLine === true) {
								//get fresh data
								$.ajax({

									url: ajaxurl,
									type: 'GET',
									dataType: 'json',
									success: function(response){
										var now = new Date();
										store.setItem(storedata, JSON.stringify(response));
										store.setItem(timestamp, now.toISOString());

										return response;
									},
									error: function(err){
										//there was an error
										console.error('There was an error with the ajax request in jquery.autosuggest');
									}

								});

							} 
							//no internet? use available data
							else {
								return JSON.parse(store.getItem(storedata));	
							}
						} 
						//store data is up to data? use it
						else {
							//use current data
							return JSON.parse(store.getItem(storedata));
						}

					} 
					// no data in store? check online
					else {
						if (navigator.onLine === true) {
							//yes storage, no data, yes internet - get data
							$.ajax({

								url: ajaxurl,
								type: 'GET',
								dataType: 'json',
								success: function(response){
									var now = new Date();
									store.setItem(storedata, JSON.stringify(response));
									store.setItem(timestamp, now.toISOString());

									return response;
								},
								error: function(error){
									console.error('There was an error with the ajax request in jquery.autosuggest');
								}

							});

						} 
						else {
							//yes storage, no data, no internet
							console.error("jquery.autosuggest can't fetch data - you are currently offline!");
							return [];
						}
					}
				} 
				//there is no local storage, fetch data from the server
				else {
					//Poll server if we are online
					if (navigator.onLine === true) {
						
						$.ajax({

							url: ajaxurl,
							type: 'GET',
							dataType: 'json',
							success: function(response){

								return response;
							},
							error: function(err){
								//there was an error
								console.log('There was an error with the ajax request');
							}

						});

					} 
					else {
						//no storage, not internet - Just return nothing
						return [];
					}
				}

			}
			//if none of the above - do nothing!
			else {
				console.error("No data source provided for jquery.autosuggest!");
				return [];
			} 

		}

		/**
		 *This method finds and returns suggestions based on the user input.
		 *
		 *@param String input The user's text input.
		 *@param [] items The array of items to use for matching suggestions.
		 *@return [] Array of matched suggestions
		 */
		function findSuggestions(input, items){

			var suggestions = [];
			//find suggestions
			var regex = new RegExp(input, "gi");

			if (input.length > 0) {
				for(var item in items){
					var string = items[item].first_name + " " + items[item].last_name;

					if ( regex.test(string) == true) {
						suggestions.push(items[item].first_name + " " + items[item].last_name);
					}			
				}

			}

			return suggestions;

		}
	};

}(jQuery));