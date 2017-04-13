class AddLatAndLongToParks < ActiveRecord::Migration[5.0]
  def change
    add_column :parks, :lattitude, :float
    add_column :parks, :longitude, :float
  end
end
