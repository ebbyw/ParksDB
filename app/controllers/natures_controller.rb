class NaturesController < ApplicationController
  before_action :set_nature, only: [:show, :edit, :update, :destroy]

  # GET /natures
  # GET /natures.json
  def index
    @natures = Nature.all
  end

  # GET /natures/1
  # GET /natures/1.json
  def show
  end

  # GET /natures/new
  def new
    @nature = Nature.new
  end

  # GET /natures/1/edit
  def edit
  end

  # POST /natures
  # POST /natures.json
  def create
    @nature = Nature.new(nature_params)

    respond_to do |format|
      if @nature.save
        format.html { redirect_to @nature, notice: 'Nature was successfully created.' }
        format.json { render :show, status: :created, location: @nature }
      else
        format.html { render :new }
        format.json { render json: @nature.errors, status: :unprocessable_entity }
      end
    end
  end

  # PATCH/PUT /natures/1
  # PATCH/PUT /natures/1.json
  def update
    respond_to do |format|
      if @nature.update(nature_params)
        format.html { redirect_to @nature, notice: 'Nature was successfully updated.' }
        format.json { render :show, status: :ok, location: @nature }
      else
        format.html { render :edit }
        format.json { render json: @nature.errors, status: :unprocessable_entity }
      end
    end
  end

  # DELETE /natures/1
  # DELETE /natures/1.json
  def destroy
    @nature.destroy
    respond_to do |format|
      format.html { redirect_to natures_url, notice: 'Nature was successfully destroyed.' }
      format.json { head :no_content }
    end
  end

  private
    # Use callbacks to share common setup or constraints between actions.
    def set_nature
      @nature = Nature.find(params[:id])
    end

    # Never trust parameters from the scary internet, only allow the white list through.
    def nature_params
      params.require(:nature).permit(:hiking, :biking, :droneField, :garden, :greenhouse, :camping, :dogPark, :lake, :fishing)
    end
end
