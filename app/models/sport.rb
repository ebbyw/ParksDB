class Sport < ApplicationRecord
	belongs_to :park, optional: true
end
