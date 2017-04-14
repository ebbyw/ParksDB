function addMarker(resultsMap, mapBounds, parkLat, parkLong, parkID, parkWebpage) {
	var markerLocation = {lat: parkLat, lng: parkLong};
	var marker = new google.maps.Marker({
		map: resultsMap,
		position: markerLocation
	});

	//extend the bounds to include each marker's position
	mapBounds.extend(marker.position);

	marker.addListener('click', function() {
		window.open(parkWebpage, "_self");
	});

	marker.addListener('mouseover', function(){
		$("li#"+parkID).addClass('highlightedPark');
	});

	marker.addListener('mouseout', function(){
		 $("li#"+parkID).removeClass('highlightedPark');
	});
}

;
