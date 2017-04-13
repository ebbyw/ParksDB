class Park < ApplicationRecord
	acts_as_mappable   :default_units => :miles,
	                   :default_formula => :sphere,
	                   :lat_column_name => :lattitude,
	                   :lng_column_name => :longitude

	def self.search (search_params)
		if search_params
			within(5, :origin => search_params).all
		else
			find(:all)
		end
	end
end
