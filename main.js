import { Client, GatewayIntentBits } from 'discord.js';
const client = new Client({
    intents: [
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.Guilds,
    ],
    allowedMentions: {
       parse: [],
       repliedUser: true,
    }

});
client.whitelist = [];

client.on('ready', async () => {
    console.log(`${client.user.username} is ready!`);

    // register slash commands
    const data = [
        {
            name: 'resetcontext',
            description: 'Resets the context of the conversation',
        },
        {
            name: 'channel',
            description: 'whitelist the bot to a single channel',
        }
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
        const w = await fetch(`https://chat.simo.ng/delete`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                conversationId: interaction.channelId
            })
        }
        )
        const data = await w.json()
        const removeCommasFromStart = str => str.replace(/^,+/, "");

        console.log(data.response)
        
        // edit the response to the user
        await interaction.editReply(removeCommasFromStart(data.response));
        
    } else if (interaction.commandName === 'channel') {
        let channel = interaction.channelId;
        client.whitelist.push(channel)
        console.log(channel)
        interaction.reply(`whitelisted channel <#${channel}>`)
    }
})



client.on('messageCreate', async (message) => {
    if (message.author.id == client.user.id) return;
    if(!client.whitelist.includes(message.channelId)) return;
    // if the message mentions the bot, or is replying to the bot, then respond with the channel id
    if ((message.mentions.has(client.user.id) || message.reference?.messageID || message.content.toLowerCase().startsWith('echo:')) && !message.system) {
        console.log(message.author.username)



        let msg = `${message.content}`

        // make the bot start typing

        message.channel.sendTyping();
        const response = await fetch(`https://chat.simo.ng/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                "message": msg,
                conversationId: message.channel.id
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

client.login(DISCORD_TOKEN);
