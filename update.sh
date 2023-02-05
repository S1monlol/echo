#!/bin/bash

docker stop discord-bot-echo
docker rm discord-bot-echo

git pull

docker build . -t discord-bot-echo

docker run -d --name discord-bot-echo --restart always --env-file .env discord-bot-echo
docker logs -f discord-bot-echo