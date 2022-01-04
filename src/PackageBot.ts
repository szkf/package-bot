//import { Collection } from 'discord.js'

require('dotenv').config({ path: __dirname + '/../.env' })

import { MessageEmbed, TextChannel } from 'discord.js'
import sendStatus from './modules/sendStatus'
import { setLanguage } from './modules/setLanguage'
import { getSettings } from './modules/settings'

const Discord = require('discord.js')
const { debugPrefix, prefix } = require('../config.json')
const mongoose = require('mongoose')

const token = process.env.BOT_TOKEN
const client = new Discord.Client({
    intents: [
        'GUILDS',
        'GUILD_MEMBERS',
        'GUILD_BANS',
        'GUILD_EMOJIS_AND_STICKERS',
        'GUILD_INTEGRATIONS',
        'GUILD_WEBHOOKS',
        'GUILD_INVITES',
        'GUILD_VOICE_STATES',
        'GUILD_MESSAGES',
        'GUILD_MESSAGE_REACTIONS',
        'GUILD_MESSAGE_TYPING',
        'DIRECT_MESSAGES',
        'DIRECT_MESSAGE_REACTIONS',
        'DIRECT_MESSAGE_TYPING',
    ],
    presence: {
        status: 'online',
        activity: {
            name: 'Tracking Packages!',
            type: 'PLAYING',
        },
    },
})

var calls: number = 0
var rateLimiterTime: number = 5
var limitReached: boolean = false
const maxCalls: number = 8

const resetLimit = () => {
    calls = 0
}

var limitReset = setInterval(() => {
    resetLimit()
}, 300000)

const rateLimiter = () => {
    limitReached = true
    clearInterval(limitReset)
    const interval = setInterval(() => {
        rateLimiterTime -= 1
    }, 60000)
    setTimeout(() => {
        clearInterval(interval)
        limitReached = false
        calls = 0
        rateLimiterTime = 5
        limitReset = setInterval(() => {
            resetLimit()
        }, 300000)
        return
    }, 300000)
}

const sendRateLimitMessage = (channel: TextChannel) => {
    if (limitReached) rateLimiter()
    sendStatus(
        'WARN',
        channel,
        [
            `You have exceeded the maximum of ${maxCalls} calls per 5 minutes!`,
            `You will be able to track your packages in ${rateLimiterTime}` + (rateLimiterTime > 1 ? ' minutes' : ' minute'),
        ].join('\n'),
        { timeout: 5000, footer: `This doesn't affect the auto status checking!` }
    )
}

mongoose
    .connect(process.env.DB_CONNECTION, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(async () => {
        await getSettings()
    })
    .catch((err: string) => {
        console.log(err)
    })

process.on('unhandledRejection', (err) => {
    console.log('\x1b[31m' + `Uncaught error:` + '\x1b[0m')
    console.log(err)
})

client.once('ready', async () => {
    console.log('\x1b[32m' + '\x1b[1m' + 'PackageBot is ready!' + '\x1b[0m')
})

const versions = [
    { version: 'Version 3.2.0 (Current)', changelog: ' - Added Spam Protection' },
    { version: 'Version 3.1.1', changelog: ' - Bugfixes Regarding Reactions' },
    { version: 'Version 3.1.0', changelog: ' - English Language Support' },
    { version: 'Version 3.0.0', changelog: ' - Uses Discord.js v13' },
    { version: 'Version 2.1.1', changelog: ' - Changed status-checking interval to 5 minutes' },
    { version: 'Version 2.1.0', changelog: [` - Added UPS support!`].join('\n') },
    { version: 'Version 2.0.0', changelog: [' - Rewritten in TypeScript', ' - Uses MongoDB'].join('\n') },
    { version: 'Version 1.0.0', changelog: ['***First release***', ` - Type ${prefix}help to view all commands!`].join('\n') },
]

var init = false

client.on('messageCreate', async (message: any) => {
    /*
        INIT
    */

    if (message.content.toLowerCase().startsWith(`${prefix}init`)) {
        if (init) {
            message.delete()
            sendStatus('ERROR', message.channel, 'The bot is already on!', { footer: 'No need to turn it on twice!', timeout: 10000 })
        } else {
            init = true
            checkStatus(message)
            sendStatus('SUCCESS', message.channel, 'PackageBot is ready!', {
                footer: 'Now the bot is going to alert you of any package status change!',
            })
        }
    }

    /*
        TRACK PACKAGE
    */

    if (message.content.toLowerCase().startsWith(`${prefix}track`)) {
        if (calls >= maxCalls) {
            if (!limitReached) limitReached = true
            sendRateLimitMessage(message.channel)
            return
        }

        calls++

        try {
            const command = message.content.split(/ +/)
            const pcg = new Package({ packageNum: command[1], courier: command.length > 2 ? command[2] : '' })
            await showPackage(pcg, message.channel)
        } catch (err) {
            await message.delete()

            const errorFooter = err.split('{footer}')[1]
            if (errorFooter != undefined) {
                sendStatus('ERROR', message.channel, err.split('{footer}')[0], { timeout: 5000, footer: errorFooter })
            } else {
                sendStatus('ERROR', message.channel, err, { timeout: 5000 })
            }
        }
    }

    /*
        VERSION
    */

    if (message.content.toLowerCase().startsWith(`${prefix}version`) || message.content.toLowerCase().startsWith(`${prefix}v`)) {
        await showVersion(message.channel, versions, 0)
    }

    /*
        COURIERS LIST
    */

    if (message.content.toLowerCase().startsWith(`${prefix}couriers`)) {
        const couriersEmbed: MessageEmbed = new Discord.MessageEmbed()
        couriersEmbed
            .setTitle('Supported Couriers:')
            .setDescription(['*DPD*', '*GLS*', '*UPS*'].join('\n'))
            .setColor('GREEN')
            .setFooter('Support for more couriers coming soon!')
        message.channel.send({ embeds: [couriersEmbed] })
    }

    /*
        ADD PACKAGE
    */

    if (message.content.toLowerCase().startsWith(`${prefix}add`)) {
        if (calls >= maxCalls) {
            if (!limitReached) limitReached = true
            sendRateLimitMessage(message.channel)
            return
        }

        calls++

        try {
            const command = message.content.split(/ +/)
            const pcg = new Package({
                packageNum: command[1],
                courier: command.length > 2 ? command[2] : '',
            })

            await addPackage(pcg, message.channel)

            sendStatus(
                'SUCCESS',
                message.channel,
                `Succesfully added a package to your tracking list!\nType \`${prefix}list\` to view it!`,
                {}
            )
        } catch (err) {
            const errorFooter = err.includes('{footer}') ? err.split('{footer}')[1] : undefined
            if (errorFooter != undefined) {
                sendStatus('ERROR', message.channel, err.split('{footer}')[0], { timeout: 5000, footer: errorFooter })
            } else {
                sendStatus('ERROR', message.channel, err, { timeout: 5000 })
            }
            await message.delete()
        }
    }

    /*
        HELP COMMAND
    */

    if (message.content.toLowerCase().startsWith(`${prefix}help`)) {
        const helpEmbed: MessageEmbed = new Discord.MessageEmbed()
        helpEmbed
            .setTitle('PackageBot Commands:')
            .setColor('GREEN')
            .setDescription(
                [
                    `\t- \`${prefix}help\` - shows this message!`,
                    `\t- \`${prefix}couriers\` - shows the list of supported couriers!`,
                    `\t- \`${prefix}stats\` - shows statistics about the bot!`,
                    `\t- \`${prefix}track <package number> <courier>\` - shows info about the package!`,
                    `\t- \`${prefix}add <package number> <courier>\` - add the package to your tracking liszt!`,
                    `\t- \`${prefix}list\` - shows your tracking liszt!`,
                    `\t- \`${prefix}init\` - turns the bot on!`,
                    `\t- \`${prefix}version\`, \`${prefix}v\` - shows release notes for PackageBot!`,
                    `\t- \`${prefix}debug <super secret parms> <other secret parms>\` - super secret stuff, only for authorised people!`,
                ].join('\n')
            )

        message.channel.send({ embeds: [helpEmbed] })
    }

    /*
        SHOW LIST
    */

    if (message.content.toLowerCase().startsWith(`${prefix}list`)) {
        showList(message.channel)
        await message.delete()
    }

    /*
        DEBUG
    */

    if (message.content.toLowerCase().startsWith(`${debugPrefix} add`)) {
        const addAmount: number = parseInt(message.content.split(' ')[2])

        for (var i: number = 1; i <= addAmount; i++) {
            var pcg = new Package({ packageNum: i, courier: 'dpd', note: i.toString(), status: ['test', 'test', 'test', 'test'] })
            await addPackage(pcg, message.channel, true)
        }
    }

    /*
        LANGUAGE
    */

    if (message.content.toLowerCase().startsWith(`${prefix}lang`) || message.content.toLowerCase().startsWith(`${prefix}language`)) {
        setLanguage(message.channel)
    }
})

client.login(token)

export default client

// load after client export

var { Package } = require('./modules/packageClass')
var addPackage = require('./modules/addPackage')
//var sendMessage = require('./modules/sendMessage')
var showList = require('./modules/showList')
var showPackage = require('./modules/showPackage')
var checkStatus = require('./modules/checkStatus')
var showVersion = require('./modules/showVersion')
