# Installing Heroku CLI On Raspberry Pi

In your pi root:

- wget https://cli-assets.heroku.com/branches/stable/heroku-linux-arm.tar.gz
- mkdir -p /usr/local/lib /usr/local/bin
- sudo tar -xvzf heroku-linux-arm.tar.gz -C /usr/local/lib
- sudo ln -s /usr/local/lib/heroku/bin/heroku /usr/local/bin/heroku
- heroku version
