export {}

import { ColorResolvable, Message, MessageEmbed, MessageReaction, TextChannel, User } from 'discord.js'

const Discord = require('discord.js')

import client from '../PackageBot'
import sendStatus from './sendStatus'

const sendMessage = async (
    embed: MessageEmbed,
    reactions: string[],
    channel: TextChannel,
    { pcgNumList = [], deleteOnTimeout = true, infoReturnList = false, editRequireSelected = true }
) => {
    var returnVal: any = { timedOut: true }

    await channel.send({ embeds: [embed] }).then(async (message: Message) => {
        return new Promise<void>(async (resolve) => {
            for (var i: number = 0; i < reactions.length; i++) {
                await message.react(reactions[i])
            }

            var reactionAddListner: any
            var reactionRemoveListner: any

            var sentTimeoutMessage = false
            const inactiveColors: ColorResolvable[] = ['RED', 'ORANGE', 'GOLD', 'YELLOW']
            var timeoutInterval: any

            const inactiveEmbed: MessageEmbed = new Discord.MessageEmbed()
            inactiveEmbed.setColor('YELLOW').setFooter('React to cancel!')

            var messageTimeout = setTimeout(() => {
                var counter: number = 3
                if (deleteOnTimeout == false) {
                    message.reactions.removeAll()
                } else {
                    timeoutInterval = setInterval(async () => {
                        inactiveEmbed.setColor(inactiveColors[counter])

                        inactiveEmbed.setTitle(`This message will auto-delete in ${counter} seconds because of inactivity!`)
                        message.edit({ embeds: [inactiveEmbed] })

                        sentTimeoutMessage = true

                        if (counter == 0) {
                            client.removeListener('messageReactionRemove', reactionRemoveListner)
                            client.removeListener('messageReactionAdd', reactionAddListner)
                            if (message.deletable == true) {
                                await message.delete()
                            }

                            clearInterval(timeoutInterval)
                            resolve()
                        }
                        counter--
                    }, 1000)
                }
            }, 300000)

            const resetTimeout = () => {
                clearTimeout(messageTimeout)
                clearInterval(timeoutInterval)

                if (sentTimeoutMessage) {
                    message.edit({ embeds: [embed] })
                    sentTimeoutMessage = false
                }

                messageTimeout = setTimeout(() => {
                    var counter: number = 3
                    if (deleteOnTimeout == false) {
                        message.reactions.removeAll()
                    } else {
                        timeoutInterval = setInterval(async () => {
                            inactiveEmbed.setColor(inactiveColors[counter])

                            inactiveEmbed.setTitle(`This message will auto-delete in ${counter} seconds because of inactivity!`)
                            message.edit({ embeds: [inactiveEmbed] })

                            sentTimeoutMessage = true

                            if (counter == 0) {
                                client.removeListener('messageReactionRemove', reactionRemoveListner)
                                client.removeListener('messageReactionAdd', reactionAddListner)
                                if (message.deletable == true && deleteOnTimeout == true) {
                                    await message.delete()
                                }

                                clearInterval(timeoutInterval)
                                resolve()
                            }
                            counter--
                        }, 1000)
                    }
                }, 300000)
            }

            const letters: (string | null)[] = ['🇦', '🇧', '🇨', '🇩', '🇪']
            var selectedList: string[] = []

            reactionAddListner = async (reaction: MessageReaction, user: User) => {
                if (client.user.id == user.id) return
                if (reaction.message.id == message.id && reactions.includes(String(reaction.emoji.name))) {
                    if (letters.includes(reaction.emoji.name)) {
                        resetTimeout()

                        var index: number = letters.indexOf(reaction.emoji.name)
                        selectedList.push(pcgNumList[index])
                    }
                    if (reaction.emoji.name == '🗑️') {
                        resetTimeout()

                        if (selectedList.length == 0) {
                            client.removeListener('messageReactionRemove', reactionRemoveListner)
                            client.removeListener('messageReactionAdd', reactionAddListner)
                            clearInterval(timeoutInterval)
                            clearTimeout(messageTimeout)
                            if (message.deletable == true) {
                                await message.delete()
                            }

                            returnVal = { action: 'DELETE-ALL' }
                            resolve()
                        } else {
                            client.removeListener('messageReactionRemove', reactionRemoveListner)
                            client.removeListener('messageReactionAdd', reactionAddListner)
                            clearInterval(timeoutInterval)
                            clearTimeout(messageTimeout)
                            if (message.deletable == true) {
                                await message.delete()
                            }

                            returnVal = { action: 'DELETE', selectedList: selectedList }
                            resolve()
                        }
                    }
                    if (reaction.emoji.name == '➡️') {
                        resetTimeout()

                        client.removeListener('messageReactionRemove', reactionRemoveListner)
                        client.removeListener('messageReactionAdd', reactionAddListner)
                        clearInterval(timeoutInterval)
                        clearTimeout(messageTimeout)
                        if (message.deletable == true) {
                            await message.delete()
                        }

                        returnVal = { action: 'NEXT' }
                        resolve()
                    }
                    if (reaction.emoji.name == '⬅️') {
                        resetTimeout()

                        client.removeListener('messageReactionRemove', reactionRemoveListner)
                        client.removeListener('messageReactionAdd', reactionAddListner)
                        if (message.deletable == true) {
                            await message.delete()
                        }
                        clearInterval(timeoutInterval)
                        clearTimeout(messageTimeout)
                        returnVal = { action: 'PREVIOUS' }
                        resolve()
                    }
                    if (reaction.emoji.name == '✅') {
                        resetTimeout()

                        client.removeListener('messageReactionRemove', reactionRemoveListner)
                        client.removeListener('messageReactionAdd', reactionAddListner)
                        if (message.deletable == true) {
                            await message.delete()
                        }
                        clearInterval(timeoutInterval)
                        clearTimeout(messageTimeout)
                        returnVal = { action: 'CONFIRM' }
                        resolve()
                    }
                    if (reaction.emoji.name == 'ℹ️') {
                        if (infoReturnList == true) {
                            await message.reactions.cache.get('ℹ️')!.users.remove(user.id)
                            if (selectedList.length == 0) {
                                sendStatus('ERROR', channel, "You didn't select any package!", {
                                    footer: 'Select a package first!',
                                    timeout: 5000,
                                })
                            } else {
                                resetTimeout()

                                client.removeListener('messageReactionRemove', reactionRemoveListner)
                                client.removeListener('messageReactionAdd', reactionAddListner)
                                if (message.deletable == true) {
                                    await message.delete()
                                }
                                clearInterval(timeoutInterval)
                                clearTimeout(messageTimeout)
                                returnVal = { action: 'MORE-INFO', selectedList: selectedList }
                                resolve()
                            }
                        } else {
                            resetTimeout()

                            client.removeListener('messageReactionRemove', reactionRemoveListner)
                            client.removeListener('messageReactionAdd', reactionAddListner)
                            if (message.deletable == true) {
                                await message.delete()
                            }
                            clearInterval(timeoutInterval)
                            clearTimeout(messageTimeout)
                            returnVal = { action: 'MORE-INFO' }
                            resolve()
                        }
                    }
                    if (reaction.emoji.name == '❌') {
                        resetTimeout()

                        client.removeListener('messageReactionRemove', reactionRemoveListner)
                        client.removeListener('messageReactionAdd', reactionAddListner)
                        if (message.deletable == true) {
                            await message.delete()
                        }
                        clearInterval(timeoutInterval)
                        clearTimeout(messageTimeout)
                        returnVal = { action: 'CANCEL' }
                        resolve()
                    }
                    if (reaction.emoji.name == '📝') {
                        if (editRequireSelected) {
                            await message.reactions.cache.get('📝')!.users.remove(user.id)
                            if (selectedList.length == 0) {
                                sendStatus('ERROR', channel, "You didn't select any package!", {
                                    footer: 'Select a package first!',
                                    timeout: 5000,
                                })
                            } else if (selectedList.length > 1) {
                                sendStatus('ERROR', channel, 'You can only edit one note at a time!', { timeout: 5000 })
                            } else {
                                resetTimeout()

                                client.removeListener('messageReactionRemove', reactionRemoveListner)
                                client.removeListener('messageReactionAdd', reactionAddListner)
                                if (message.deletable == true) {
                                    await message.delete()
                                }
                                clearInterval(timeoutInterval)
                                clearTimeout(messageTimeout)
                                returnVal = { action: 'EDIT', selectedList: selectedList }
                                resolve()
                            }
                        } else {
                            resetTimeout()

                            client.removeListener('messageReactionRemove', reactionRemoveListner)
                            client.removeListener('messageReactionAdd', reactionAddListner)
                            if (message.deletable == true) {
                                await message.delete()
                            }
                            clearInterval(timeoutInterval)
                            clearTimeout(messageTimeout)
                            returnVal = { action: 'EDIT' }
                            resolve()
                        }
                    }
                    if (reaction.emoji.name == '◀️') {
                        resetTimeout()

                        client.removeListener('messageReactionRemove', reactionRemoveListner)
                        client.removeListener('messageReactionAdd', reactionAddListner)
                        if (message.deletable == true) {
                            await message.delete()
                        }
                        clearInterval(timeoutInterval)
                        clearTimeout(messageTimeout)
                        returnVal = { action: 'BACK' }
                        resolve()
                    }
                    if (reaction.emoji.name == '▶️') {
                        resetTimeout()

                        client.removeListener('messageReactionRemove', reactionRemoveListner)
                        client.removeListener('messageReactionAdd', reactionAddListner)
                        if (message.deletable == true) {
                            await message.delete()
                        }
                        clearInterval(timeoutInterval)
                        clearTimeout(messageTimeout)
                        returnVal = { action: 'FORWARD' }
                        resolve()
                    }
                    if (
                        reaction.emoji.name != null &&
                        reactions.includes(reaction.emoji.name) &&
                        !['🗑️', '➡️', '⬅️', '✅', 'ℹ️', '❌', '📝', '◀️', '▶️'].includes(reaction.emoji.name) &&
                        !letters.includes(reaction.emoji.name)
                    ) {
                        resetTimeout()

                        client.removeListener('messageReactionRemove', reactionRemoveListner)
                        client.removeListener('messageReactionAdd', reactionAddListner)
                        if (message.deletable == true) {
                            await message.delete()
                        }
                        clearInterval(timeoutInterval)
                        clearTimeout(messageTimeout)
                        returnVal = { actionIndx: reactions.indexOf(reaction.emoji.name) }
                        resolve()
                    }
                }
            }

            reactionRemoveListner = async (reaction: MessageReaction, user: User) => {
                if (client.user.id == user.id) return
                if (reaction.message.id == message.id) {
                    if (letters.includes(reaction.emoji.name) && reactions.includes(String(reaction.emoji.name))) {
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
