Rails.application.routes.draw do
  devise_for :users
  resources :parks
  get 'admin', to: 'admin#index'
  get 'admin/parks', to: 'admin#allParks'
  get 'welcome', to: 'welcome#index'
  # For details on the DSL available within this file, see http://guides.rubyonrails.org/routing.html
  
  root 'welcome#index'
end
