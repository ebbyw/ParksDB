class Park < ApplicationRecord
	# @parkAddress = StreetAddress::US.parse(self.parkAddress)

	def setCoordinates(latitude,longitude)
		@latitude = latitude
		@longitude = longitude
	end
end
