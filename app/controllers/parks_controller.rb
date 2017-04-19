class ParksController < ApplicationController
	before_action :set_park, only: [:show, :show_admin, :edit, :update, :destroy]
	before_action :authenticate_user!, only: [:show_admin, :new, :edit, :create, :update, :destroy]

	# GET /parks
	# GET /parks.json
	def index
		@parks = Park.findWithParams(params)

		if params[:sports]
				@sportsParams = Array.new
				params[:sports].each do |sport| 
					@sportsParams.push(sport)
				end
		end
		if params[:facilities]
				@facilitiesParams = Array.new
				params[:facilities].each do |facility| 
					@facilitiesParams.push(facility)
				end
		end
		if params[:natures]
				@naturesParams = Array.new
				params[:natures].each do |nature| 
					@naturesParams.push(nature)
				end
		end
	end

	# GET admin/parks/1
	# GET admin/parks/1.json
	def show_admin
		render layout: "admin_lte_2" #stays at the end of this method
	end

	# GET /parks/1
	# GET /parks/1.json
	def show
	end

	# GET /parks/new
	def new
		@park = Park.new
		@park.build_park_office
		@park.build_sport
		@park.build_facility
		@park.build_nature
		render layout: "admin_lte_2" #stays at the end of this method
	end

	# GET /parks/1/edit
	def edit
		render layout: "admin_lte_2" #stays at the end of this method
	end

	# POST /parks
	# POST /parks.json
	def create
		@park = Park.new(park_params)
		coordinate = GoogleGeocoder.geocode(park_params[:parkaddress])
		@park.lattitude = coordinate.lat
		@park.longitude = coordinate.lng

		respond_to do |format|
			if @park.save
				format.html { redirect_to @park, notice: 'Park was successfully created.' }
				format.json { render :show, status: :created, location: @park }
			else
				format.html { render :new }
				format.json { render json: @park.errors, status: :unprocessable_entity }
			end
		end
	end

	# PATCH/PUT /parks/1
	# PATCH/PUT /parks/1.json
	def update
		coordinate = GoogleGeocoder.geocode(park_params[:parkaddress])
		@park.lattitude = coordinate.lat
		@park.longitude = coordinate.lng

		respond_to do |format|
			if @park.update(park_params)
				format.html { redirect_to @park, notice: 'Park was successfully updated.' }
				format.json { render :show, status: :ok, location: @park }
			else
				format.html { render :edit }
				format.json { render json: @park.errors, status: :unprocessable_entity }
			end
		end
	end

	# DELETE /parks/1
	# DELETE /parks/1.json
	def destroy
		@park.destroy
		respond_to do |format|
			format.html { redirect_to admin_parks_path, notice: 'Park was successfully destroyed.' }
			format.json { head :no_content }
		end
	end

	private
		# Use callbacks to share common setup or constraints between actions.
		def set_park
			@park = Park.find(params[:id])
		end

		# Never trust parameters from the scary internet, only allow the white list through.
		def park_params
			params.require(:park).permit(:parkname, :parkwebsite, :parkhours, :parkaddress,
				park_office_attributes: [:officeaddress, :officehours, :officeemail, :officephone, :parkhasentrancefee], 
				sport_attributes: [:baseball, :basketball, :lacrosse, :tennis, :soccer, :volleyball, :football, :frisbee, :golf, :cricket, :track], 
				nature_attributes: [:hiking, :biking, :dronefield, :garden, :greenhouse, :camping, :dogpark, :lake, :fishing], 
				facility_attributes: [:playground, :picnicshelter, :picnicarea, :grill, :excerciseequipment, :stage, :recycling, :compost, :restroom, :bikeparking, :parking, :food, :boathouse, :skateboarding, :iceskating, :tetherball])
		end
end
