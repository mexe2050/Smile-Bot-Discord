module.exports = {
    name: 'messageCreate',
    execute(message) {
        if (message.author.bot) return;
        
        // You can add custom message handling logic here
        console.log(`Received message: ${message.content}`);
    },
};