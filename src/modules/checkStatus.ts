import { Message, MessageEmbed, TextChannel } from 'discord.js'
import deletePackage from './deletePackage'
import { PackageInterface } from './packageClass'

const Discord = require('discord.js')
const getPackage = require('./getPackage')
const updatePackage = require('./updatePackage')
const { prefix } = require('../../config.json')

const checkStatus = async (message: Message) => {
    var i = 0

    var channel: TextChannel = message.guild!.channels.cache.find((channel) => channel.name === 'package-bot') as TextChannel

    setInterval(async () => {
        var packageList: PackageInterface[] = await getPackage()

        if (packageList.length > 0) {
            while (packageList[i].deleted) {
                deletePackage([packageList[i].packageNum], false)
                packageList.splice(i, 1)

                if (i >= packageList.length) {
                    i = 0
                }

                if (packageList.length == 0) {
                    break
                }
            }

            if (packageList.length > 0) {
                var pcg = packageList[i]
                var lastStatus = pcg.status
                var currentStatus = await pcg.getCurrentStatus()

                var changeAmount: number = currentStatus.length - lastStatus.length

                if (changeAmount > 0) {
                    await updatePackage(pcg.packageNum, currentStatus)

                    const statusChangeEmbed: MessageEmbed = new Discord.MessageEmbed()
                    statusChangeEmbed
                        .setTitle('A Package in Your Tracking List Has Changed Status!')
                        .setDescription(`Type \`${prefix}track to view details about this package!\``)
                        .addField(`${pcg.courier.toUpperCase()} Package Number ${pcg.packageNum.toUpperCase()}`, pcg.note, false)
                        .setColor('GREEN')

                    var attachment

                    if (changeAmount == 4) {
                        if (currentStatus[2].includes('doręczona') || currentStatus[2].includes('delivered')) {
                            attachment = new Discord.MessageAttachment('../assets/PackageDelivered.png', 'PackageDelivered.png')

                            statusChangeEmbed.setTitle('A Package in Your Tracking List Has Been Delivered!')
                            statusChangeEmbed.setThumbnail('attachment://PackageDelivered.png')
                        }
                        statusChangeEmbed.addFields(
                            {
                                name: 'Date:',
                                value: currentStatus[0] + ' ' + currentStatus[1],
                                inline: true,
                            },
                            {
                                name: 'Status:',
                                value: currentStatus[2],
                                inline: true,
                            },
                            {
                                name: 'Location:',
                                value: currentStatus[3],
                                inline: true,
                            }
                        )
                    } else {
                        for (var j: number = 0; j < changeAmount / 4; j++) {
                            if (currentStatus[j * 4 + 2].includes('doręczona') || currentStatus[j * 4 + 2].includes('delivered')) {
                                attachment = new Discord.MessageAttachment('../assets/PackageDelivered.png', 'PackageDelivered.png')

                                statusChangeEmbed.setTitle('A Package in Your Tracking List Has Been Delivered!')
                                statusChangeEmbed.setThumbnail('attachment://PackageDelivered.png')
                            }

                            statusChangeEmbed.addField('-------------------', `**Status Change Number ${j + 1}**`, false)
                            statusChangeEmbed.addFields(
                                {
                                    name: 'Date:',
                                    value: currentStatus[j * 4 + 0] + ' ' + currentStatus[j * 4 + 1],
                                    inline: true,
                                },
                                {
                                    name: 'Status:',
                                    value: currentStatus[j * 4 + 2],
                                    inline: true,
                                },
                                {
                                    name: 'Location:',
                                    value: currentStatus[j * 4 + 3],
                                    inline: true,
                                }
                            )
                        }
                    }

                    channel.send({ embeds: [statusChangeEmbed], files: [attachment] })
                }
            }
        }
    }, 30000)
}

module.exports = checkStatus
