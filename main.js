import { Client, GatewayIntentBits } from 'discord.js';
const client = new Client({
    intents: [
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.Guilds,

    ]
});


client.on('ready', async () => {
    console.log(`${client.user.username} is ready!`);

    // register slash commands
    const data = [
        {
            name: 'resetcontext',
            description: 'Resets the context of the conversation',
        },
    ];

    const commands = await client.application?.commands.set(data);
    console.log(commands);
});

    




// discord slash command for reseting context 
client.on('interactionCreate', async (interaction) => {
    if (!interaction.isCommand()) return;
    if (interaction.commandName === 'resetcontext') {
        console.log(interaction.channelId)
        // respond with a deffered response, so the user knows the bot is thinking
        await interaction.deferReply();
        const w = await fetch(`https://chatgpt.pawan.krd/ask`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                "key": OPEN_API_KEY,
                "prompt": "Please forget everything you know from this conversation, and restart with no context",
                id: interaction.channelId
            })
        }
        )
        const data = await w.json()
        const removeCommasFromStart = str => str.replace(/^,+/, "");

        console.log(data.response)
        
        // edit the response to the user
        await interaction.editReply(removeCommasFromStart(data.response));
        
    }
})



client.on('messageCreate', async (message) => {
    if (message.author.id == client.user.id) return;
    // if the message mentions the bot, or is replying to the bot, then respond with the channel id
    if ((message.mentions.has(client.user.id) || message.reference?.messageID) & !message.system) {
        console.log(message.author.username)
        let msg = `
            Respond Conversationally, the name of the person is bellow, the message is next to it. You dont need to say the name of the peson, but you can if it makes sense to, ie if they ask you what their name is.
            ${message.author.username}: ${message.content}
            Echo: 
            `

        // make the bot start typing

        message.channel.sendTyping();
        const response = await fetch(`https://chatgpt.pawan.krd/ask`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                "key": OPEN_API_KEY,
                "prompt": msg,
                id: message.channel.id
            })
        }
        )
        const data = await response.json()
        const removeCommasFromStart = str => str.replace(/^,+/, "");

        console.log(data.response)
        message.reply(removeCommasFromStart(data.response));
    }
});


const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const OPEN_API_KEY = process.env.OPEN_API_KEY;


let response = await fetch(`https://chatgpt.pawan.krd/init`, {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({
        "key": OPEN_API_KEY,
        "options": {
            "instructions": "You are Echo, a large language model, that is the AI assistant of a starship. You are talking to its crew, your purpose is to educate them about humanity as they travel the stars, and provide psychological support for all of the crew. This includes indulging in conversations with the crew, responding with clever but concise responses whenever possible."
        }
    })
}
)

response = await response.json()
console.log(response)
console.log(OPEN_API_KEY)


client.login(DISCORD_TOKEN);
