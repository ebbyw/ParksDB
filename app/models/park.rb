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

	accepts_nested_attributes_for :nature, :facility, :park_office, :sport

	def self.findWithParams(params)
		@location = params[:location]
		if(!GoogleGeocoder.geocode(@location).success)
			return nil
		end

		@filteredParks = all
		if params[:sports]
			params[:sports].each do |sport_param|
				@filteredParks = @filteredParks.includes(:sport).where("sports.#{sport_param} > 0").references(:sport)
			end
		end

		if params[:facilities]
			params[:facilities].each do |facility_param|
				@filteredParks = @filteredParks.includes(:facility).where("facilities.#{facility_param} > 0").references(:facility)
			end
		end

		if params[:natures]
			params[:natures].each do |nature_param|
				@filteredParks = @filteredParks.includes(:nature).where("natures.#{nature_param} > 0").references(:nature)
			end
		end

		@maxDistance = params[:maxDistance]
		if(!@maxDistance)
			@maxDistance = 6
		end

		return @filteredParks.within(@maxDistance, origin:@location).all
	end

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
