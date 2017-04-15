class ParksController < ApplicationController
	before_action :set_park, only: [:show, :edit, :update, :destroy]

	# GET /parks
	# GET /parks.json
	def index
		@parks = Park.withinDistanceFromLocation(params[:maxDistance],params[:location])

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

	# GET /parks/1
	# GET /parks/1.json
	def show
	end

	# GET /parks/new
	def new
		@park = Park.new
	end

	# GET /parks/1/edit
	def edit
	end

	# POST /parks
	# POST /parks.json
	def create
		@park = Park.new(park_params)

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
			format.html { redirect_to parks_url, notice: 'Park was successfully destroyed.' }
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
			params.require(:park).permit(:parkName, :parkWebsite, :parkHours, :parkAddress)
		end
end
