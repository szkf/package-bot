export {}

import { Message, MessageEmbed, MessageReaction, TextChannel } from 'discord.js'

const Discord = require('discord.js')

import client from '../PackageBot'
import sendStatus from './sendStatus'

const sendMessage = async (embed: MessageEmbed, reactions: string[], channel: TextChannel, pcgNumList: string[] = []) => {
    var returnVal: any = { timedOut: true }

    await channel.send(embed).then(async (message: Message) => {
        return new Promise<void>(async (resolve) => {
            for (var i: number = 0; i < reactions.length; i++) {
                await message.react(reactions[i])
            }

            var sentTimeoutMessage = false
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

                    sentTimeoutMessage = true

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

                if (sentTimeoutMessage) {
                    message.edit(embed)
                    sentTimeoutMessage = false
                }

                messageTimeout = setTimeout(() => {
                    var counter: number = 3
                    timeoutInterval = setInterval(() => {
                        inactiveEmbed.setColor(inactiveColors[counter])

                        inactiveEmbed.setTitle(`This message will auto-delete in ${counter} seconds because of inactivity!`)
                        message.edit(inactiveEmbed)

                        sentTimeoutMessage = true

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
            var selectedList: string[] = []

            const reactionAddListner = async (reaction: MessageReaction, user: any) => {
                if (reaction.message.id == message.id && reactions.includes(reaction.emoji.name)) {
                    if (letters.includes(reaction.emoji.name)) {
                        resetTimeout()

                        var index: number = letters.indexOf(reaction.emoji.name)
                        selectedList.push(pcgNumList[index])
                    }
                    if (reaction.emoji.name == '🗑️') {
                        resetTimeout()

                        if (selectedList.length == 0) {
                            sendStatus('ERROR', channel, 'Select the packages to delete!', { timeout: 5000 })
                            message.reactions.cache.get('🗑️')!.users.remove(user.id)
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
                    if (reaction.emoji.name == '➡️') {
                        resetTimeout()

                        message.reactions.cache.get('🗑️')!.users.remove(user.id)

                        client.removeListener('messageReactionRemove', reactionRemoveListner)
                        client.removeListener('messageReactionAdd', reactionAddListner)
                        message.delete()
                        clearInterval(timeoutInterval)
                        clearTimeout(messageTimeout)
                        returnVal = { action: 'NEXT-PAGE' }
                        resolve()
                    }
                    if (reaction.emoji.name == '⬅️') {
                        resetTimeout()

                        message.reactions.cache.get('🗑️')!.users.remove(user.id)

                        client.removeListener('messageReactionRemove', reactionRemoveListner)
                        client.removeListener('messageReactionAdd', reactionAddListner)
                        message.delete()
                        clearInterval(timeoutInterval)
                        clearTimeout(messageTimeout)
                        returnVal = { action: 'PREVIOUS-PAGE' }
                        resolve()
                    }
                }
            }

            const reactionRemoveListner = async (reaction: MessageReaction) => {
                if (reaction.message.id == message.id) {
                    if (letters.includes(reaction.emoji.name) && reactions.includes(reaction.emoji.name)) {
                        resetTimeout()

                        var index: number = letters.indexOf(reaction.emoji.name)
                        selectedList.splice(selectedList.indexOf(pcgNumList[index]), 1)
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
