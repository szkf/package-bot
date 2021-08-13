import { Message, MessageEmbed, TextChannel } from 'discord.js'
import client from '../PackageBot'
import sendStatus from './sendStatus'

const Discord = require('discord.js')
const { prefix } = require('../../config.json')

const getNote = (channel: TextChannel) => {
    return new Promise((resolve) => {
        const noteEmbed: MessageEmbed = new Discord.MessageEmbed()
        noteEmbed.setColor('BLUE').setTitle('Add a Note!').setDescription(`Type \`${prefix}note <note>\` to add a note!`)

        channel.send(noteEmbed).then((message: Message) => {
            var messageListner: any

            const inactiveEmbed: MessageEmbed = new Discord.MessageEmbed()
            inactiveEmbed.setColor('YELLOW').setFooter('React to cancel!')
            const inactiveColors: string[] = ['RED', 'ORANGE', 'GOLD', 'YELLOW']
            var timeoutInterval: any
            var sentTimeoutMessage: boolean = false

            var messageTimeout = setTimeout(() => {
                var counter: number = 3
                timeoutInterval = setInterval(() => {
                    inactiveEmbed.setColor(inactiveColors[counter])

                    inactiveEmbed.setTitle(`This message will auto-delete in ${counter} seconds because of inactivity!`)
                    message.edit(inactiveEmbed)

                    sentTimeoutMessage = true

                    if (counter == 0) {
                        client.removeListener('message', messageListner)
                        message.delete()
                        clearInterval(timeoutInterval)
                        resolve(undefined)
                    }
                    counter--
                }, 1000)
            }, 30000)

            const resetTimeout = () => {
                clearTimeout(messageTimeout)
                clearInterval(timeoutInterval)

                if (sentTimeoutMessage) {
                    message.edit(noteEmbed)
                    sentTimeoutMessage = false
                }

                messageTimeout = setTimeout(() => {
                    var counter: number = 3
                    timeoutInterval = setInterval(() => {
                        inactiveEmbed.setColor(inactiveColors[counter])

                        inactiveEmbed.setTitle(`This message will auto-delete in ${counter} seconds because of inactivity!`)
                        message.edit(inactiveEmbed)

                        sentTimeoutMessage = true

                        if (counter == 0) {
                            client.removeListener('message', messageListner)
                            message.delete()
                            clearInterval(timeoutInterval)
                            resolve(undefined)
                        }
                        counter--
                    }, 1000)
                }, 30000)
            }

            messageListner = (msg: Message) => {
                if (msg.content.toLowerCase().startsWith(`${prefix}note `)) {
                    resetTimeout()

                    if (msg.content.split(`${prefix}note `)[1] != '' && msg.content.split(`${prefix}note `)[1].length <= 40) {
                        client.removeListener('message', messageListner)
                        message.delete()
                        resolve(msg.content.split(`${prefix}note `)[1])
                    } else {
                        sendStatus(
                            'ERROR',
                            channel,
                            `A note must be at least 1 character long and can't be longer then 40!\nType \`${prefix}note <note>\` to try again.`,
                            { timeout: 5000 }
                        )
                    }
                }
            }

            client.on('message', messageListner)
        })
    })
}

module.exports = getNote
export default getNote
