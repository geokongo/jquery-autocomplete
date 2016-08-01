# jQuery Autosuggest Plugin #
This jquery plugin provides suggestions in a dropdown list as the user types in the input field. The suggestions provided are matched based on the content of characters already typed in the text input field. If there are identical matches, the plugin will attemp to type ahead of the user in the input box.

### Features ###
* [Auto Complete for text input fields](#autosuggest)
* [Provide a Suggestions Array](#sugggestionsArray)
* [Limit Number of Options to Show](#limit)
* [Type ahead functionality](#typeahead)
* [Specify Ajax Url](#ajaxurl)
* [Append Input to Ajax Url](#apendgetdata)
* [Session caching of data array](#cache)
* [Custom Suggestions Provider Callback Function](#suggestionsProvider)
* [Customize User Interface](#customizeable)
* [Screenshots](#screenshots)

## [Live Demo](https://geoffreybans.github.io/jquery.autosuggest/index.html) ###

## Example Usage ##

The autosuggest plugin requires the the jquery library in order to function, being a jquery plugin that's kinda obvious.
Load the jquery library first in this manner:

```javascript
<script type="text/javascript" src="scripts/js/jquery.min.js"></script> 
```

After loading the jquery library, load the plugin's minified javascript file.

```javascript 
<script type="text/javascript" src="scripts/js/jquery.autosuggest.min.js"></script> 
```

That's all the basic loading needed. You do not need to load any separate css files as the styling of the suggestions drop down is dynamically inserted using javascript. However, if you would like to style the drop down in your own, check the later sections on how to include your own styles.

### <a name="autosuggest">Auto Complete for text input fields </a> ###

In order to get up and running with autosuggest with minimal configuration attach the autosuggest() function to a input field using either the class name or the id.

```javascript 
$("#states").autosuggest(); 
```

### <a name="sugggestionsArray"> Provide a Suggestions Array </a> ###

At the minumum, autosuggest plugin requires an array of options against which it will perform matching to provide the relevant or similar matches to the user input already in the input field.
Say you have a javascript array of states in this format:

```javascript
var states = ["Alabama", "Alaska", "Arizona", "Arkansas","California", "Colorado", "Connecticut",
"Delaware", "Florida", "Georgia", "Hawaii","Idaho", "Illinois", "Indiana", "Iowa"]; 
```

You will pass this as a parameter to the plugin in this manner:

```javascript
$("states").autosuggest({
	sugggestionsArray: states
});
```

As the user types input into the input field, the plugin searches the provided array for similar or identical input to what the user has already typed in the input field. This number of options is then provided as a dropdown list below the input field. The user can then select their favorite option by either using the mouse or using the keyboard up and down arrow keys.

### <a name="limit"> Limit Number of Options to Show </a> ###

Usually, the plugin would only return the first 10 matches found, or less if no more were found. You don't like this? Don't think about it.. You can set your own limit, say you would like a dropdown with 103 (too much though) options provided:

```javascript
$("states").autosuggest({
	sugggestionsArray: states,
	limit: 103
});
```

The suggestions are matched with identical matches at the top of the list and similar, less identical, options below the list.

### <a name="typeahead"> Type ahead functionality </a> ###

By default the type ahead functionality is enabled. If there are identical matches found, the plugin would attempt to type ahead of the user in the input field. This provides a greater use experience as you would not have to type the whole text if your favorite choice appears at the top.
If there are no identical matches, the type ahead functionality is disabled.
You can choose to manully disable the type ahead functionality, if it doesn't click with you, in this manner. Provide as an options to the constructor, setting it to false.

```javascript
$("states").autosuggest({
	sugggestionsArray: states,
	typeAhead: false
});
```

This would ensure that type ahead doesn't work even if there are identical matches.

### <a name="ajaxurl"> Specify Ajax Url </a> ###

You are not limited to providing an array as a data source for the autosuggest plugin, as this may not be secure or convenient in some instances. A number of amazing options are available to you.

You can provide a url to be used to fetch the array to be used for matching the suggestions. This url would be loaded using ajax and should return a valid JSON object in order to be parsed for options by javascript. Here is how you provide the url as a parameter:

```javascript
$("states").autosuggest({
	ajaxurl: "localhost:3000/app/users/states"
});
```

The data sources are loaded in order of priority - if you specify both a sugggestionsArray and an ajaxurl, the array is checked first. If found, it used to match suggestions and the therefore the url would not be reached. In the case that you would like to use the url to load the array for matching suggestions, then specify the url only, ommitting the option for the sugggestionsArray.

The plugin would load the ajax url provided literally without appending any parameters to it. Therefore, if you application needs some authentication in order to access the array of options then you will need to append the necessary parameters in the url or something like that.

### <a name="apendgetdata"> Append Input to Ajax Url </a> ###

You can choose to append the content of the input field to the ajax url. The value of the  input field is accessed using the key:

` query=string `

```javascript
$(".airports").autosuggest({
	ajaxurl: "localhost:3000/app/getairports",
	setparams: true
});
```

This becomes:

` localhost:3000/app/getairports?query=sydney `


If you have other parameters to pass along, you can pass them as an object parameter and they will be appending as a get string to the url.

```javascript
$(".airports").autosuggest({
	ajaxurl: "localhost:3000/app/getairports",
	setparams: true,
	urlparams: {
		param1: value1,
		param2: value2
	}
});
```

This becomes:

` localhost:3000/app/getairports?query=sydney&param1=value1&param2=value2 `


### <a name="cache"> Session caching of Data Array </a> ###

Constantly loading data from a url in order to perform the matches is not very interesting, especially if the data fetched doesn't really change that frequently. In this case, you can provide greater user experience by using the plugin's in build cache mechanism.

Autossuggest plugin can store the result of the ajax call in the user's local cache and load it every time as needed, without having to poll the server. This would save the user's device's battery power, time and at the same time providing a greater experience.

This data is stored in sessionStorage and is, therefore, only available in the user's current tab and the data is cleared as soon as the user closes that browser tab or closes their browser window altogether or shuts down their computer.

You enable cache in this manner:

```javascript
$("#states").autosuggest({
	ajaxurl: "localhost:3000/app/users/states",
	cache: true
});
```

In some instances you might want to implicitly specify the duration before which this data is fetched again - in case this data might change, and you would love it if the users got the latest options. You can specify this time in seconds as a parameter to the constructor:

```javascript
$("#states").autosuggest({
	ajaxurl: "localhost:3000/app/users/states",
	cache: true,
	cacheduration: 14400
});
```

In this case, whenever data is required the plugin compares the timestamp of the last data accessed from the url with the current time and cacheduration and decides wether to load the url again or to use the data in the cache. 

#### Note: ####

Even if you set the cache duration to 24 hours and the user closes that browser tab, this data is cleared from cache and will have to reloaded again from the url the next time needed.

You may want to use the plugin for multiple text input fields in the same page. That's completely cool with us! What about if you specified (cache: true) for these input fields, would the plugin attempt to use the same data althrough? Well, no. Provided the url parameter for each input field instance is different, each field's data is stored separately. Otherwise, yes we will use the same data for all fields if the url is the same.

### <a name="suggestionsProvider"> Custom Suggestions Provider Callback Function </a> ###

Suggestions are provided based on the plugin's own algorithim for performing the matches. You don't like it, right? Wait... You don't have to use it. You can specify your own callback function to be used to find matches for the user input. The autosuggest accepts a function as a parameter in this manner:

```javascript
$("states").autosuggest({
	suggestionsProvider: YouStatesSuggestionsFunction
});
```

You pass the function without the parenthesis so that it's not excecuted before the right time. This function should recieve as a parameter, the current text content in the user input field. In return, the function would return a valid javascript array of options.

If you callback function is namespaced, it would still be loaded right. The plugin supports nested namespaces up to level 4, e.g. ` Lib.My.Callback.Function() `

By default type ahead is enabled. If your suggestionsProvider doesn't return items identical to the user input, the plugin would still take the first element in the list and type it into the input field. In some cases, this might be annoying to your users. For this reason, you might want to implicitly turn off the type ahead functionality if you are using a custom callback function in this manner:

```javascript
$("states").autosuggest({
	suggestionsProvider: YouStatesSuggestionsFunction,
	typeAhead: false
});
```

### <a name="customizeable"> Customize User Interface </a> ###

The dropdown of suggestions provided by the plugin is responsive i.e. gets resized and respositioned as appropriate with browser window resize. This is tight bound into the plugin because I think that is something you really need.

In the event that you need to specify a fixed column width for the dropdown instead, you can specify it as a parameter to the constructor. Specify the width in pixels, without the 'px' suffix:

```javascript
$("#states").autosuggest({
	fixedwith: 150
});
```

This means that if you resize your window, the dropdown would still be repositioned to the bottom left corner of the input field but the width would remain unchanged, as you specified.

Here are the CSS rules that style the dropdown, feel free to alter, using the very same query selectors, as you desire:

```css
div.suggestions {
    margin-bottom: 8px;
  	background-color: #ffffff;
  	border-radius: 1px;
    border: 1px solid #dddddd;
    position: absolute;
}
div.suggestions div {
    cursor: default;
    padding: 0px 3px;
  	font-size: 16.099999999999998px;
  	font-weight: 200;
  	line-height: 1.4;
    border-bottom: 1px solid rgba(128,128,128,0.1);
}
div.suggestions div.current {
    background-color: #428bca;
    color: white;
}

```
### <a name="screenshots"> Screenshots </a> ###

Matching by keyword with type ahead enabled. The type ahead only functions if the first letters type identically match those of an available entry. Type ahead is case sensitive, so both uppercase and lowercase will be matched by plugin will only attempt to type ahead of you for the same case matches.

![image](https://cloud.githubusercontent.com/assets/8317735/16544374/5d417a5c-410c-11e6-8f3b-030132f8c509.png)
![image](https://cloud.githubusercontent.com/assets/8317735/16544377/5d6a9d60-410c-11e6-8843-e13dc68fa19a.png)

You can use the Up and Down arrow keys to scroll through the list of available options, besides scrolling through the list with the mouse.

![image](https://cloud.githubusercontent.com/assets/8317735/16492536/d3947d9a-3eea-11e6-9081-09466ec3c38d.png)
![image](https://cloud.githubusercontent.com/assets/8317735/16544376/5d69bb84-410c-11e6-818d-2aacf68d843a.png)
