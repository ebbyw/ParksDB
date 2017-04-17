Rails.application.routes.draw do
  devise_for :users
  resources :parks
  get 'admin', to: 'admin#index'
  get 'admin/parks', to: 'admin#allParks'
  get 'welcome', to: 'welcome#index'
  get 'admin/parks/:id', to: 'parks#show_admin', as: "admin_park"
  # For details on the DSL available within this file, see http://guides.rubyonrails.org/routing.html
  
  root 'welcome#index'
end
