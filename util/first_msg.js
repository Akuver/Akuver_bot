const addReactions = (message, reactions) => {
  message.react(reactions[0]);
  reactions.shift();
  if (reactions.length > 0) {
    setTimeout(() => addReactions(message, reactions), 500);
  }
};

module.exports = async (client, id, text, reactions = []) => {
  if (!id) return;
  const channel = await client.channels.fetch(id);
  channel.messages.fetch().then((messages) => {
    if (messages.size === 0) {
      // no first msg, so send one
      channel.send(text).then((message) => {
        if (reactions.length) addReactions(message, reactions);
      });
    } else {
      for (const message of messages) {
        message[1].edit(text);
        if (reactions.length) addReactions(message[1], reactions);
      }
    }
  });
};
