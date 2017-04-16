# This file should contain all the record creation needed to seed the database with its default values.
# The data can then be loaded with the rails db:seed command (or created alongside the database with db:setup).
#
# Examples:
#
#   movies = Movie.create([{ name: 'Star Wars' }, { name: 'Lord of the Rings' }])
#   Character.create(name: 'Luke', movie: movies.first)

@parkA = Park.create(parkname:'Volunteer Park', parkwebsite: 'https://www.seattle.gov/parks/find/parks/volunteer-park', parkhours:'6:00AM - 10:00PM', parkaddress:'1247 15th Ave. E, Seattle, WA 98112', lattitude:47.6303158, longitude:-122.316504)
@parkA.create_sport(baseball:1, basketball:0, lacrosse:0, tennis:1, soccer:0, volleyball:0, football:0, frisbee:0, golf:0, cricket:0, track:0)
@parkA.create_nature(hiking:1, biking:1, dronefield:0, garden:0, greenhouse:0, camping:0, dogpark:0, lake:0, fishing:0)
@parkA.create_facility(playground:1, picnicshelter:0, picnicarea:1, grill:0, excerciseequipment:0, stage:0, recycling:0, compost:0, restroom:1, bikeparking:0, parking:1, food:0, boathouse:0, skateboarding:0, iceskating:0, tetherball:0)
@parkA.create_park_office(officeaddress:"", officehours:"", officeemail:"", officephone:"(206) 684-4075", parkhasentrancefee:false)

@parkB = Park.create(parkname:'Marymoor Park', parkwebsite: 'http://www.kingcounty.gov/services/parks-recreation/parks/parks-and-natural-lands/popular-parks/marymoor.aspx', parkhours:'8:00AM - Dusk', parkaddress:'6046 W Lake Sammamish Parkway NE Redmond, WA 98052', lattitude:47.661706, longitude:-122.1281171)
@parkB.create_sport(baseball:1, basketball:1, lacrosse:1, tennis:1, soccer:1, volleyball:0, football:0, frisbee:0, golf:0, cricket:1, track:0)
@parkB.create_nature(hiking:0, biking:0, dronefield:1, garden:1, greenhouse:0, camping:0, dogpark:1, lake:0, fishing:0)
@parkB.create_facility(playground:1, picnicshelter:1, picnicarea:1, grill:0, excerciseequipment:0, stage:0, recycling:0, compost:0, restroom:1, bikeparking:1, parking:1, food:1, boathouse:1, skateboarding:0, iceskating:0, tetherball:0)
@parkB.create_park_office(officeaddress:"", officehours:"Monday - Friday: 9:00AM - 4:00PM", officeemail:"marymoorpark@kingcounty.gov", officephone:"(206) 477-7275", parkhasentrancefee:false)

@parkC = Park.create(parkname:'Grass Lawn Community Park', parkwebsite: 'http://www.ci.redmond.wa.us/cms/one.aspx?portalId=169&pageId=4010', parkhours:'6:00AM - 11:00PM', parkaddress:'7031 148 Ave NE, Redmond, WA 98052', lattitude:47.6688246, longitude:-122.145785)
@parkC.create_sport(baseball:1, basketball:1, lacrosse:0, tennis:1, soccer:1, volleyball:0, football:0, frisbee:1, golf:0, cricket:0, track:0)
@parkC.create_nature(hiking:1, biking:0, dronefield:0, garden:0, greenhouse:0, camping:0, dogpark:0, lake:0, fishing:0)
@parkC.create_facility(playground:0, picnicshelter:1, picnicarea:1, grill:0, excerciseequipment:1, stage:0, recycling:0, compost:0, restroom:1, bikeparking:0, parking:1, food:0, boathouse:0, skateboarding:0, iceskating:0, tetherball:0)
@parkC.create_park_office(officeaddress:"", officehours:"", officeemail:"", officephone:"", parkhasentrancefee:false)

@parkD = Park.create(parkname:'Cal Anderson Park', parkwebsite: 'http://www.seattle.gov/parks/find/parks/cal-anderson-park', parkhours:'4:00AM - 11:30PM', parkaddress:'1635 11th Ave, Seattle, WA 98122', lattitude:47.6170151, longitude:-122.3213249)
@parkD.create_sport(baseball:1, basketball:0, lacrosse:0, tennis:1, soccer:1, volleyball:0, football:0, frisbee:0, golf:0, cricket:0, track:0)
@parkD.create_nature(hiking:0, biking:0, dronefield:0, garden:1, greenhouse:0, camping:0, dogpark:0, lake:0, fishing:0)
@parkD.create_facility(playground:1, picnicshelter:1, picnicarea:0, grill:0, excerciseequipment:0, stage:0, recycling:0, compost:0, restroom:1, bikeparking:1, parking:0, food:0, boathouse:0, skateboarding:0, iceskating:0, tetherball:0)
@parkD.create_park_office(officeaddress:"", officehours:"", officeemail:"", officephone:"(206) 684-4075", parkhasentrancefee:false)

@parkE = Park.create(parkname:'Wapato Park', parkwebsite: 'http://www.metroparkstacoma.org/wapato-park/', parkhours:'Sunrise - Sunset', parkaddress:'6500 S Sheridan Ave, Tacoma, WA 98408', lattitude:47.198294, longitude:-122.4546408)
@parkE.create_sport(baseball:0, basketball:0, lacrosse:0, tennis:0, soccer:0, volleyball:0, football:0, frisbee:0, golf:0, cricket:0, track:0)
@parkE.create_nature(hiking:1, biking:0, dronefield:0, garden:1, greenhouse:0, camping:0, dogpark:1, lake:0, fishing:1)
@parkE.create_facility(playground:1, picnicshelter:1, picnicarea:1, grill:1, excerciseequipment:0, stage:0, recycling:0, compost:0, restroom:1, bikeparking:0, parking:1, food:0, boathouse:1, skateboarding:0, iceskating:0, tetherball:0)
@parkE.create_park_office(officeaddress:"4702 S 19th St, Tacoma, WA 98405", officehours:"", officeemail:"", officephone:"(253) 305-1000", parkhasentrancefee:false)

@parkF = Park.create(parkname:'Green Lake Park', parkwebsite: 'http://www.seattle.gov/parks/find/parks/green-lake-park', parkhours:'24 hours', parkaddress:'7201 E Greenlake Dr. N, Seattle, WA 98115', lattitude:47.6802168, longitude:-122.3305128)
@parkF.create_sport(baseball:1, basketball:1, lacrosse:0, tennis:1, soccer:1, volleyball:0, football:0, frisbee:0, golf:0, cricket:0, track:1)
@parkF.create_nature(hiking:0, biking:1, dronefield:0, garden:1, greenhouse:0, camping:0, dogpark:0, lake:0, fishing:1)
@parkF.create_facility(playground:1, picnicshelter:1, picnicarea:1, grill:1, excerciseequipment:0, stage:0, recycling:0, compost:0, restroom:1, bikeparking:0, parking:0, food:0, boathouse:0, skateboarding:0, iceskating:0, tetherball:0)
@parkF.create_park_office(officeaddress:"", officehours:"", officeemail:"", officephone:"(206) 684-4075", parkhasentrancefee:false)

@parkG = Park.create(parkname:'Juanita Bay Park', parkwebsite: 'http://www.explorekirkland.com/Do/Parks/Juanita_Bay_Park.htm', parkhours:'Sunrise - Sunset', parkaddress:'2201 Market St, Kirkland, WA 98033', lattitude:47.6952207, longitude:-122.2126898)
@parkG.create_sport(baseball:0, basketball:0, lacrosse:0, tennis:0, soccer:0, volleyball:0, football:0, frisbee:0, golf:0, cricket:0, track:0)
@parkG.create_nature(hiking:0, biking:0, dronefield:0, garden:0, greenhouse:0, camping:0, dogpark:0, lake:0, fishing:0)
@parkG.create_facility(playground:0, picnicshelter:0, picnicarea:0, grill:0, excerciseequipment:0, stage:0, recycling:0, compost:0, restroom:0, bikeparking:0, parking:0, food:0, boathouse:0, skateboarding:0, iceskating:0, tetherball:0)
@parkG.create_park_office(officeaddress:"", officehours:"", officeemail:"", officephone:"", parkhasentrancefee:false)

@parkH = Park.create(parkname:'Marina Park', parkwebsite: 'http://www.explorekirkland.com/Do/Parks/Marina_Park.htm', parkhours:'24 hours', parkaddress:'25 Lakeshore Plaza, Kirkland, WA 98033',lattitude:47.6753452, longitude:-122.2098626)
@parkH.create_sport(baseball:0, basketball:0, lacrosse:0, tennis:0, soccer:0, volleyball:0, football:0, frisbee:0, golf:0, cricket:0, track:0)
@parkH.create_nature(hiking:0, biking:0, dronefield:0, garden:0, greenhouse:0, camping:0, dogpark:0, lake:0, fishing:0)
@parkH.create_facility(playground:0, picnicshelter:0, picnicarea:0, grill:0, excerciseequipment:0, stage:0, recycling:0, compost:0, restroom:0, bikeparking:0, parking:0, food:0, boathouse:0, skateboarding:0, iceskating:0, tetherball:0)
@parkH.create_park_office(officeaddress:"", officehours:"", officeemail:"", officephone:"", parkhasentrancefee:false)

@parkI = Park.create(parkname:'Browns Point Lighthouse Park', parkwebsite: 'http://www.metroparkstacoma.org/browns-point-lighthouse-park', parkhours:'Sunrise - Sunset', parkaddress:'201 Tulalip St NE, Tacoma, WA 98422',lattitude:47.3056915, longitude:-122.4453574)	
@parkI.create_sport(baseball:0, basketball:0, lacrosse:0, tennis:0, soccer:0, volleyball:0, football:0, frisbee:0, golf:0, cricket:0, track:0)
@parkI.create_nature(hiking:0, biking:0, dronefield:0, garden:0, greenhouse:0, camping:0, dogpark:0, lake:0, fishing:0)
@parkI.create_facility(playground:0, picnicshelter:0, picnicarea:0, grill:0, excerciseequipment:0, stage:0, recycling:0, compost:0, restroom:0, bikeparking:0, parking:0, food:0, boathouse:0, skateboarding:0, iceskating:0, tetherball:0)
@parkI.create_park_office(officeaddress:"", officehours:"", officeemail:"", officephone:"", parkhasentrancefee:false)
