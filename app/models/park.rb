class Park < ApplicationRecord
	acts_as_mappable   :default_units => :miles,
	                   :default_formula => :sphere,
	                   :lat_column_name => :lattitude,
	                   :lng_column_name => :longitude
	has_one :nature
	has_one :facility
	has_one :park_office
	has_one :sport

	def self.search (search_params)
		if search_params
			within(6, :origin => search_params).all
		end
	end

	def self.default
		within(6, :origin => "Seattle, WA").all
	end
end
