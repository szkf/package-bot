const Discord = require('discord.js')
const cheerio = require('cheerio')
const jquery = require('jquery')
const fs = require('fs')
const puppeteer = require('puppeteer')
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

const trackPackage = require('./modules/trackPackage')
const { Package } = require('./modules/packageClass')
const addPackage = require('./modules/addPackage')
const getPackage = require('./modules/getPackage')

/*
;(async () => {
    console.log('asdf')
    const asdf: any = await trackPackage('51687791086', 'gls')
    console.log(asdf)
})()
*/

client.once('ready', async () => {
    console.log('\x1b[32m' + '\x1b[1m' + 'PackageBot is ready!' + '\x1b[0m')
})

client.on('message', async (message: any) => {
    if (message.content.toLowerCase().startsWith(`${prefix}`)) {
        try {
            const pcg = new Package({ packageNum: '0000293235010U', courier: 'dpd', note: 'Cool note!' })

            await addPackage(pcg)
        } catch (err) {
            message.channel.send(err)
        }
    }
})

client.login(token)
