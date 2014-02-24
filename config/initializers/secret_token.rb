# Be sure to restart your server when you modify this file.

# Your secret key is used for verifying the integrity of signed cookies.
# If you change this key, all old signed cookies will become invalid!

# Make sure the secret is at least 30 characters and all random,
# no regular words or you'll be exposed to dictionary attacks.
# You can use `rake secret` to generate a secure secret key.

# Make sure your secret_key_base is kept private
# if you're sharing your code publicly.
Reddit::Application.config.secret_key_base = '94737d20306ef8e0580173abc4133bc8db734d2f0ee6f486f3c4a9dbaab0c78d71bf24126481b078c4b4a18aa02ee22de1d09073a0fd96fe96db66aaf87926c5'
