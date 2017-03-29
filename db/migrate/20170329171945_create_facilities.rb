class CreateFacilities < ActiveRecord::Migration[5.0]
  def change
    create_table :facilities do |t|
      t.integer :playground
      t.integer :picnicShelter
      t.integer :picnicArea
      t.integer :grill
      t.integer :excerciseEquipment
      t.integer :stage
      t.integer :recycling
      t.integer :compost
      t.integer :restroom
      t.integer :bikeParking
      t.integer :parking
      t.integer :food
      t.integer :boathouse
      t.integer :skateBoarding
      t.integer :iceSkating
      t.integer :tetherball

      t.timestamps
    end
  end
end
