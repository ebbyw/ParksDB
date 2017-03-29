json.extract! park, :id, :parkName, :parkWebsite, :parkHours, :parkAddress, :created_at, :updated_at
json.url park_url(park, format: :json)
