class CreateSports < ActiveRecord::Migration[5.0]
  def change
    create_table :sports do |t|
      t.integer :baseball
      t.integer :basketball
      t.integer :lacrosse
      t.integer :tennis
      t.integer :soccer
      t.integer :volleyball
      t.integer :football
      t.integer :frisbee
      t.integer :golf
      t.integer :cricket
      t.integer :track

      t.timestamps
    end
  end
end
