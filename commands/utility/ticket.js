const { ticket } = require('../../util/update');
const check = '✅';
let registered = false;

const registerEvent = (client, channelID) => {
  if (registered) {
    return;
  }
  registered = true;
  console.log('REGISTERING EVENTS');

  client.on('messageReactionAdd', (reaction, user) => {
    if (user.bot) {
      return;
    }
    console.log('HANDLE REACTION');
    const { message } = reaction;
    if (message.channel.id === channelID) {
      message.delete();
    }
  });
};

module.exports = {
  name: 'ticket',
  description: 'Issue a ticket for some problem.',
  usage: ' message ',
  category: 'Utility',
  guildOnly: true,
  execute(message, args) {
    const { guild, member, client } = message;
    if (!ticket[guild.id.toString()])
      return message.reply(
        'Ticket channel is not set in this server! Ask Admin to set one.'
      );
    const channelId = ticket[guild.id.toString()];
    registerEvent(client, channelId);
    const channel = guild.channels.cache.get(channelId);
    const text = args.join(' ');
    channel
      .send(
        `A new ticket has been created by <@${member.id}>\n"${text}"\nClick the ${check} icon when this issue is resolved.`
      )
      .then((ticketMessage) => {
        ticketMessage.react(check);
        message.reply(
          'Your ticket has been sent! Expect a reply within 24 hours.'
        );
      })
      .catch((err) => {
        console.log(err.message);
        throw err;
      });
  },
};
