import { MessageEmbed, TextChannel } from 'discord.js'

const Discord = require('discord.js')

export {}

type status = 'SUCCESS' | 'ERROR' | 'WARN'

const sendStatus = async (status: status, channel: TextChannel, message: string, { footer = '', timeout = -1, title = '' }) => {
    const statusEmbed: MessageEmbed = new Discord.MessageEmbed().setColor('RED').setDescription(message)
    if (footer != '') statusEmbed.setFooter(footer)
    if (title != '') statusEmbed.setTitle(title)

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

    if (timeout != -1) {
        channel.send(statusEmbed).then((msg) => {
            setTimeout(() => {
                msg.delete()
            }, timeout)
        })
    } else {
        channel.send(statusEmbed)
    }
}

module.exports = sendStatus
export default sendStatus
