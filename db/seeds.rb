# This file should contain all the record creation needed to seed the database with its default values.
# The data can then be loaded with the rails db:seed command (or created alongside the database with db:setup).
#
# Examples:
#
#   movies = Movie.create([{ name: 'Star Wars' }, { name: 'Lord of the Rings' }])
#   Character.create(name: 'Luke', movie: movies.first)

parks = Park.create([
	{parkName:'Volunteer Park', parkWebsite: 'https://www.seattle.gov/parks/find/parks/volunteer-park', parkHours:'6:00AM - 10:00PM', parkAddress:'1247 15th Ave. E, Seattle, WA 98112', lattitude:47.6303158, longitude:-122.316504},
	{parkName:'Marymoor Park', parkWebsite: 'http://www.kingcounty.gov/services/parks-recreation/parks/parks-and-natural-lands/popular-parks/marymoor.aspx', parkHours:'8:00AM - Dusk', parkAddress:'6046 W Lake Sammamish Parkway NE Redmond, WA 98052', lattitude:47.661706, longitude:-122.1281171},
	{parkName:'Grass Lawn Community Park', parkWebsite: 'http://www.ci.redmond.wa.us/cms/one.aspx?portalId=169&pageId=4010', parkHours:'6:00AM - 11:00PM', parkAddress:'7031 148 Ave NE, Redmond, WA 98052', lattitude:47.6688246, longitude:-122.145785},
	{parkName:'Cal Anderson Park', parkWebsite: 'http://www.seattle.gov/parks/find/parks/cal-anderson-park', parkHours:'4:00AM - 11:30PM', parkAddress:'1635 11th Ave, Seattle, WA 98122', lattitude:47.6170151, longitude:-122.3213249},
	{parkName:'Wapato Park', parkWebsite: 'http://www.metroparkstacoma.org/wapato-park/', parkHours:'Sunrise - Sunset', parkAddress:'6500 S Sheridan Ave, Tacoma, WA 98408', lattitude:47.198294, longitude:-122.4546408},
	{parkName:'Green Lake Park', parkWebsite: 'http://www.seattle.gov/parks/find/parks/green-lake-park', parkHours:'24 hours', parkAddress:'7201 E Greenlake Dr. N, Seattle, WA 98115', lattitude:47.6802168, longitude:-122.3305128},
	{parkName:'Juanita Bay Park', parkWebsite: 'http://www.explorekirkland.com/Do/Parks/Juanita_Bay_Park.htm', parkHours:'Sunrise - Sunset', parkAddress:'2201 Market St, Kirkland, WA 98033', lattitude:47.6952207, longitude:-122.2126898},
	{parkName:'Marina Park', parkWebsite: 'http://www.explorekirkland.com/Do/Parks/Marina_Park.htm', parkHours:'24 hours', parkAddress:'25 Lakeshore Plaza, Kirkland, WA 98033',lattitude:47.6753452, longitude:-122.2098626},
	{parkName:'Browns Point Lighthouse Park', parkWebsite: 'http://www.metroparkstacoma.org/browns-point-lighthouse-park', parkHours:'Sunrise - Sunset', parkAddress:'201 Tulalip St NE, Tacoma, WA 98422',lattitude:47.3056915, longitude:-122.4453574}	
])