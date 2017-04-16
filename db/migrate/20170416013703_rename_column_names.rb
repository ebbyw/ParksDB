class RenameColumnNames < ActiveRecord::Migration[5.0]
  def change
	rename_column :facilities, :picnicShelter, :picnicshelter
	rename_column :facilities, :picnicArea, :picnicarea
	rename_column :facilities, :excerciseEquipment, :excerciseequipment
	rename_column :facilities, :bikeParking, :bikeparking
	rename_column :facilities, :skateBoarding, :skateboarding
	rename_column :facilities, :iceSkating, :iceskating

	rename_column :natures, :droneField, :dronefield
	rename_column :natures, :dogPark, :dogpark

	rename_column :park_offices, :officeAddress, :officeaddress
	rename_column :park_offices, :officeHours, :officehours
	rename_column :park_offices, :officeEmail, :officeemail
	rename_column :park_offices, :officePhone, :officephone
	rename_column :park_offices, :parkHasEntranceFee, :parkhasentrancefee

	rename_column :parks, :parkName, :parkname
	rename_column :parks, :parkWebsite, :parkwebsite
	rename_column :parks, :parkHours, :parkhours
	rename_column :parks, :parkAddress, :parkaddress
  end
end
