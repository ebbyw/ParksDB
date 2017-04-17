class Facility < ApplicationRecord
	belongs_to :park, optional: true
end
