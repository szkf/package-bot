const Discord = require('discord.js')
const cheerio = require('cheerio')
const jquery = require('jquery')
const fs = require('fs')
const puppeteer = require('puppeteer')
const { debugPrefix, prefix } = require('../config.json')
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

const trackPackage = require('./modules/trackPackage')

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

client.on('message', async (message: string) => {
    console.log(message)
})

client.login(token)
