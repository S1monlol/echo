# Current Not Working !! 
The openai api that I used to make this is down for good, it needs to be switched to the official api

# Echo - An AI Assistant for your Discord Starship 

Echo is designed to be an AI assistant for a made-up spaceship, providing education about humanity and psychological support for the crew.


## Getting Started

To use Echo, you will need to have a Discord Bot account and it's token. You will also need an API key for the OpenAI GPT-3 API (https://platform.openai.com/account/api-keys). Once you have these, you can clone this repository and install the dependencies using npm:

$ git clone https://github.com/S1monlol/echo.git \
$ cd echo \
$ docker build . -t echo

Next, you will need to create a .env file in the root directory of the project with the following contents:

DISCORD_TOKEN=[your-discord-token] \
OPEN_API_KEY=[your-openai-api-key]

Finally, you can start the bot by running the following command:

$ docker run --env-file .env echo 


## Usage

Echo will respond to any message that mentions the bot or is a reply to a message sent by the bot. The bot's response will be generated based on the context of the conversation.

## Features

- The bot is powered by OpenAI's GPT-3 language model, providing a conversational AI experience for the crew of the spaceship.
- The bot is designed to educate the crew about humanity and provide psychological support.
- The bot can be reset at any time by using the `resetcontext` slash command.

## Contributing

If you would like to contribute to the development of Echo, please feel free to submit a pull request. All contributions are welcome!

## License

This project is licensed under the MIT License 
