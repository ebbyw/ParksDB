class CreateParks < ActiveRecord::Migration[5.0]
  def change
    create_table :parks do |t|
      t.string :parkName
      t.string :parkWebsite
      t.string :parkHours
      t.string :parkAddress

      t.timestamps
    end
  end
end
