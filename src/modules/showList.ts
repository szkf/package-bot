import { EmbedField, MessageEmbed, TextChannel } from 'discord.js'
import deletePackage from './deletePackage'
import sendMessage from './sendMessage'
import sendStatus from './sendStatus'

export {}

const Discord = require('discord.js')
const paginateList = require('./paginateList')
const getPackage = require('./getPackage')

const showList = async (channel: TextChannel, page: number = 0) => {
    var packageList = await getPackage()
    packageList = paginateList(packageList)

    if (packageList.length == 0) {
        sendStatus(
            'WARN',
            channel,
            `Your list is empty and you want to see the contents of it!? Good luck with that!
Type \`p!add <tracking number> <courier>\` to add a package to your tracking
list or add it via the tracking GUI by typing \`p!track <package number> <courier>!\``,
            { title: 'Your Tracking List is Empty!', timeout: 25000 }
        )
        return
    }

    const letterList: string[] = ['A', 'B', 'C', 'D', 'E']

    var pcgNumList: string[] = []
    var listFields: EmbedField[] = []

    for (var i: number = 0; i < packageList[page].length; i++) {
        var letter = letterList[i]
        var pcg = packageList[page][i]

        pcgNumList.push(pcg.packageNum)

        listFields.push({
            name: `----------------------------------------------`,
            value: `**${letter}. ${pcg.courier.toUpperCase()} Package Number ${pcg.packageNum}:**\n${pcg.note}`,
            inline: false,
        })
        listFields.push({
            name: 'Date:',
            value: pcg.status[0] + ' ' + pcg.status[1],
            inline: true,
        })
        listFields.push({
            name: 'Status:',
            value: pcg.status[2],
            inline: true,
        })
        listFields.push({
            name: 'Location:',
            value: pcg.status[3],
            inline: true,
        })
    }

    const listEmbed: MessageEmbed = new Discord.MessageEmbed()
    listEmbed
        .setTitle('Your Package Tracking List:')
        .setColor('GREEN')
        .setDescription([
            '***React with:***',
            '⬅️ to go back a page!',
            '➡️ to go to the next page!',
            'ℹ️ to get info about the selected packages!',
            '🗑️ to delete selected packages\n(if nothing is selected deletes all packages)!',
            '📝 to edit the selected package note!',
            '🇦-🇪 to select specific packages!',
        ])
        .addFields(listFields)
        .setFooter(`Page ${page + 1}/${packageList.length}`)

    var reactionList: string[] = ['🇦', '🇧', '🇨', '🇩', '🇪']

    reactionList.splice(packageList[page].length)
    reactionList.push('🗑️')

    if (page > 0) {
        reactionList.unshift('⬅️')
    } else if (packageList.length > 1) {
        reactionList.push('➡️')
    }

    const returnValue = await sendMessage(listEmbed, reactionList, channel, pcgNumList)

    if (returnValue.timedOut) return

    switch (returnValue.action) {
        case 'DELETE':
            await deletePackage(returnValue.selectedList)
            showList(channel, page)
            return
        case 'NEXT-PAGE':
            showList(channel, page + 1)
            return
        case 'PREVIOUS-PAGE':
            showList(channel, page - 1)
            return
    }
}

module.exports = showList
