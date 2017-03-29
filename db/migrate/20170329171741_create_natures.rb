class CreateNatures < ActiveRecord::Migration[5.0]
  def change
    create_table :natures do |t|
      t.integer :hiking
      t.integer :biking
      t.integer :droneField
      t.integer :garden
      t.integer :greenhouse
      t.integer :camping
      t.integer :dogPark
      t.integer :lake
      t.integer :fishing

      t.timestamps
    end
  end
end
