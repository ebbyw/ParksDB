class CreateParkOffices < ActiveRecord::Migration[5.0]
  def change
    create_table :park_offices do |t|
      t.string :officeAddress
      t.string :officeHours
      t.string :officeEmail
      t.string :officePhone
      t.boolean :parkHasEntranceFee

      t.timestamps
    end
  end
end
