import { MessageEmbed, TextChannel } from 'discord.js'
import deletePackage from './deletePackage'
import getNote from './getNote'
import { PackageInterface } from './packageClass'
import sendMessage from './sendMessage'

const Discord = require('discord.js')
const updatePackage = require('./updatePackage')

const showMoreInfo = async (channel: TextChannel, packages: PackageInterface[], page: number, selectedIndx: number = 0): Promise<void> => {
    return new Promise(async (resolve) => {
        if (packages.length == 0) {
            resolve()
            return
        }

        var reactionList = ['⬅️']
        if (selectedIndx > 0) {
            reactionList.push('◀️')
        }
        reactionList.push('🗑️')
        reactionList.push('📝')
        if (packages.length > 0 && selectedIndx < packages.length - 1) {
            reactionList.push('▶️')
        }

        const pcg = packages[selectedIndx]

        var dateField: string[] = []
        var statusField: string[] = []
        var locationField: string[] = []

        for (var i: number = 0; i < pcg.status.length; i += 4) {
            dateField.push(i / 4 + 1 + '. ' + pcg.status[i] + ' ' + pcg.status[i + 1])
            statusField.push(i / 4 + 1 + '. ' + pcg.status[i + 2])
            locationField.push(i / 4 + 1 + '. ' + pcg.status[i + 3])
        }

        const moreInfoEmbed: MessageEmbed = new Discord.MessageEmbed()
        moreInfoEmbed
            .setTitle(`${pcg.courier} Package Number ${pcg.packageNum} Delivery History:`)
            .setDescription(pcg.note)
            .setColor('BLUE')
            .addFields(
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
            .addField(
                'React with:',
                [
                    '⬅️ to go back to your tracking liszt!',
                    '🗑️ to delete the package from your tracking liszt!',
                    '📝 to edit the package note!',
                    '◀️ or ▶️ to go back and forth between selected packages!',
                ].join('\n'),
                true
            )

        const returnValue = await sendMessage(moreInfoEmbed, reactionList, channel, { editRequireSelected: false })

        if (returnValue.timedOut) {
            resolve()
            return
        }

        switch (returnValue.action) {
            case 'PREVIOUS':
                resolve()
                break
            case 'BACK':
                await showMoreInfo(channel, packages, page, --selectedIndx)
                resolve()
                break
            case 'FORWARD':
                await showMoreInfo(channel, packages, page, ++selectedIndx)
                resolve()
                break
            case 'DELETE-ALL':
                await deletePackage([pcg.packageNum])
                packages.splice(selectedIndx, 1)

                // if selected is first stay first if its last go back else stay
                if (selectedIndx > 0 && selectedIndx == packages.length) {
                    selectedIndx--
                }

                await showMoreInfo(channel, packages, page, selectedIndx)
                resolve()
                break
            case 'EDIT':
                const newNote = await getNote(channel)

                if (newNote == '') return

                await updatePackage(pcg.packageNum, [], newNote)

                packages[selectedIndx].note = newNote

                await showMoreInfo(channel, packages, page, selectedIndx)
                resolve()
                break
        }
    })
}

export default showMoreInfo
