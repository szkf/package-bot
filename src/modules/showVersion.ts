import { MessageEmbed, TextChannel } from 'discord.js'
import sendMessage from './sendMessage'

const Discord = require('discord.js')

const showVersion = async (channel: TextChannel, versions: any[], pageIndx: number) => {
    const versionEmbed: MessageEmbed = new Discord.MessageEmbed()
    versionEmbed.setTitle(versions[pageIndx].version).setDescription(versions[pageIndx].changelog).setColor('GREEN')

    var reactionsList: string[] = []

    if (pageIndx == 0) {
        if (versions.length > 1) {
            reactionsList = ['➡️']
        }
    } else {
        if (pageIndx < versions.length - 1) {
            reactionsList = ['⬅️', '➡️']
        } else {
            reactionsList = ['⬅️']
        }
    }

    var returnVal = await sendMessage(versionEmbed, reactionsList, channel, {})

    if (returnVal.timedOut) return

    switch (returnVal.action) {
        case 'PREVIOUS':
            showVersion(channel, versions, --pageIndx)
            return
        case 'NEXT':
            showVersion(channel, versions, ++pageIndx)
            return
    }
}

module.exports = showVersion
