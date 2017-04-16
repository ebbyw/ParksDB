$(document).ready(function(){
	$('body').on("submit", "form", function (event) {     
		event.preventDefault();       
		submitFilterQuery();
	});
});

function submitFilterQuery()
{
//Grab the input values from the filters and the search bar
	var queryString = "";
	$('.searchForm *').filter(':input').each(function(){
		if($(this).val().length > 0){
			if(queryString.length > 1){
				queryString += "&";
			}
			queryString += $(this).attr("name");
			queryString += "=";
			queryString += $(this).val();
		}
	});
	$('.filtersForm *').filter(':input').each(function(){
		if($(this).val().length > 0){
			if(queryString.length > 1){
				queryString += "&";
			}
			queryString += $(this).attr("name");
			queryString += "=";
			queryString += $(this).val();
		}
	});
	$('#filtersPanel *').filter(':input').each(function(){
		if($(this).val().length > 0 && $(this).prop("checked")){
			if(queryString.length > 1){
				queryString += "&";
			}
			queryString += $(this).attr("name");
			queryString += "=";
			queryString += $(this).val();
		}
	});
	if(queryString.length > 0){
		window.location.href = "/parks?"+queryString;
	}
}

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

function noResultsToDisplay() {
	$('#map').html("<h1 style=\"text-align: center\"> Sorry, there were no search results.</h1>");
}
;
