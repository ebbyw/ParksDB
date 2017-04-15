# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# Note that this schema.rb definition is the authoritative source for your
# database schema. If you need to create the application database on another
# system, you should be using db:schema:load, not running all the migrations
# from scratch. The latter is a flawed and unsustainable approach (the more migrations
# you'll amass, the slower it'll run and the greater likelihood for issues).
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema.define(version: 20170415210234) do

  # These are extensions that must be enabled in order to support this database
  enable_extension "plpgsql"

  create_table "facilities", force: :cascade do |t|
    t.integer  "playground"
    t.integer  "picnicShelter"
    t.integer  "picnicArea"
    t.integer  "grill"
    t.integer  "excerciseEquipment"
    t.integer  "stage"
    t.integer  "recycling"
    t.integer  "compost"
    t.integer  "restroom"
    t.integer  "bikeParking"
    t.integer  "parking"
    t.integer  "food"
    t.integer  "boathouse"
    t.integer  "skateBoarding"
    t.integer  "iceSkating"
    t.integer  "tetherball"
    t.datetime "created_at",         null: false
    t.datetime "updated_at",         null: false
    t.integer  "park_id"
  end

  create_table "natures", force: :cascade do |t|
    t.integer  "hiking"
    t.integer  "biking"
    t.integer  "droneField"
    t.integer  "garden"
    t.integer  "greenhouse"
    t.integer  "camping"
    t.integer  "dogPark"
    t.integer  "lake"
    t.integer  "fishing"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.integer  "park_id"
  end

  create_table "park_offices", force: :cascade do |t|
    t.string   "officeAddress"
    t.string   "officeHours"
    t.string   "officeEmail"
    t.string   "officePhone"
    t.boolean  "parkHasEntranceFee"
    t.datetime "created_at",         null: false
    t.datetime "updated_at",         null: false
    t.integer  "park_id"
  end

  create_table "parks", force: :cascade do |t|
    t.string   "parkName"
    t.string   "parkWebsite"
    t.string   "parkHours"
    t.string   "parkAddress"
    t.datetime "created_at",  null: false
    t.datetime "updated_at",  null: false
    t.float    "lattitude"
    t.float    "longitude"
  end

  create_table "sports", force: :cascade do |t|
    t.integer  "baseball"
    t.integer  "basketball"
    t.integer  "lacrosse"
    t.integer  "tennis"
    t.integer  "soccer"
    t.integer  "volleyball"
    t.integer  "football"
    t.integer  "frisbee"
    t.integer  "golf"
    t.integer  "cricket"
    t.integer  "track"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.integer  "park_id"
  end

end
