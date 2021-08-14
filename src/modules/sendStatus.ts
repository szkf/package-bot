import { MessageEmbed, TextChannel } from 'discord.js'

const Discord = require('discord.js')

export {}

type status = 'SUCCESS' | 'ERROR' | 'WARN'

const sendStatus = async (
    status: status,
    channel: TextChannel,
    message: string,
    { footer = '', timeout = -1, title = '' }
): Promise<void> => {
    return new Promise((resolve) => {
        const statusEmbed: MessageEmbed = new Discord.MessageEmbed().setDescription(message)
        if (footer != '') statusEmbed.setFooter(footer)

        switch (status) {
            case 'SUCCESS':
                statusEmbed.setColor('GREEN').setTitle('Success!')
                break
            case 'WARN':
                statusEmbed.setColor('YELLOW')
                break
            case 'ERROR':
                statusEmbed.setColor('RED').setTitle('Error!')
                break
        }

        if (title != '') statusEmbed.setTitle(title)

        if (timeout != -1) {
            channel.send(statusEmbed).then((msg) => {
                setTimeout(async () => {
                    if (msg.deletable) {
                        await msg.delete()
                    }

                    resolve()
                }, timeout)
            })
        } else {
            channel.send(statusEmbed)
        }
    })
}

module.exports = sendStatus
export default sendStatus
