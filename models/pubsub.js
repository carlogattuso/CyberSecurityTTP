"use strict";
class PubSubManager {
    constructor() {
        this.channels = {
            key: {
                message: '',
                subscribers: []
            }
        };
        this.brokerId = setInterval(() => { this.broker(); }, 1000);
    }
    subscribe(subscriber, channel) {
        console.log("New subscriber");
        console.log({
            subscriber: subscriber.name,
            channel: channel
        });
        this.channels[channel].subscribers.push(subscriber);
    }
    removeBroker() {
        clearInterval(this.brokerId);
    }
    publish(publisher, channel, message) {
        console.log("Message published");
        console.log({
            publisher: publisher.name,
            channel: channel,
            message: message
        });
        this.channels[channel].message = message;
    }
    broker() {
        for (const channel in this.channels) {
            if (this.channels.hasOwnProperty(channel)) {
                const channelObj = this.channels[channel];
                if (channelObj.message) {
                    console.log("New message found:");
                    console.log({
                        channel: channel,
                        message: channelObj.message
                    });
                    channelObj.subscribers.forEach(subscriber => {
                        subscriber.send(JSON.stringify({
                            message: channelObj.message
                        }));
                    });
                    channelObj.message = '';
                }
            }
        }
    }
}
module.exports = PubSubManager;
