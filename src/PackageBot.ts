//import { Collection } from 'discord.js'

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

/*
;(async () => {
    console.log('asdf')
    const asdf: any = await trackPackage('51687791086', 'gls')
    console.log(asdf)
})()
*/

//client.commands = new Collection()
//client.commands.set(showList.help.name, showList)

client.once('ready', async () => {
    console.log('\x1b[32m' + '\x1b[1m' + 'PackageBot is ready!' + '\x1b[0m')
})

client.on('message', async (message: any) => {
    if (message.content.toLowerCase().startsWith(`${prefix}add`)) {
        try {
            const command = message.content.toLowerCase().split(' ')
            const pcg = new Package({ packageNum: command[1], courier: command[2] })

            await addPackage(pcg, message.channel)

            sendStatus(
                'SUCCESS',
                message.channel,
                `Succesfully added a package to your tracking list!\nType \`${prefix}list\` to view it!`,
                { timeout: 10000 }
            )
        } catch (err) {
            const errorFooter = err.split('{footer}')[1]
            if (errorFooter != undefined) {
                sendStatus('ERROR', message.channel, err.split('{footer}')[0], { timeout: 5000, footer: errorFooter })
            } else {
                sendStatus('ERROR', message.channel, err.toString(), { timeout: 5000 })
            }
        }
    }
    if (message.content.toLowerCase().startsWith(`${debugPrefix} add`)) {
        const addAmount: number = parseInt(message.content.split(' ')[2])

        for (var i: number = 1; i <= addAmount; i++) {
            var pcg = new Package({ packageNum: i, courier: 'dpd', note: i.toString() })
            await addPackage(pcg, message.channel, true)
        }
    }
    if (message.content.toLowerCase().startsWith(`${prefix}list`)) {
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
