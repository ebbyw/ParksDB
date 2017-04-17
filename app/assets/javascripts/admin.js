// Place all the behaviors and hooks related to the matching controller here.
// All this logic will automatically be available in application.js.
// You can use CoffeeScript in this file: http://coffeescript.org/

//= app

function setPageHeaderTitle(newTitle) {
	document.getElementById('pageHeaderTitle').innerHTML = newTitle;
}

function setPageHeaderSubtitle(newSubtitle) {
	document.getElementById('pageHeaderSubtitle').innerHTML = newSubtitle;
}

function setSelectedNavPage(navItemID) {
	document.getElementById(navItemID).className += "active";
}

