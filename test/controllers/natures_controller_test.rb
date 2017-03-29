require 'test_helper'

class NaturesControllerTest < ActionDispatch::IntegrationTest
  setup do
    @nature = natures(:one)
  end

  test "should get index" do
    get natures_url
    assert_response :success
  end

  test "should get new" do
    get new_nature_url
    assert_response :success
  end

  test "should create nature" do
    assert_difference('Nature.count') do
      post natures_url, params: { nature: { biking: @nature.biking, camping: @nature.camping, dogPark: @nature.dogPark, droneField: @nature.droneField, fishing: @nature.fishing, garden: @nature.garden, greenhouse: @nature.greenhouse, hiking: @nature.hiking, lake: @nature.lake } }
    end

    assert_redirected_to nature_url(Nature.last)
  end

  test "should show nature" do
    get nature_url(@nature)
    assert_response :success
  end

  test "should get edit" do
    get edit_nature_url(@nature)
    assert_response :success
  end

  test "should update nature" do
    patch nature_url(@nature), params: { nature: { biking: @nature.biking, camping: @nature.camping, dogPark: @nature.dogPark, droneField: @nature.droneField, fishing: @nature.fishing, garden: @nature.garden, greenhouse: @nature.greenhouse, hiking: @nature.hiking, lake: @nature.lake } }
    assert_redirected_to nature_url(@nature)
  end

  test "should destroy nature" do
    assert_difference('Nature.count', -1) do
      delete nature_url(@nature)
    end

    assert_redirected_to natures_url
  end
end
