class AdminController < ApplicationController
	layout 'admin_lte_2'
	protect_from_forgery with: :exception
	before_action :authenticate_user!

	def allParks
		@parks = Park.all
	end
end
