include Geokit::Geocoders

class Park < ApplicationRecord
	acts_as_mappable   :default_units => :miles,
	                   :default_formula => :sphere,
	                   :lat_column_name => :lattitude,
	                   :lng_column_name => :longitude
	has_one :nature
	has_one :facility
	has_one :park_office
	has_one :sport

	def self.withinDistanceFromLocation(maxDistance, location)
		if(!maxDistance)
			maxDistance = 6
		end
		if(!GoogleGeocoder.geocode(location).success)
			return nil
		end
		within(maxDistance, :origin => location).all
	end
end
