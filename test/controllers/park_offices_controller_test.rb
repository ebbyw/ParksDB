require 'test_helper'

class ParkOfficesControllerTest < ActionDispatch::IntegrationTest
  setup do
    @park_office = park_offices(:one)
  end

  test "should get index" do
    get park_offices_url
    assert_response :success
  end

  test "should get new" do
    get new_park_office_url
    assert_response :success
  end

  test "should create park_office" do
    assert_difference('ParkOffice.count') do
      post park_offices_url, params: { park_office: { officeAddress: @park_office.officeAddress, officeEmail: @park_office.officeEmail, officeHours: @park_office.officeHours, officePhone: @park_office.officePhone, parkHasEntranceFee: @park_office.parkHasEntranceFee } }
    end

    assert_redirected_to park_office_url(ParkOffice.last)
  end

  test "should show park_office" do
    get park_office_url(@park_office)
    assert_response :success
  end

  test "should get edit" do
    get edit_park_office_url(@park_office)
    assert_response :success
  end

  test "should update park_office" do
    patch park_office_url(@park_office), params: { park_office: { officeAddress: @park_office.officeAddress, officeEmail: @park_office.officeEmail, officeHours: @park_office.officeHours, officePhone: @park_office.officePhone, parkHasEntranceFee: @park_office.parkHasEntranceFee } }
    assert_redirected_to park_office_url(@park_office)
  end

  test "should destroy park_office" do
    assert_difference('ParkOffice.count', -1) do
      delete park_office_url(@park_office)
    end

    assert_redirected_to park_offices_url
  end
end
