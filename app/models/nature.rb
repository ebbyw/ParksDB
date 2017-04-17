class Nature < ApplicationRecord
	belongs_to :park, optional: true
end
