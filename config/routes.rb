Reddit::Application.routes.draw do
  mount JasmineRails::Engine => '/specs' if defined?(JasmineRails)
  root to: 'static#index'
end
