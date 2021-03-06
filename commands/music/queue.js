module.exports = {
  name: 'queue',
  description: 'See the next songs',
  usage: ' ',
  category: 'Music',
  guildOnly: true,
  cooldown: 5,
  execute(message, args) {
    const { client, channel } = message;
    if (!message.member.voice.channel)
      return channel.send("You're not in a voice channel!");
    if (
      message.guild.me.voice.channel &&
      message.member.voice.channel.id !== message.guild.me.voice.channel.id
    )
      return channel.send("You're not in the same voice channel!");
    const queue = client.player.getQueue(message);

    if (!client.player.getQueue(message))
      return channel.send(`No songs currently playing!`);

    channel.send(
      `**Server queue - ${message.guild.name} ${
        client.player.getQueue(message).loopMode ? '(looped)' : ''
      }**\nCurrent : ${queue.playing.title} | ${queue.playing.author}\n\n` +
        (queue.tracks
          .map((track, i) => {
            return `**#${i + 1}** - ${track.title} | ${
              track.author
            } (requested by : ${track.requestedBy.username})`;
          })
          .slice(0, 5)
          .join('\n') +
          `\n\n${
            queue.tracks.length > 5
              ? `And **${queue.tracks.length - 5}** other songs...`
              : `In the playlist **${queue.tracks.length}** song(s)...`
          }`)
    );
  },
};
