class ParkOfficesController < ApplicationController
  before_action :set_park_office, only: [:show, :edit, :update, :destroy]

  # GET /park_offices
  # GET /park_offices.json
  def index
    @park_offices = ParkOffice.all
  end

  # GET /park_offices/1
  # GET /park_offices/1.json
  def show
  end

  # GET /park_offices/new
  def new
    @park_office = ParkOffice.new
  end

  # GET /park_offices/1/edit
  def edit
  end

  # POST /park_offices
  # POST /park_offices.json
  def create
    @park_office = ParkOffice.new(park_office_params)

    respond_to do |format|
      if @park_office.save
        format.html { redirect_to @park_office, notice: 'Park office was successfully created.' }
        format.json { render :show, status: :created, location: @park_office }
      else
        format.html { render :new }
        format.json { render json: @park_office.errors, status: :unprocessable_entity }
      end
    end
  end

  # PATCH/PUT /park_offices/1
  # PATCH/PUT /park_offices/1.json
  def update
    respond_to do |format|
      if @park_office.update(park_office_params)
        format.html { redirect_to @park_office, notice: 'Park office was successfully updated.' }
        format.json { render :show, status: :ok, location: @park_office }
      else
        format.html { render :edit }
        format.json { render json: @park_office.errors, status: :unprocessable_entity }
      end
    end
  end

  # DELETE /park_offices/1
  # DELETE /park_offices/1.json
  def destroy
    @park_office.destroy
    respond_to do |format|
      format.html { redirect_to park_offices_url, notice: 'Park office was successfully destroyed.' }
      format.json { head :no_content }
    end
  end

  private
    # Use callbacks to share common setup or constraints between actions.
    def set_park_office
      @park_office = ParkOffice.find(params[:id])
    end

    # Never trust parameters from the scary internet, only allow the white list through.
    def park_office_params
      params.require(:park_office).permit(:officeAddress, :officeHours, :officeEmail, :officePhone, :parkHasEntranceFee)
    end
end
