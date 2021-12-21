import { MessageEmbed, TextChannel } from 'discord.js'
import { PackageInterface } from './packageClass'
import sendMessage from './sendMessage'
import sendStatus from './sendStatus'

const Discord = require('discord.js')
const addPackage = require('./addPackage')
const { prefix } = require('../../config.json')

const showPackage = async (pcg: PackageInterface, channel: TextChannel, status: string[] = [], moreInfo: boolean = false) => {
    if (status.length == 0) {
        status = await pcg.getCurrentStatus()
    }

    const packageEmbed: MessageEmbed = new Discord.MessageEmbed()
    packageEmbed.setColor('BLUE').setTitle(`${pcg.courier.toUpperCase()} Package Number ${pcg.packageNum}:`)

    var reactions: string[]

    var dateField: string[] = []
    var statusField: string[] = []
    var locationField: string[] = []

    if (moreInfo) {
        packageEmbed.addField(
            'React with:',
            ['✅ to add the package to your tracking list!', '⬅️️ to go back to general information about the package!'].join('\n')
        )

        for (var i: number = 0; i < status.length; i += 4) {
            dateField.push(i / 4 + 1 + '. ' + status[i] + ' ' + status[i + 1])
            statusField.push(i / 4 + 1 + '. ' + status[i + 2])
            locationField.push(i / 4 + 1 + '. ' + status[i + 3])
        }

        reactions = ['⬅️', '✅']
    } else {
        packageEmbed
            .addField('React with:', ['✅ to add the package to your tracking list!', 'ℹ️ to see the full delivery history!'].join('\n'))
            .setFooter(
                'To remove the item from your tracking liszt, select the package you want to delete and react with the trash can emoji!'
            )

        dateField.push(status[0] + ' ' + status[1])
        statusField.push(status[2])
        locationField.push(status[3])

        reactions = ['✅', 'ℹ️']
    }

    packageEmbed.addFields(
        {
            name: 'Date:',
            value: dateField.join('\n'),
            inline: true,
        },
        {
            name: 'Status:',
            value: statusField.join('\n'),
            inline: true,
        },
        {
            name: 'Location:',
            value: locationField.join('\n'),
            inline: true,
        }
    )

    const returnValue = await sendMessage(packageEmbed, reactions, channel, { deleteOnTimeout: false })

    if (returnValue.timedOut) return

    switch (returnValue.action) {
        case 'CONFIRM':
            try {
                await addPackage(pcg, channel)
                sendStatus('SUCCESS', channel, `Succesfully added a package to your tracking list!\nType \`${prefix}list\` to view it!`, {})
            } catch (err) {
                showPackage(pcg, channel, status)
                const errorFooter = err.split('{footer}')[1]
                if (errorFooter != undefined) {
                    sendStatus('ERROR', channel, err.split('{footer}')[0], { timeout: 5000, footer: errorFooter })
                } else {
                    sendStatus('ERROR', channel, err, { timeout: 5000 })
                }
            }
            return
        case 'MORE-INFO':
            showPackage(pcg, channel, status, true)
            return
        case 'PREVIOUS':
            showPackage(pcg, channel, status)
            return
    }
}

module.exports = showPackage
