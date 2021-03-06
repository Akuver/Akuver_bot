const { prefix: globalPrefix } = require('../config.json');
const { prefix, level: levelchannel } = require('../util/update');
const Discord = require('discord.js');
const cooldowns = new Discord.Collection();
const profileSchema = require('../schemas/profile-schema');
const currency = require('../features/currency');

module.exports = {
  name: 'message',
  async execute(message) {
    const { guild, member, channel } = message;
    const xpToAdd = Math.floor(Math.random() * 11);
    const coinsToAdd = Math.floor(Math.random() * 6);
    let prefix_guild = globalPrefix;
    if (channel.type !== 'dm') {
      if (!message.author.bot) {
        await addXP(guild.id, member.id, xpToAdd, message);
        await currency.addCoins(guild.id, member.id, coinsToAdd);
        prefix_guild = prefix[guild.id.toString()]
          ? prefix[guild.id.toString()]
          : globalPrefix;
      }
    }
    if (!message.content.startsWith(prefix_guild) || message.author.bot) return;

    const args = message.content.slice(prefix_guild.length).trim().split(/ +/); // trim removes whitespaces from both sides of string
    const commandName = args.shift().toLowerCase();
    const client = message.client;
    if (!client.commands.has(commandName) && channel.name !== 'testing') {
      message.reply(
        `Invalid command. Send ${prefix_guild}help to get a list of all possible commands.`
      );
      return;
    }
    const command = client.commands.get(commandName);
    if (command.guildOnly && message.channel.type === 'dm') {
      message.reply(`I can't execute that command inside DMs!`);
      return;
    }
    if (command.permissions) {
      const authorPerms = message.channel.permissionsFor(message.author);
      if (!authorPerms || !authorPerms.has(command.permissions)) {
        message.reply(`You don't have the permission to do this!`);
        return;
      }
    }
    if (!cooldowns.has(command.name)) {
      cooldowns.set(command.name, new Discord.Collection());
    }
    const now = Date.now();
    const timestamps = cooldowns.get(command.name);
    const cooldownAmount = (command.cooldown || 3) * 1000;
    if (timestamps.has(message.author.id)) {
      const expirationtime = timestamps.get(message.author.id) + cooldownAmount;
      if (now < expirationtime) {
        const timeLeft = (expirationtime - now) / 1000;
        return message.reply(
          `Please wait ${timeLeft.toFixed(
            1
          )} more second(s) before reusing the \`${command.name}\` command.`
        );
      }
    }
    timestamps.set(message.author.id, now);
    setTimeout(() => timestamps.delete(message.author.id), cooldownAmount);
    try {
      if (command.async) await command.execute(message, args);
      else command.execute(message, args);
    } catch (error) {
      console.error(error);
      message.reply('There was an error while trying to execute that command!');
    }
  },
};

const getNeededXP = (level) => level * level * 100;
const addXP = async (guildId, userId, xpToAdd, message) => {
  if (message.author.bot) return;
  try {
    const result = await profileSchema.findOneAndUpdate(
      {
        guildId,
        userId,
      },
      {
        guildId,
        userId,
        $inc: {
          xp: xpToAdd,
        },
      },
      {
        upsert: true, //update+insert
        new: true, // return the updated value; not the old one.
      }
    );
    let { xp, level } = result;
    const needed = getNeededXP(level);
    if (xp >= needed) {
      level++;
      xp -= needed;

      if (levelchannel[guildId.toString()]) {
        const channel = message.guild.channels.cache.get(
          levelchannel[guildId.toString()].toString()
        );
        channel.send(`Congrats <@${userId}> for advancing to level ${level}.`);
      }
      await profileSchema.updateOne(
        {
          guildId,
          userId,
        },
        {
          level,
          xp,
        }
      );
    }
  } catch (err) {
    console.log(err, 'ERROR!');
  }
};
module.exports.addXP = addXP;
