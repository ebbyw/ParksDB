class ParkOffice < ApplicationRecord
	belongs_to :park, optional: true
end
