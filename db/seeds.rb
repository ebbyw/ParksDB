# This file should contain all the record creation needed to seed the database with its default values.
# The data can then be loaded with the rails db:seed command (or created alongside the database with db:setup).
#
# Examples:
#
#   movies = Movie.create([{ name: 'Star Wars' }, { name: 'Lord of the Rings' }])
#   Character.create(name: 'Luke', movie: movies.first)

@parkA = Park.create(parkName:'Volunteer Park', parkWebsite: 'https://www.seattle.gov/parks/find/parks/volunteer-park', parkHours:'6:00AM - 10:00PM', parkAddress:'1247 15th Ave. E, Seattle, WA 98112', lattitude:47.6303158, longitude:-122.316504)
@parkA.create_sport(baseball:1, basketball:0, lacrosse:0, tennis:1, soccer:0, volleyball:0, football:0, frisbee:0, golf:0, cricket:0, track:0)
@parkA.create_nature(hiking:1, biking:1, droneField:0, garden:0, greenhouse:0, camping:0, dogPark:0, lake:0, fishing:0)
@parkA.create_facility(playground:1, picnicShelter:0, picnicArea:1, grill:0, excerciseEquipment:0, stage:0, recycling:0, compost:0, restroom:1, bikeParking:0, parking:1, food:0, boathouse:0, skateBoarding:0, iceSkating:0, tetherball:0)
@parkA.create_park_office(officeAddress:"", officeHours:"", officeEmail:"", officePhone:"", parkHasEntranceFee:false)

@parkB = Park.create(parkName:'Marymoor Park', parkWebsite: 'http://www.kingcounty.gov/services/parks-recreation/parks/parks-and-natural-lands/popular-parks/marymoor.aspx', parkHours:'8:00AM - Dusk', parkAddress:'6046 W Lake Sammamish Parkway NE Redmond, WA 98052', lattitude:47.661706, longitude:-122.1281171)
@parkB.create_sport(baseball:1, basketball:1, lacrosse:1, tennis:1, soccer:1, volleyball:0, football:0, frisbee:0, golf:0, cricket:1, track:0)
@parkB.create_nature(hiking:0, biking:0, droneField:1, garden:1, greenhouse:0, camping:0, dogPark:1, lake:0, fishing:0)
@parkB.create_facility(playground:1, picnicShelter:1, picnicArea:1, grill:0, excerciseEquipment:0, stage:0, recycling:0, compost:0, restroom:1, bikeParking:1, parking:1, food:1, boathouse:1, skateBoarding:0, iceSkating:0, tetherball:0)
@parkB.create_park_office(officeAddress:"", officeHours:"", officeEmail:"", officePhone:"", parkHasEntranceFee:false)

@parkC = Park.create(parkName:'Grass Lawn Community Park', parkWebsite: 'http://www.ci.redmond.wa.us/cms/one.aspx?portalId=169&pageId=4010', parkHours:'6:00AM - 11:00PM', parkAddress:'7031 148 Ave NE, Redmond, WA 98052', lattitude:47.6688246, longitude:-122.145785)
@parkC.create_sport(baseball:1, basketball:1, lacrosse:0, tennis:1, soccer:1, volleyball:0, football:0, frisbee:1, golf:0, cricket:0, track:0)
@parkC.create_nature(hiking:1, biking:0, droneField:0, garden:0, greenhouse:0, camping:0, dogPark:0, lake:0, fishing:0)
@parkC.create_facility(playground:0, picnicShelter:1, picnicArea:1, grill:0, excerciseEquipment:1, stage:0, recycling:0, compost:0, restroom:1, bikeParking:0, parking:1, food:0, boathouse:0, skateBoarding:0, iceSkating:0, tetherball:0)
@parkC.create_park_office(officeAddress:"", officeHours:"", officeEmail:"", officePhone:"", parkHasEntranceFee:false)

@parkD = Park.create(parkName:'Cal Anderson Park', parkWebsite: 'http://www.seattle.gov/parks/find/parks/cal-anderson-park', parkHours:'4:00AM - 11:30PM', parkAddress:'1635 11th Ave, Seattle, WA 98122', lattitude:47.6170151, longitude:-122.3213249)
@parkD.create_sport(baseball:1, basketball:0, lacrosse:0, tennis:1, soccer:1, volleyball:0, football:0, frisbee:0, golf:0, cricket:0, track:0)
@parkD.create_nature(hiking:0, biking:0, droneField:0, garden:1, greenhouse:0, camping:0, dogPark:0, lake:0, fishing:0)
@parkD.create_facility(playground:1, picnicShelter:1, picnicArea:0, grill:0, excerciseEquipment:0, stage:0, recycling:0, compost:0, restroom:1, bikeParking:1, parking:0, food:0, boathouse:0, skateBoarding:0, iceSkating:0, tetherball:0)
@parkD.create_park_office(officeAddress:"", officeHours:"", officeEmail:"", officePhone:"", parkHasEntranceFee:false)

@parkE = Park.create(parkName:'Wapato Park', parkWebsite: 'http://www.metroparkstacoma.org/wapato-park/', parkHours:'Sunrise - Sunset', parkAddress:'6500 S Sheridan Ave, Tacoma, WA 98408', lattitude:47.198294, longitude:-122.4546408)
@parkE.create_sport(baseball:0, basketball:0, lacrosse:0, tennis:0, soccer:0, volleyball:0, football:0, frisbee:0, golf:0, cricket:0, track:0)
@parkE.create_nature(hiking:1, biking:0, droneField:0, garden:1, greenhouse:0, camping:0, dogPark:1, lake:0, fishing:1)
@parkE.create_facility(playground:1, picnicShelter:1, picnicArea:1, grill:1, excerciseEquipment:0, stage:0, recycling:0, compost:0, restroom:1, bikeParking:0, parking:1, food:0, boathouse:1, skateBoarding:0, iceSkating:0, tetherball:0)
@parkE.create_park_office(officeAddress:"", officeHours:"", officeEmail:"", officePhone:"", parkHasEntranceFee:false)

@parkF = Park.create(parkName:'Green Lake Park', parkWebsite: 'http://www.seattle.gov/parks/find/parks/green-lake-park', parkHours:'24 hours', parkAddress:'7201 E Greenlake Dr. N, Seattle, WA 98115', lattitude:47.6802168, longitude:-122.3305128)
@parkF.create_sport(baseball:1, basketball:1, lacrosse:0, tennis:1, soccer:1, volleyball:0, football:0, frisbee:0, golf:0, cricket:0, track:1)
@parkF.create_nature(hiking:0, biking:1, droneField:0, garden:1, greenhouse:0, camping:0, dogPark:0, lake:0, fishing:1)
@parkF.create_facility(playground:1, picnicShelter:1, picnicArea:1, grill:1, excerciseEquipment:0, stage:0, recycling:0, compost:0, restroom:1, bikeParking:0, parking:0, food:0, boathouse:0, skateBoarding:0, iceSkating:0, tetherball:0)
@parkF.create_park_office(officeAddress:"", officeHours:"", officeEmail:"", officePhone:"", parkHasEntranceFee:false)

@parkG = Park.create(parkName:'Juanita Bay Park', parkWebsite: 'http://www.explorekirkland.com/Do/Parks/Juanita_Bay_Park.htm', parkHours:'Sunrise - Sunset', parkAddress:'2201 Market St, Kirkland, WA 98033', lattitude:47.6952207, longitude:-122.2126898)
@parkG.create_sport(baseball:0, basketball:0, lacrosse:0, tennis:0, soccer:0, volleyball:0, football:0, frisbee:0, golf:0, cricket:0, track:0)
@parkG.create_nature(hiking:0, biking:0, droneField:0, garden:0, greenhouse:0, camping:0, dogPark:0, lake:0, fishing:0)
@parkG.create_facility(playground:0, picnicShelter:0, picnicArea:0, grill:0, excerciseEquipment:0, stage:0, recycling:0, compost:0, restroom:0, bikeParking:0, parking:0, food:0, boathouse:0, skateBoarding:0, iceSkating:0, tetherball:0)
@parkG.create_park_office(officeAddress:"", officeHours:"", officeEmail:"", officePhone:"", parkHasEntranceFee:false)

@parkH = Park.create(parkName:'Marina Park', parkWebsite: 'http://www.explorekirkland.com/Do/Parks/Marina_Park.htm', parkHours:'24 hours', parkAddress:'25 Lakeshore Plaza, Kirkland, WA 98033',lattitude:47.6753452, longitude:-122.2098626)
@parkH.create_sport(baseball:0, basketball:0, lacrosse:0, tennis:0, soccer:0, volleyball:0, football:0, frisbee:0, golf:0, cricket:0, track:0)
@parkH.create_nature(hiking:0, biking:0, droneField:0, garden:0, greenhouse:0, camping:0, dogPark:0, lake:0, fishing:0)
@parkH.create_facility(playground:0, picnicShelter:0, picnicArea:0, grill:0, excerciseEquipment:0, stage:0, recycling:0, compost:0, restroom:0, bikeParking:0, parking:0, food:0, boathouse:0, skateBoarding:0, iceSkating:0, tetherball:0)
@parkH.create_park_office(officeAddress:"", officeHours:"", officeEmail:"", officePhone:"", parkHasEntranceFee:false)

@parkI = Park.create(parkName:'Browns Point Lighthouse Park', parkWebsite: 'http://www.metroparkstacoma.org/browns-point-lighthouse-park', parkHours:'Sunrise - Sunset', parkAddress:'201 Tulalip St NE, Tacoma, WA 98422',lattitude:47.3056915, longitude:-122.4453574)	
@parkI.create_sport(baseball:0, basketball:0, lacrosse:0, tennis:0, soccer:0, volleyball:0, football:0, frisbee:0, golf:0, cricket:0, track:0)
@parkI.create_nature(hiking:0, biking:0, droneField:0, garden:0, greenhouse:0, camping:0, dogPark:0, lake:0, fishing:0)
@parkI.create_facility(playground:0, picnicShelter:0, picnicArea:0, grill:0, excerciseEquipment:0, stage:0, recycling:0, compost:0, restroom:0, bikeParking:0, parking:0, food:0, boathouse:0, skateBoarding:0, iceSkating:0, tetherball:0)
@parkI.create_park_office(officeAddress:"", officeHours:"", officeEmail:"", officePhone:"", parkHasEntranceFee:false)
