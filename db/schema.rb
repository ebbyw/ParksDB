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

ActiveRecord::Schema.define(version: 20170416013703) do

  # These are extensions that must be enabled in order to support this database
  enable_extension "plpgsql"

  create_table "facilities", force: :cascade do |t|
    t.integer  "playground"
    t.integer  "picnicshelter"
    t.integer  "picnicarea"
    t.integer  "grill"
    t.integer  "excerciseequipment"
    t.integer  "stage"
    t.integer  "recycling"
    t.integer  "compost"
    t.integer  "restroom"
    t.integer  "bikeparking"
    t.integer  "parking"
    t.integer  "food"
    t.integer  "boathouse"
    t.integer  "skateboarding"
    t.integer  "iceskating"
    t.integer  "tetherball"
    t.datetime "created_at",         null: false
    t.datetime "updated_at",         null: false
    t.integer  "park_id"
  end

  create_table "natures", force: :cascade do |t|
    t.integer  "hiking"
    t.integer  "biking"
    t.integer  "dronefield"
    t.integer  "garden"
    t.integer  "greenhouse"
    t.integer  "camping"
    t.integer  "dogpark"
    t.integer  "lake"
    t.integer  "fishing"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.integer  "park_id"
  end

  create_table "park_offices", force: :cascade do |t|
    t.string   "officeaddress"
    t.string   "officehours"
    t.string   "officeemail"
    t.string   "officephone"
    t.boolean  "parkhasentrancefee"
    t.datetime "created_at",         null: false
    t.datetime "updated_at",         null: false
    t.integer  "park_id"
  end

  create_table "parks", force: :cascade do |t|
    t.string   "parkname"
    t.string   "parkwebsite"
    t.string   "parkhours"
    t.string   "parkaddress"
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
