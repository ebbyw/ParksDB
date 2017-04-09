# Place all the behaviors and hooks related to the matching controller here.
# All this logic will automatically be available in application.js.
# You can use CoffeeScript in this file: http://coffeescript.org/

function initMap() {
	var uluru = {lat: -25.363, lng: 131.044};
	var map = new google.maps.Map(document.getElementById('map'), {
	  zoom: 4,
	  center: uluru
	});
	var marker = new google.maps.Marker({
		position: uluru,
		map: map
	});
}

async defer
    src="https://maps.googleapis.com/maps/api/js?key=AIzaSyBBSaQmP0Ff65kmrv1iYc6O7Pq5SY5eclc&callback=initMap">

