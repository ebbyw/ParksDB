json.extract! park, :id, :parkname, :parkwebsite, :parkhours, :parkaddress, :created_at, :updated_at, :sport, :nature, :facility
json.url park_url(park, format: :json)
