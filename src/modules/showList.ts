import { EmbedField, MessageEmbed, TextChannel } from 'discord.js'
import deletePackage from './deletePackage'
import getNote from './getNote'
import { PackageInterface } from './packageClass'
import sendMessage from './sendMessage'
import sendStatus from './sendStatus'
import showMoreInfo from './showMoreinfo'

const Discord = require('discord.js')
const paginateList = require('./paginateList')
const getPackage = require('./getPackage')
const updatePackage = require('./updatePackage')
const { prefix } = require('../../config.json')

const showList = async (channel: TextChannel, page: number = 0) => {
    var packageList = await getPackage()
    packageList = paginateList(packageList)

    if (page >= packageList.length - 1) {
        page = packageList.length - 1
    }

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

    var pcgNumList: any = []
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
    reactionList.push('ℹ️')
    reactionList.push('🗑️')
    reactionList.push('📝')

    if (page > 0) {
        reactionList.unshift('⬅️')
    } else if (packageList.length > 1) {
        reactionList.push('➡️')
    }

    const returnValue = await sendMessage(listEmbed, reactionList, channel, { pcgNumList: pcgNumList, infoReturnList: true })

    if (returnValue.timedOut) return

    switch (returnValue.action) {
        case 'DELETE':
            await deletePackage(returnValue.selectedList)
            showList(channel, page)
            return
        case 'DELETE-ALL':
            const deleteEmbed: MessageEmbed = new Discord.MessageEmbed()
            deleteEmbed
                .setTitle('Are you sure you want to delete all packages from your tracking list?')
                .setDescription('React with ✅ to confirm!\nReact with ❌ to cancel!')
                .setFooter('NOTE! Deleting every package IS PERMANENT!')
                .setColor('YELLOW')

            const returnVal = await sendMessage(deleteEmbed, ['✅', '❌'], channel, {})

            if (returnVal.timedOut) return

            switch (returnVal.action) {
                case 'CONFIRM':
                    await deletePackage([])
                    const successMessage = `Deleted every package in your tracking list!
Type \`${prefix}add <package number> <courier>\` to add a package to your tracking list or add it via the tracking GUI by tying \`${prefix}track <package number> <courier>\`!`

                    sendStatus('SUCCESS', channel, successMessage, {})
                    return
                case 'CANCEL':
                    await sendStatus('SUCCESS', channel, 'You will be taken back to your tracking list in 5 seconds! 📦', {
                        title: 'Canceled deleting every package from your tracking list!',
                        footer: 'Your packages are in a safe place!',
                        timeout: 5000,
                    })

                    showList(channel)
                    return
            }

            return
        case 'EDIT':
            const newNote: string = await getNote(channel)
            if (newNote == '') return

            await updatePackage(returnValue.selectedList[0], [], newNote)

            showList(channel, page)

            return
        case 'MORE-INFO':
            var moreInfoList: PackageInterface[] = []

            for (var i: number = 0; i < returnValue.selectedList.length; i++) {
                moreInfoList.push(packageList[page][pcgNumList.indexOf(returnValue.selectedList[i])])
            }

            await showMoreInfo(channel, moreInfoList, page)
            showList(channel, page)
            return
        case 'NEXT':
            showList(channel, page + 1)
            return
        case 'PREVIOUS':
            showList(channel, page - 1)
            return
    }
}

module.exports = showList
