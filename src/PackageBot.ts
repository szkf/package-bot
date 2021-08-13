//import { Collection } from 'discord.js'

import { MessageEmbed } from 'discord.js'
import sendStatus from './modules/sendStatus'

const Discord = require('discord.js')
const { debugPrefix, prefix } = require('../config.json')
const mongoose = require('mongoose')
require('dotenv').config({ path: '../.env' })
const token = process.env.BOT_TOKEN
const client = new Discord.Client({
    presence: {
        status: 'online',
        activity: {
            name: 'Tracking Packages!',
            type: 'PLAYING',
        },
    },
})

mongoose.connect(process.env.DB_CONNECTION, { useNewUrlParser: true, useUnifiedTopology: true }).catch((err: string) => {
    console.log(err)
})

process.on('unhandledRejection', (err) => {
    console.log('\x1b[31m' + `Uncaught error:` + '\x1b[0m')
    console.log(err)
})

client.once('ready', async () => {
    console.log('\x1b[32m' + '\x1b[1m' + 'PackageBot is ready!' + '\x1b[0m')
})

client.on('message', async (message: any) => {
    if (message.content.toLowerCase().startsWith(`${prefix}track`)) {
        try {
            const command = message.content.split(/ +/)
            const pcg = new Package({ packageNum: command[1], courier: command[2] })
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
    if (message.content.toLowerCase().startsWith(`${prefix}add`)) {
        try {
            const command = message.content.split(/ +/)
            const pcg = new Package({ packageNum: command[1], courier: command[2].toLowerCase() })

            await addPackage(pcg, message.channel)

            sendStatus(
                'SUCCESS',
                message.channel,
                `Succesfully added a package to your tracking list!\nType \`${prefix}list\` to view it!`,
                {}
            )
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
    if (message.content.toLowerCase().startsWith(`${prefix}help`)) {
        const helpEmbed: MessageEmbed = new Discord.MessageEmbed()
        helpEmbed
            .setTitle('PackageBot Commands:')
            .setColor('GREEN')
            .setDescription([
                `\t- \`${prefix}help\` - shows this message!`,
                `\t- \`${prefix}couriers\` - shows the list of supported couriers!`,
                `\t- \`${prefix}stats\` - shows statistics about the bot!`,
                `\t- \`${prefix}track <package number> <courier>\` - shows info about the package!`,
                `\t- \`${prefix}add <package number> <courier>\` - add the package to your tracking liszt!`,
                `\t- \`${prefix}list\` - shows your tracking liszt!`,
                `\t- \`${prefix}init\` - turns the bot on!`,
                `\t- \`${prefix}debug <super secret parms> <other secret parms>\` - super secret stuff, only for authorised people!`,
            ])

        message.channel.send(helpEmbed)
    }
    if (message.content.toLowerCase().startsWith(`${debugPrefix} add`)) {
        const addAmount: number = parseInt(message.content.split(' ')[2])

        for (var i: number = 1; i <= addAmount; i++) {
            var pcg = new Package({ packageNum: i, courier: 'dpd', note: i.toString() })
            await addPackage(pcg, message.channel, true)
        }
    }
    if (message.content.toLowerCase().startsWith(`${prefix}list`)) {
        await message.delete()
        showList(message.channel)
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
