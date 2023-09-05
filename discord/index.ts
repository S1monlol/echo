import { Client, GatewayIntentBits } from "discord.js";
import { JSDOM as DOMParser } from "jsdom";
import { config } from "dotenv";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

import OpenAI from "openai";

// allow reading from a .env file
config({});

const openai = new OpenAI({ apiKey: process.env.OPENAI });

const client = new Client({
	intents: [
		GatewayIntentBits.MessageContent,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.Guilds,
	],
	allowedMentions: {
		parse: [],
		repliedUser: true,
	},
});

const getWebContent = async (message: any) => {
	let link = message.content.match(/(https?:\/\/[^\s]+)/g);
	let content = await fetch(link![0]);
	let text = await content.text();
	// get only content parts of the html, exluding scripts and styles

	let txt = "";
	const htmlDoc = new DOMParser(text).window.document;
	for (const element of htmlDoc.querySelectorAll("body")) {
		// if the element is h1, h2, h3, p, li, or a, then add it to the txt variable
		if (
			element.tagName == "H1" ||
			element.tagName == "H2" ||
			element.tagName == "H3" ||
			element.tagName == "P" ||
			element.tagName == "LI" ||
			element.tagName == "A"
		) {
			text = text + element.textContent + "\n";
		}
	}

	console.log(text);
	return `This is the html for the website provided : \n${txt} \n ${
		link![0]
	} Message : ${message.content}`;
};

const getContext = async (serverId: string) => {
	// get messages from the prisma server
	const messages = await prisma.message.findMany({
		where: {
			serverId: serverId,
		},
	});

	const formatedMessages = messages.map((message) => {
		return { role: message.role, content: message.content };
	});

	return formatedMessages;
};

const getPrompt = async (serverId: string) => {
	const prompt = await prisma.server.findMany({
		where: {
			id: serverId,
		},
	});
	return prompt[0].initialPrompt;
}

const getRoles = async (serverId: string) => {
	const roles = await prisma.server.findMany({
		where: {
			id: serverId,
		},
	});

	return roles[0].roles;
}

client.on("ready", async () => {
	if (!client.application || !client.user) return;

	console.log(`${client.user.username} is ready!`);

	const servers = await client.guilds.fetch();

	for (const server of servers) {
		const serverId = server[0];
		const context = await prisma.server.upsert({
			where: {
				id: serverId,
			},
			create: {
				id: serverId,
			},
			update: {},
		});
	}

	// register slash commands
	let currCommands = await client.application.commands.fetch();
	const data = [
		{
			name: "ping",
			description: "Responds Pong!",
		},
	];

	const commands = await client.application?.commands.set(data);

	
});

// discord slash command handler
client.on("interactionCreate", async (interaction) => {
	if (!interaction.isCommand()) return;

	switch (interaction.commandName) {
		case "ping":
			await interaction.reply("Pong!");
			break;
	}
});

client.on("messageCreate", async (message) => {
	if (!client.user) return;
	if (message.author.id == client.user.id) return;
	// if (!client.whitelist.includes(message.channelId)) return;
	// if (client.ignorelist.includes(message.author.id)) return;
	if (
		!(
			message.mentions.has(client.user.id) ||
			// @ts-ignore
			message.reference?.messageID ||
			message.content.toLowerCase().startsWith("echo:")
		) &&
		!message.system
	)
		return;
	console.log(message.author.displayName);

	// @ts-ignore
	let msg = `{ authorName : ${message.author.displayName}, channelName : ${message.channel.name}, serverName : ${message.guild?.name}} \n (${message.author.id}) : ${message.content}`;

	if (
		!message.content.includes("nofetch") &&
		message.content.includes("http")
	) {
		msg = await getWebContent(message);
	}

	// make the bot start typing
	message.channel.sendTyping();

	const serverId = message.guildId;

	const prevContext = await getContext(serverId as string);

	const roles = await getRoles(serverId as string);

	const initialPrompt = await getPrompt(serverId as string) + `Member Roles : ${roles}`

	// @ts-ignore
	// const initialPrompt = `You are the AI assistent of the starship, named Echo. If a memember asks you something you cant answer because you're an ai, just make something up. The messages you recieve will start with information about the message, then the author's name in parentheses, then the content. Try not to be too open ended, just respond to the user's message, ie dont say anything along the lines of "Is there anything else I can help you with?". Do not start with "Hello {username}!" every time, its unnatural. Respond with only your response, do not include anything like echo:`;

	console.log(msg, initialPrompt);

	let context = [
		{ role: "system", content: initialPrompt },
		{ role: "user", content: msg },
	];

	context.splice(1, 0, ...prevContext);

	const completion = await openai.chat.completions.create({
		// @ts-ignore
		messages: context,
		model: "gpt-3.5-turbo",
	});

	console.log(completion.choices[0].message.content);

	try {
		message.reply(completion.choices[0].message.content as string);

		// save the message to the database
		await prisma.message.create({
			data: {
				content: msg,
				role: "user",
				server: {
					connect: {
						id: serverId as string,
					},
				},
			},
		});

		await prisma.message.create({
			data: {
				content: completion.choices[0].message.content as string,
				role: "assistant",
				server: {
					connect: {
						id: serverId as string,
					},
				},
			},
		});
	} catch (e) {
		console.log(e);
		message.reply(
			`Something went wrong, please dont do that again. \n ${e}`
		);
	}
});

const DISCORD_TOKEN = process.env.DISCORD;

client.login(DISCORD_TOKEN)