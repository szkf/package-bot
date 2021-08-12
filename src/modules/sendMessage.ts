export {}

import { Client, Message, MessageEmbed, MessageReaction, TextChannel } from 'discord.js'

const Discord = require('discord.js')

import sendStatus from './sendStatus'

const sendMessage = async (embed: MessageEmbed, reactions: string[], channel: TextChannel, client: Client) => {
    var returnVal: any = { timedOut: true }

    await channel.send(embed).then(async (message: Message) => {
        return new Promise<void>(async (resolve) => {
            for (var i: number = 0; i < reactions.length; i++) {
                await message.react(reactions[i])
            }

            const inactiveColors: string[] = ['RED', 'ORANGE', 'GOLD', 'YELLOW']
            var timeoutInterval: any

            const inactiveEmbed: MessageEmbed = new Discord.MessageEmbed()
            inactiveEmbed.setColor('YELLOW').setFooter('React to cancel!')

            var messageTimeout = setTimeout(() => {
                var counter: number = 3
                timeoutInterval = setInterval(() => {
                    inactiveEmbed.setColor(inactiveColors[counter])

                    inactiveEmbed.setTitle(`This message will auto-delete in ${counter} seconds because of inactivity!`)
                    message.edit(inactiveEmbed)

                    if (counter == 0) {
                        message.delete()
                        clearInterval(timeoutInterval)
                        resolve()
                    }
                    counter--
                }, 1000)
            }, 10000)

            const resetTimeout = () => {
                clearTimeout(messageTimeout)
                clearInterval(timeoutInterval)
                message.edit(embed)
                messageTimeout = setTimeout(() => {
                    var counter: number = 3
                    timeoutInterval = setInterval(() => {
                        inactiveEmbed.setColor(inactiveColors[counter])

                        inactiveEmbed.setTitle(`This message will auto-delete in ${counter} seconds because of inactivity!`)
                        message.edit(inactiveEmbed)
                        if (counter == 1) {
                            inactiveEmbed.setColor('ORANGE')
                        }
                        if (counter == 0) {
                            message.delete()
                            clearInterval(timeoutInterval)
                            resolve()
                        }
                        counter--
                    }, 1000)
                }, 10000)
            }

            const letters: string[] = ['🇦', '🇧', '🇨', '🇩', '🇪']
            var selectedList: number[] = []

            const reactionAddListner = async (reaction: MessageReaction) => {
                if (reaction.message.id == message.id) {
                    if (letters.includes(reaction.emoji.name) && reactions.includes(reaction.emoji.name)) {
                        resetTimeout()
                        var index: number = letters.indexOf(reaction.emoji.name)
                        selectedList.push(index)
                    }
                    if (reaction.emoji.name == '🗑️') {
                        resetTimeout()
                        if (selectedList.length == 0) {
                            sendStatus('ERROR', channel, 'Select the packages to delete!', { timeout: 5000 })
                        } else {
                            client.removeListener('messageReactionRemove', reactionRemoveListner)
                            client.removeListener('messageReactionAdd', reactionAddListner)
                            message.delete()
                            clearInterval(timeoutInterval)
                            clearTimeout(messageTimeout)
                            returnVal = { action: 'DELETE', selectedList: selectedList }
                            resolve()
                        }
                    }
                }
            }

            const reactionRemoveListner = async (reaction: MessageReaction) => {
                if (reaction.message.id == message.id) {
                    if (letters.includes(reaction.emoji.name) && reactions.includes(reaction.emoji.name)) {
                        resetTimeout()
                        var index: number = letters.indexOf(reaction.emoji.name)
                        selectedList.splice(selectedList.indexOf(index), 1)
                    }
                    if (reaction.emoji.name == '🗑️') {
                        resetTimeout()
                        if (selectedList.length == 0) {
                            sendStatus('ERROR', channel, 'Select the packages to delete!', { timeout: 5000 })
                        } else {
                            client.removeListener('messageReactionAdd', reactionAddListner)
                            client.removeListener('messageReactionRemove', reactionRemoveListner)
                            message.delete()
                            clearInterval(timeoutInterval)
                            clearTimeout(messageTimeout)
                            returnVal = { action: 'DELETE', selectedList: selectedList }
                            resolve()
                        }
                    }
                }
            }

            client.on('messageReactionAdd', reactionAddListner)
            client.on('messageReactionRemove', reactionRemoveListner)
        })
    })

    return returnVal
}

module.exports = sendMessage
export default sendMessage
