import { Client, GatewayIntentBits } from 'discord.js';
import { JSDOM as DOMParser } from 'jsdom';

import { config } from "dotenv";

import { fetchEventSource } from '@fortaine/fetch-event-source';


// allow reading from a .env file
config({});

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

if (typeof process.env.WHITELIST !== "undefined") {
    process.env.WHITELIST.split(",").forEach((x) => {
        client.whitelist.push(x);
    })

}

client.ignorelist = [];

client.on('ready', async () => {
    console.log(`${client.user.username} is ready!`);

    // register slash commands
    let currCommands = await client.application.commands.fetch();
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
    // TODO: add better registration logic 
    if (currCommands !== [] || typeof currCommands !== "undefined") {
        return
    }
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
    if (!client.whitelist.includes(message.channelId)) return;
    if (client.ignorelist.includes(message.author.id)) return;
    // if the message mentions the bot, or is replying to the bot, then respond with the channel id
    if ((message.mentions.has(client.user.id) || message.reference?.messageID || message.content.toLowerCase().startsWith('echo:')) && !message.system) {
        console.log(message.author.username)
        let msg;
        // if the message contains a link 

        if (message.content.includes("ignore")) {
            client.ignorelist.push(message.mentions.users.first().id);
            return message.reply("User has been successfully ignored. Thanks for the alert.")
        } else if (message.content.includes("unig")) {
            const index = client.ignorelist.indexOf(message.mentions.users.first().id);
            if (index > -1) { // only splice array when item is found
                client.ignorelist.splice(index, 1); // 2nd parameter means remove one item only
                return message.reply("I've successfully unignored the user.")
            }
        }
        if (message.content.includes('nofetch')) {
            msg = `${message.content}`
        } else if (message.content.includes('http')) {

            // get the link
            let link = message.content.match(/(https?:\/\/[^\s]+)/g);
            let content = await fetch(link[0])
            let text = await content.text()
            // get only content parts of the html, exluding scripts and styles

            let txt = '';
            const htmlDoc = new DOMParser(text).window.document;
            for (const element of htmlDoc.querySelectorAll('body')) {
                // if the element is h1, h2, h3, p, li, or a, then add it to the txt variable
                if (element.tagName == 'H1' || element.tagName == 'H2' || element.tagName == 'H3' || element.tagName == 'P' || element.tagName == 'LI' || element.tagName == 'A') {
                    text = text + element.textContent + '\n'
                }
            }

            console.log(text)
            msg = `This is the html for the website : \n${txt} \n ${link[0]} The message was: ${message.content}`
        } else {
            msg = `${message.content}`
        }


        // make the bot start typing

        let lastEdit = Date.now()



        message.channel.sendTyping();
        try {
            const response = await fetchEventSource(`http://localhost:3000/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    "message": msg,
                    conversationId: message.channel.id
                }),
                onmessage(token) {
                    console.log(token)

                }

            });

            const data = await response.json()
            const removeCommasFromStart = str => str.replace(/^,+/, "");

            console.log(data.response)
            // message.reply(removeCommasFromStart(data.response));
        } catch (e) {
            console.log(e)
            message.reply(`Something went wrong, please dont do that again. \n ${e}`)
        }
    }

});

const DISCORD_TOKEN = process.env.DISCORD_TOKEN;

client.login(DISCORD_TOKEN);
