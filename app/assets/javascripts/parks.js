# Place all the behaviors and hooks related to the matching controller here.
# All this logic will automatically be available in application.js.
# You can use CoffeeScript in this file: http://coffeescript.org/

function geocodeAddress(geocoder, resultsMap, address, webpage, parkID) {
	geocoder.geocode({'address': address}, function(results, status) {
		if (status === 'OK') {
			// resultsMap.setCenter(results[0].geometry.location);
			var marker = new google.maps.Marker({
			  map: resultsMap,
			  position: results[0].geometry.location
			});

			marker.addListener('click', function() {
				window.open(webpage, "_self");
			});

			marker.addListener('mouseover', function(){
				$("li#"+parkID).addClass('highlightedPark');
			});

			marker.addListener('mouseout', function(){
				 $("li#"+parkID).removeClass('highlightedPark');
			});

			return results[0].geometry.location;
		} else {
			alert('Geocode was not successful for the following reason: ' + status);
			return 0;
		}
});

function getAddressLatAndLong()
{
	var geocoder = new google.maps.Geocoder();
}