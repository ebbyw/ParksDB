class AddParkId < ActiveRecord::Migration[5.0]
  def change
  	add_column :sports, :park_id, :integer
  	add_column :natures, :park_id, :integer
  	add_column :facilities, :park_id, :integer
  	add_column :park_offices, :park_id, :integer
  end
end