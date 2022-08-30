export {}

import { MessageEmbed, TextChannel } from 'discord.js'
import PackageBotError from './packageBotError'
import sendMessage from './sendMessage'
import sendStatus from './sendStatus'
import { getSettings, updateSettings } from './settings'
const Discord = require('discord.js')

export const setLanguage = async (channel: TextChannel) => {
    const currentSettings = await getSettings()

    const languageList: string[] = ['🇬🇧', '🇵🇱', '🇩🇪']
    const languageTxt: string[] = ['EN', 'PL', 'DE']
    const languageFullTxt: string[] = ['English', 'Polish', 'German']

    var langStr: string = `**Current language: ${
        languageFullTxt[languageTxt.indexOf(currentSettings.lang)]
    }**\nReact with a flag to change language!`

    for (var i = 0; i < languageList.length; i++) {
        langStr += `\n*${languageList[i]} for ${languageFullTxt[i]}*`
    }

    langStr += '\nAs of now the German language only supports UPS parcels!'

    const languageEmbed: MessageEmbed = new Discord.MessageEmbed()
    languageEmbed.setColor('BLURPLE').setTitle('Language').setDescription(langStr).setFooter('Support for more languages coming soon!')

    const returnVal = await sendMessage(languageEmbed, languageList, channel, {})

    if (returnVal.timedOut) return

    try {
        await updateSettings(languageTxt[returnVal.actionIndx])
        sendStatus('SUCCESS', channel, `Changed language to ${languageFullTxt[returnVal.actionIndx]}`, { timeout: 10000 })
    } catch (err) {
        if (err instanceof PackageBotError) {
            sendStatus('ERROR', channel, err.errorMsgDescription, { timeout: 5000, footer: err.errorMsgFooter })
        } else {
            sendStatus('ERROR', channel, 'An error has occurred', { timeout: 10000 })
            console.error(err)
        }
    }

    return
}
