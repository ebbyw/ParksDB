Rails.application.routes.draw do
  resources :facilities
  resources :natures
  resources :sports
  resources :park_offices
  resources :parks
  get 'welcome/index'
  # For details on the DSL available within this file, see http://guides.rubyonrails.org/routing.html
  
  root 'parks#index'
end
