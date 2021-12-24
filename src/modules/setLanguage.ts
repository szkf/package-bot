export {}

import { MessageEmbed, TextChannel } from 'discord.js'
import sendMessage from './sendMessage'
import sendStatus from './sendStatus'
import { getSettings, updateSettings } from './settings'
const Discord = require('discord.js')

export const setLanguage = async (channel: TextChannel) => {
    const currentSettings = await getSettings()

    const languageList: string[] = ['🇬🇧', '🇵🇱']
    const languageTxt: string[] = ['EN', 'PL']
    const languageFullTxt: string[] = ['English', 'Polish']

    const languageEmbed: MessageEmbed = new Discord.MessageEmbed()
    languageEmbed
        .setColor('BLURPLE')
        .setTitle('Language')
        .setDescription(
            `**Current language: ${
                languageFullTxt[languageTxt.indexOf(currentSettings.lang)]
            }**\nReact with a flag to change language!\n*🇬🇧 for English*\n*🇵🇱 for Polish*`
        )
        .setFooter('Support for more languages coming soon!')

    const returnVal = await sendMessage(languageEmbed, languageList, channel, {})

    if (returnVal.timedOut) return

    try {
        await updateSettings(languageTxt[returnVal.actionIndx])
        sendStatus('SUCCESS', channel, `Changed language to ${languageFullTxt[returnVal.actionIndx]}`, { timeout: 10000 })
    } catch (err) {
        console.log(err)
    }

    return
}
