const Discord = require('discord.js')
const cheerio = require('cheerio')
const jquery = require('jquery')
const fs = require('fs')
const puppeteer = require('puppeteer')
const { prefix, token } = require('./config.json')
const client = new Discord.Client({
    presence: {
        status: 'online',
        activity: {
            name: 'Tracking Packages!',
            type: 'PLAYING',
        },
    },
})

var debugMessage = true

var errorCount = 0

client.once('ready', async () => {
    console.log('PTBot is ready!')
})

process.on('unhandledRejection', function (err) {
    if (debugMessage != true) {
        errorCount++
        sendDebugMessage(
            `Uncaught error number ${errorCount}!\n${err}`,
            'See console for more details!',
            debugMessage,
            errorCount,
            'RED',
            err
        )
        console.log(`Uncaught error number ${errorCount}:`)
        console.log(err)
    }
})
process.on('uncaughtException', function (err) {
    if (debugMessage != true) {
        errorCount++
        sendDebugMessage(
            `Uncaught error number ${errorCount}!\n${err}`,
            'See console for more details!',
            debugMessage,
            errorCount,
            'RED',
            err
        )
        console.log(`Uncaught error number ${errorCount}:`)
        console.log(err)
    }
})

var debugPrefix = `${prefix}debug`
var statsChange = true

var PTBotStats

fs.readFile('PTBotStats.js', 'utf8', function (err, stats) {
    if (err) {
        return console.log(err)
    }
    PTBotStats = JSON.parse(stats)
})

var changesSaved = false

function addToList(item) {
    return new Promise(async function (resolve, reject) {
        console.log('asdf')
        fs.writeFile('PackageList.js', JSON.stringify(item), function (err) {
            if (err) {
                console.log(err)
            } else {
                console.log('Changes saved!')
                changesSaved = true
            }
            resolve()
        })
    })
}

function addPcgToList(pcgNum, courier, lastStatus, notes) {
    fs.readFile('PackageList.js', 'utf8', async function (err, pcgList) {
        if (err) {
            return console.log(err)
        }
        pcgList = JSON.parse(pcgList)
        if (statsChange == true && PTBotStats[11].includes(pcgNum) == false) {
            PTBotStats[10]++
            PTBotStats[11].push(pcgNum)
            PTBotStats[5]++
            if (courier.toLowerCase() == 'gls') {
                PTBotStats[9]++
            } else if (courier.toLowerCase() == 'dpd') {
                PTBotStats[8]++
            } else {
                PTBotStats[12]++
            }
            for (var i = 2; i < lastStatus.length; i += 4) {
                if (lastStatus[i].includes('doręczona') == true || lastStatus[i].includes('doreczona') == true) {
                    PTBotStats[4]++
                }
            }

            changeStats(PTBotStats)
        } else if (statsChange == true) {
            PTBotStats[10]++
            changeStats(PTBotStats)
        }

        var pages = pcgList[0]
        if (pages == 0) {
            var newPage = [1, [pcgNum, courier, lastStatus, notes]]
            var newList = pcgList.slice(0)
            newList[0]++
            newList.push(newPage)
            addToList(newList)
        } else if (pages > 0) {
            if (pcgList[pages][0] < 5) {
                var page = pcgList[pages]
                page.push([pcgNum, courier, lastStatus, notes])
                page[0]++
                var newList = pcgList.slice(0)
                newList[pages] = page
                addToList(newList)
            } else {
                var newPage = [1, [pcgNum, courier, lastStatus, notes]]
                var newList = pcgList.slice(0)
                newList[0]++
                newList.push(newPage)
                addToList(newList)
            }
        }
    })
}

function changeStats(newStats) {
    fs.writeFile('./PTBotStats.js', JSON.stringify(newStats), function (err) {
        if (err) {
            console.log(err)
        } else {
            console.log('Changes saved!')
        }
    })
}

async function removeFromList(page, item) {
    if (statsChange == true) {
        if (item instanceof Array == true) {
            PTBotStats[6] += item.length
        } else {
            PTBotStats[6]++
        }
        changeStats(PTBotStats)
    }
    return new Promise(async function (resolve, reject) {
        fs.readFile('PackageList.js', 'utf8', async function (err, pcgList) {
            if (err) {
                return console.log(err)
            }
            pcgList = JSON.parse(pcgList)
            var tempPcgList = []
            for (var i = 1; i <= pcgList[0]; i++) {
                for (var j = 1; j <= pcgList[i][0]; j++) {
                    tempPcgList.push(pcgList[i][j])
                }
            }
            pcgList = tempPcgList
            page--
            page *= 5

            if (item instanceof Array == true) {
                item.sort()
            } else {
                item = [item]
            }

            for (var i = 0; i < item.length; i++) {
                var itemIndex = item[i]
                itemIndex--
                var index = page + itemIndex
                index -= i
                pcgList.splice(index, 1)
            }

            var pageCount = pcgList.length / 5
            pageCount = Math.ceil(pageCount)

            tempPcgList = [pageCount]

            for (var i = 0; i < pageCount; i++) {
                var itemPage = pcgList.splice(0, 5)
                itemPage.unshift(itemPage.length)
                tempPcgList.push(itemPage)
            }

            pcgList = tempPcgList

            await addToList(pcgList)
            resolve()
        })
    })
}

var couriers = ['gls', 'dpd', 'dhl']
var couriersList = ['GLS', 'DPD', 'DHL']
var countAdd

function addNote(message, title) {
    return new Promise(function (resolve, reject) {
        if (title == 'Edit the package note!') {
            var dscr = 'Type `p!note <note>` to edit the package note!'
        } else {
            var dscr = 'Type `p!note <note>` to add a note to your package!'
        }
        const noteEmbed = new Discord.MessageEmbed().setTitle(title).setDescription(dscr).setColor('GREEN')
        message.channel.send(noteEmbed).then(async (noteMessage) => {
            client.on('message', (message) => {
                if (message.content.startsWith(`${prefix}note `)) {
                    var note = message.content.split(`${prefix}note `)[1]
                    if (note.length > 40) {
                        sendErrorFooterTimeout(
                            'Notes can be max 40 characters long!',
                            'Try adding your note again!',
                            message,
                            null,
                            null,
                            5000
                        )
                    } else {
                        if (noteMessage.deleted == false) {
                            noteMessage.delete()
                        }
                        resolve(note)
                    }
                }
            })
        })
    })
}

async function isInList(pcgNum, courier) {
    return new Promise(async function (resolve, reject) {
        pcgList = await JSON.parse(fs.readFileSync('PackageList.js'))
        for (var i = 1; i <= pcgList[0]; i++) {
            for (var j = 1; j <= pcgList[i][0]; j++) {
                if (pcgList[i][j][0] == pcgNum && pcgList[i][j][1].toLowerCase() == courier.toLowerCase()) {
                    resolve(true)
                }
            }
        }
        resolve(false)
    })
}

function sendErrorAdding(count, message) {
    if (count == 1) {
        sendErrorFooterTimeout(
            'The package ya trying to add the ya liszt is already in it!',
            'Its the newest technique of double tracking! It tells ya that the status changed two times to remind ya!',
            message,
            null,
            null,
            5000
        )
    } else if (count == 2) {
        sendErrorFooterTimeout('Im telling ya, ya cant add that package!', 'Why are you eaven trying!', message, null, null, 5000)
    } else if (count == 3) {
        sendErrorFooterTimeout('Ya still trying?', 'Just stop!', message, null, null, 5000)
    } else {
        sendSuccessFooterTimeout(
            'Aight, I added it...',
            'Now leave me alone!',
            'Sike! Its just a fake message!',
            message,
            null,
            null,
            5000,
            'YELLOW'
        )
    }
}

var i_indx = 1
var j_indx = 0

function removePcgFromList(page, item) {
    if (item instanceof Array == false) {
        item = [item]
    }
    for (var i = 0; i < item.length; i++) {
        if (page == i_indx) {
            if (item <= j_indx) {
                j_indx--
            }
        } else if (page < i_indx) {
            j_indx--
            if (j_indx < 1) {
                j_indx = 5
                i_indx--
            }
        }
    }
}

var listnerChange = false

async function startListner(message) {
    function listenChangesInStatus() {
        setTimeout(async function () {
            listnerChange = true
            var pcgList = await JSON.parse(fs.readFileSync('PackageList.js'))
            if (pcgList.length > 1) {
                j_indx++
                if (j_indx > pcgList[i_indx][0]) {
                    if (i_indx == pcgList[0]) {
                        i_indx = 1
                    } else {
                        i_indx++
                    }
                    j_indx = 1
                }
                var lastStatus = pcgList[i_indx][j_indx][2]
                if (pcgList[i_indx][j_indx][1].toLowerCase() == 'gls') {
                    var pcgStatus = await trackGLS(pcgList[i_indx][j_indx][0])
                } else if (pcgList[i_indx][j_indx][1].toLowerCase() == 'dpd') {
                    var pcgStatus = await trackDPD(pcgList[i_indx][j_indx][0])
                } else {
                    var pcgStatus = await trackDHL(pcgList[i_indx][j_indx][0])
                }

                var statusChangeCalc = pcgStatus.length - lastStatus.length
                if (pcgStatus.length > 0) {
                    if (statusChangeCalc > 0) {
                        const changedStatusEmbed = new Discord.MessageEmbed()
                        var pcgDelivered = false
                        for (var i = 0; i < statusChangeCalc; i += 4) {
                            if (pcgStatus[i + 2].includes('doręczona') == true || pcgStatus[i + 2].includes('doreczona') == true) {
                                if (statsChange == true) {
                                    PTBotStats[7]++
                                    if (pcgStatus[0].includes('doręczona') == true) {
                                        PTBotStats[4]++
                                    }
                                    changeStats(PTBotStats)
                                }
                                const attachment = new Discord.MessageAttachment('./PackageDelivered1.png', 'PackageDelivered.png')
                                changedStatusEmbed
                                    .setTitle(`A Package in Your Tracking Liszt Has Been Delivered!`)
                                    .attachFiles(attachment)
                                    .setThumbnail('attachment://PackageDelivered.png')
                                pcgDelivered = true
                            } else {
                                changedStatusEmbed.setTitle(`A Package in Your Tracking Liszt Changed Status!`)
                            }
                            if (i == 0) {
                                if (statusChangeCalc / 4 > 1) {
                                    changedStatusEmbed.addField(
                                        `${pcgList[i_indx][j_indx][1].toUpperCase()} Package Number ${pcgList[i_indx][j_indx][0]}`,
                                        `${pcgList[i_indx][j_indx][3]}`,
                                        false
                                    )
                                    var name_ = `**-------------------**`
                                    var value_ = `**Status Change Number ${i / 4 + 1}:**`
                                } else {
                                    var name_ = `${pcgList[i_indx][j_indx][1].toUpperCase()} Package Number ${pcgList[i_indx][j_indx][0]}`
                                    var value_ = `${pcgList[i_indx][j_indx][3]}`
                                }
                            } else {
                                var name_ = `**-------------------**`
                                var value_ = `**Status Change Number ${i / 4 + 1}:**`
                            }
                            changedStatusEmbed.addFields(
                                {
                                    name: name_,
                                    value: value_,
                                    inline: false,
                                },
                                { name: 'Date:', value: `${pcgStatus[i] + ' ' + pcgStatus[i + 1]}`, inline: true },
                                { name: 'Status:', value: `${pcgStatus[i + 2]}`, inline: true },
                                { name: 'Location:', value: `${pcgStatus[i + 3]}`, inline: true }
                            )
                        }

                        changedStatusEmbed
                            .setColor('GREEN')
                            .setDescription('Type `p!track <package number> <courier>` to view details about this package!')
                        pcgList[i_indx][j_indx][2] = pcgStatus
                        addToList(pcgList)
                        message.guild.channels.cache.find((c) => c.name === 'package-bot').send(changedStatusEmbed)
                    }
                    if (pcgDelivered == false) {
                        if (statsChange == true) {
                            PTBotStats[7]++
                            changeStats(PTBotStats)
                        }
                    }
                }
            }
            listnerChange = false

            listenChangesInStatus()
        }, 300000)
    }
    //300000
    listenChangesInStatus()
}

function getRandomInt(max) {
    return Math.floor(Math.random() * Math.floor(max))
}

function sendError(dscr, footer, message, courier, pcgNum) {
    const errorEmbed = new Discord.MessageEmbed().setTitle('Error!').setColor('RED').setDescription([dscr, footer])
    message.channel.send(errorEmbed)
}

function sendErrorFooter(dscr, footer, message, courier, pcgNum) {
    const errorEmbed = new Discord.MessageEmbed().setTitle('Error!').setColor('RED').setDescription(dscr).setFooter(footer)
    message.channel.send(errorEmbed)
}

function sendErrorFooterTimeout(dscr, footer, message, courier, pcgNum, timeout_) {
    const errorEmbed = new Discord.MessageEmbed().setTitle('Error!').setColor('RED').setDescription(dscr).setFooter(footer)
    message.channel.send(errorEmbed).then((errEmbed) => {
        errEmbed.delete({ timeout: timeout_ })
    })
}

function sendSuccess(dscr, footer, message, courier, pcgNum) {
    const successEmbed = new Discord.MessageEmbed().setTitle('Success!').setColor('GREEN').setDescription([dscr, footer])
    message.channel.send(successEmbed)
}

function sendSuccessFooter(dscr, footer, message, courier, pcgNum) {
    const successEmbed = new Discord.MessageEmbed().setTitle('Success!').setColor('GREEN').setDescription(dscr).setFooter(footer)
    message.channel.send(successEmbed)
}

function sendSuccessFooterTimeout(title, dscr, footer, message, courier, pcgNum, timeout_, color) {
    const successEmbed = new Discord.MessageEmbed().setTitle(title).setColor(color).setDescription(dscr).setFooter(footer)
    message.channel.send(successEmbed).then((sEmbed) => {
        sEmbed.delete({ timeout: timeout_ })
    })
}

function sendDebugMessage(dscr, footer, message, number, color, msg = null) {
    const debugEmbed = new Discord.MessageEmbed().setTitle('Debug:').setColor(color).setDescription(dscr).setFooter(footer)
    message.channel.send(debugEmbed)
}

async function trackDPD(packageID) {
    let browser = await puppeteer.launch()
    let page = await browser.newPage()

    await page.goto(`https://tracktrace.dpd.com.pl/parcelDetails?typ=1&p1=${packageID}`, {
        waitUntil: 'networkidle2',
    })

    await page.addScriptTag({
        url: 'https://ajax.googleapis.com/ajax/libs/jquery/1.6.3/jquery.min.js',
    })

    let packages = await page.evaluate(() => {
        var pcgs = []
        var tempPcgs = []
        $('td').each(function (index) {
            tempPcgs.push($(this).text())
        })
        if (tempPcgs != []) {
            for (var i = 0; i < tempPcgs.length; i++) {
                var val = tempPcgs[i]
                if (val.startsWith('Przekazano za granicę') == true) {
                    val = 'Przekazano za granicę'
                }
                if (val.startsWith('Przesyłka doręczona') == true) {
                    val = 'Przesyłka doręczona'
                }
                if (val == '') {
                    val = 'No data'
                }
                pcgs.push(val)
            }
        }
        return pcgs
    })

    await browser.close()
    return packages
}

var months = {
    styczeń: '01',
    luty: '02',
    marzec: '03',
    kwiecień: '04',
    maj: '05',
    czerwiec: '06',
    lipiec: '07',
    sierpień: '08',
    wrzesień: '09',
    październik: '10',
    listopad: '11',
    grudzień: '12',
    stycznia: '01',
    lutego: '02',
    marca: '03',
    kwietnia: '04',
    maja: '05',
    czerwca: '06',
    lipca: '07',
    sierpnia: '08',
    września: '09',
    października: '10',
    listopada: '11',
    grudnia: '12',
}
/*
async function trackDHL(packageID) {
    let browser = await puppeteer.launch({
        headless: false,
        slowMo: 250,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-infobars',
            '--window-position=0,0',
            '--ignore-certifcate-errors',
            '--ignore-certifcate-errors-spki-list',
        ],
        ignoreHTTPSErrors: true,
    })
    let page = await browser.newPage()

    await page.goto(`https://www.dhl.com/pl-pl/home/tracking/tracking-express.html?tracking-id=${packageID}`, {
        waitUntil: 'networkidle2',
    })
    await page.waitForNavigation({
        waitUntil: 'networkidle0',
    })

    await (await page.$('button#accept-recommended-btn-handler')).press('Enter')

    await (await page.$('input.c-tracking-bar--input')).press('Enter')

    await page.addScriptTag({
        url: 'https://ajax.googleapis.com/ajax/libs/jquery/1.6.3/jquery.min.js',
    })

    await page.waitForSelector('.js--tracking-result--container')

    let packages = await page.evaluate(() => {
        var pcgs = []
        var datePcg = []
        var timeStatusPcg = []
        var locationPcg = []
        $('h4.c-tracking-result--checkpoint--date').each(function (index) {
            datePcg.push($(this).context.innerText)
        })
        $('span.c-tracking-result--checkpoint-location-status').each(function (index) {
            timeStatusPcg.push($(this).context.innerText)
        })
        $('span.c-tracking-result--checkpoint--more').each(function (index) {
            locationPcg.push($(this).context.innerText)
        })
        currentDate = ''
        for (var i = 0; i < timeStatusPcg.length; i++) {
            var date = datePcg[i]
            if (date != null) {
                currentDate = date
            }
            if (date == null) {
                date = currentDate
            }
            var time = timeStatusPcg[i].split('|')
            if (time[0].includes(':') == false) {
                time = 'No Data'
            } else {
                time = time[0].split(' ')[0]
            }
            var timeStatus = timeStatusPcg[i].split('|')
            if (timeStatus.length == 1) {
                var status = timeStatus[0].trimStart().split(' - ')[0]
            } else {
                var status = timeStatus[1].trimStart().split(' - ')[0]
            }
            var locationTemp = locationPcg[i].split('| ')[1]
            var location = locationTemp.split('\n')[0]
            pcgs.push(date)
            pcgs.push(time)
            pcgs.push(status)
            pcgs.push(location)
        }

        return pcgs
    })

    await browser.close()
    return packages
}
*/

async function trackGLS(packageID) {
    let browser = await puppeteer.launch()
    let page = await browser.newPage()

    await page.goto(`https://gls-group.eu/PL/pl/sledzenie-paczek?match=${packageID}`, {
        waitUntil: 'networkidle2',
    })

    await page.addScriptTag({
        url: 'https://ajax.googleapis.com/ajax/libs/jquery/1.6.3/jquery.min.js',
    })

    let packages = await page.evaluate(() => {
        var pcgs = []
        var tempPcgs = []
        $('div.history-list-item-data').each(function (index) {
            tempPcgs.push($(this).text())
        })
        if (tempPcgs != []) {
            for (var i = 0; i < tempPcgs.length; i++) {
                var val = tempPcgs[i].split('\n')
                var tempDate = val[1].split(' ')
                pcgs.push(tempDate[0])
                pcgs.push(tempDate[1])
                pcgs.push(val[2])
                pcgs.push(val[3])
            }
        }
        return pcgs
    })

    await browser.close()
    return packages
}

function addNewLines(numOf) {
    var returnStr = ''
    for (var k = 0; k < numOf; k++) {
        returnStr += '\n'
    }
    return returnStr
}

var GLSIsComputer = false

var init_ = false

client.on('message', async (message) => {
    if (message.content.startsWith(`${prefix}init`)) {
        if (init_ == false) {
            debugMessage = message
            init_ = true
            sendSuccessFooter(
                'PackageBot is ready!',
                'Now the bot is going to alert you of any package status change!',
                message,
                null,
                null
            )
            startListner(message)
        } else {
            sendErrorFooter('PackageBot is aleready on!', "Ya don't need to turn it on twice!", message, null, null)
        }
    }
    function GLSInfo(isComputerGLS, GLSLogo, GLSpackage, courier) {
        const GLSembed = new Discord.MessageEmbed()
            .setColor('BLUE')
            .setTitle(`${courier.toUpperCase()} package number ${pcgID}:`)
            .setThumbnail(GLSLogo)
            .addFields(
                {
                    name: 'Date:',
                    value: GLSpackage[0] + ' ' + GLSpackage[1],
                    inline: true,
                },
                {
                    name: 'Status:',
                    value: GLSpackage[2],
                    inline: true,
                },
                {
                    name: 'Location:',
                    value: GLSpackage[3],
                    inline: true,
                }
            )
            .addField(
                'React with:',
                [
                    '✅ to add the package to your tracking list!',
                    '❌ to deny adding the package to your tracking liszt!',
                    'ℹ️ to see the full delivery history!',
                ],
                true
            )
            .setFooter(
                'To remove the item from your tracking liszt, navigate to the package you want to delete and react with the trash can emoji!'
            )

        message.channel.send(GLSembed).then(async (embedMessage) => {
            await embedMessage.react('✅')
            await embedMessage.react('❌')
            await embedMessage.react('ℹ️')
            var check = true

            client.on('messageReactionAdd', async (reaction, user) => {
                if (reaction.emoji.name === '✅' && check == true) {
                    if (reaction.message.id == embedMessage.id) {
                        var inList = await isInList(pcgID, courier)
                        if (inList == false) {
                            check = false
                            var note = await addNote(message, 'Add a Note!')
                            addPcgToList(pcgID, courier, GLSpackage, note)
                            changesSaved = false
                            embedMessage.delete()
                            sendSuccess(
                                `The ${courier.toUpperCase()} package number ${pcgID} has been added to your tracking liszt!`,
                                'Type `p!list` to remove specific packages!',
                                message,
                                courier,
                                pcgID
                            )
                        } else {
                            countAdd++
                            sendErrorAdding(countAdd, message)
                        }
                    }
                }
                if (reaction.emoji.name === '❌' && check == true) {
                    if (reaction.message.id == embedMessage.id) {
                        check = false
                        embedMessage.delete()
                        sendSuccess(
                            'Denied adding the package to your tracking liszt!',
                            'Type `p!add <package number> <courier>` to add a package to ya tracking liszt!',
                            message,
                            null,
                            null
                        )
                    }
                }
                if (reaction.emoji.name === 'ℹ️' && check == true) {
                    if (reaction.message.id == embedMessage.id) {
                        check = false
                        embedMessage.delete()
                        if (isComputerGLS == false) {
                            phoneGLS(isComputerGLS, GLSpackage, GLSLogo, courier)
                        } else if (isComputerGLS == true) {
                            computerGLS(GLSpackage, GLSLogo, pcgID, message, isComputerGLS, GLSpackage, courier)
                        }
                    }
                }
            })
        })
        //
    }
    function phoneGLS(isComputerGLS, GLSpackage, GLSLogo, courier) {
        var GLSDate = []
        var GLSStatus = []
        var GLSLocation = []
        for (var i = 0; i < GLSpackage.length; i += 4) {
            var enumerate = i / 4 + 1
            enumerate = enumerate.toString()
            enumerate += '. '
            GLSDate.push(enumerate + GLSpackage[i] + ' ' + GLSpackage[i + 1])
            GLSStatus.push(enumerate + GLSpackage[i + 2])
            GLSLocation.push(enumerate + GLSpackage[i + 3])
        }
        const GLSHistoryEmbed = new Discord.MessageEmbed()
            .setTitle(`${courier.toUpperCase()} package number ${pcgID} delivery history:`)
            .setColor('BLUE')
            .addFields(
                {
                    name: 'Date:',
                    value: GLSDate,
                    inline: true,
                },
                {
                    name: 'Status:',
                    value: GLSStatus,
                    inline: true,
                },
                {
                    name: 'Location:',
                    value: GLSLocation,
                    inline: true,
                }
            )
            .addField(
                'React with:',
                [
                    '✅ to add the package to your tracking list!',
                    '❌ to deny adding the package to your tracking liszt!',
                    '💻 to toggle computer mode!',
                    '⬅️️ to go back to general information about the package!',
                ],
                true
            )
        message.channel.send(GLSHistoryEmbed).then(async (embedGLSDelivery) => {
            await embedGLSDelivery.react('✅')
            await embedGLSDelivery.react('❌')
            await embedGLSDelivery.react('💻')
            await embedGLSDelivery.react('⬅️')
            var check = true
            GLSIsComputer = false
            client.on('messageReactionAdd', async (reaction, user) => {
                if (reaction.emoji.name === '✅' && check == true) {
                    if (reaction.message.id == embedGLSDelivery.id) {
                        var inList = await isInList(pcgID, courier)
                        if (inList == false) {
                            check = false
                            var note = await addNote(message, 'Add a Note!')
                            addPcgToList(pcgID, courier, GLSpackage, note)
                            changesSaved = false
                            embedGLSDelivery.delete()
                            sendSuccess(
                                `The ${courier.toUpperCase()} package number ${pcgID} has been added to your tracking liszt!`,
                                'Type `p!list` to remove specific packages!',
                                message,
                                courier,
                                pcgID
                            )
                        } else {
                            countAdd++
                            sendErrorAdding(countAdd, message)
                        }
                    }
                }
                if (reaction.emoji.name === '❌' && check == true) {
                    if (reaction.message.id == embedGLSDelivery.id) {
                        check = false
                        embedGLSDelivery.delete()
                        sendSuccess(
                            'Denied adding the package to your tracking liszt!',
                            'Type `p!add <package number> <courier>` to add a package to ya tracking liszt!',
                            message,
                            null,
                            null
                        )
                    }
                }
                if (reaction.emoji.name === '💻' && check == true) {
                    GLSIsComputer = true
                    if (reaction.message.id == embedGLSDelivery.id) {
                        embedGLSDelivery.delete()
                        computerGLS(GLSpackage, GLSLogo, pcgID, message, isComputerGLS, GLSpackage, courier)
                    }
                }
                if (reaction.emoji.name === '⬅️' && check == true) {
                    if (reaction.message.id == embedGLSDelivery.id) {
                        check = false
                        embedGLSDelivery.delete()
                        const GLSembed = new Discord.MessageEmbed()
                            .setColor('BLUE')
                            .setTitle(`GLS package number ${pcgID}:`)
                            .setThumbnail(GLSLogo)
                            .addFields(
                                {
                                    name: 'Date:',
                                    value: GLSpackage[0] + ' ' + GLSpackage[1],
                                    inline: true,
                                },
                                {
                                    name: 'Status:',
                                    value: GLSpackage[2],
                                    inline: true,
                                },
                                {
                                    name: 'Location:',
                                    value: GLSpackage[3],
                                    inline: true,
                                }
                            )
                            .addField(
                                'React with:',
                                [
                                    '✅ to add the package to your tracking list!',
                                    '❌ to deny adding the package to your tracking liszt!',
                                    'ℹ️ to see the full delivery history!',
                                ],
                                true
                            )
                            .setFooter(
                                'To remove the item from your tracking liszt, navigate to the package you want to delete and react with the trash can emoji!'
                            )
                        //
                        message.channel.send(GLSembed).then(async (embedMessage) => {
                            await embedMessage.react('✅')
                            await embedMessage.react('❌')
                            await embedMessage.react('ℹ️')
                            var check = true
                            //
                            client.on('messageReactionAdd', async (reaction, user) => {
                                if (reaction.emoji.name === '✅' && check == true) {
                                    if (reaction.message.id == embedMessage.id) {
                                        var inList = await isInList(pcgID, courier)
                                        if (inList == false) {
                                            check = false
                                            var note = await addNote(message, 'Add a  Note!')
                                            addPcgToList(pcgID, courier, GLSpackage, note)
                                            changesSaved = false
                                            embedMessage.delete()
                                            sendSuccess(
                                                `The ${courier.toUpperCase()} package number ${pcgID} has been added to your tracking liszt!`,
                                                'Type `p!list` to remove specific packages!',
                                                message,
                                                courier,
                                                pcgID
                                            )
                                        } else {
                                            countAdd++
                                            sendErrorAdding(countAdd, message)
                                        }
                                    }
                                }
                                if (reaction.emoji.name === '❌' && check == true) {
                                    if (reaction.message.id == embedMessage.id) {
                                        check = false
                                        embedMessage.delete()
                                        sendSuccess(
                                            'Denied adding the package to your tracking liszt!',
                                            'Type `p!add <package number> <courier>` to add a package to ya tracking liszt!',
                                            message,
                                            null,
                                            null
                                        )
                                    }
                                }
                                if (reaction.emoji.name === 'ℹ️' && check == true) {
                                    if (reaction.message.id == embedMessage.id) {
                                        check = false
                                        embedMessage.delete()
                                        if (isComputerGLS == false) {
                                            phoneGLS(isComputerGLS, GLSpackage, GLSLogo, courier)
                                        } else if (isComputerGLS == true) {
                                            embedMessage.delete()
                                            computerGLS(GLSpackage, GLSLogo, pcgID, message, isComputerGLS, GLSpackage, courier)
                                        }
                                    }
                                }
                            })
                        })
                    }
                }
            })
        })
    }
    function computerGLS(GLSpcg, GLS_Logo, GLSpcgNum, message, isComputerGLS, GLSpackage, courier) {
        check = false
        if (courier.toLowerCase() == 'gls') {
            var div = 29
        } else {
            var div = 40
        }
        var GLSpcgDate = []
        var GLSpcgStatus = []
        var GLSpcgLocation = []
        for (var j = 0; j < GLSpcg.length; j += 4) {
            var GLSpcgDateTemp = GLSpcg[j] + ' ' + GLSpcg[j + 1]
            var GLSpcgStatusTemp = GLSpcg[j + 2]
            var GLSpcgLocationTemp = GLSpcg[j + 3]
            var GLSpcD = Math.ceil(GLSpcgDateTemp.length / div)
            var GLSpcS = Math.ceil(GLSpcgStatusTemp.length / div)
            var GLSpcL = Math.ceil(GLSpcgLocationTemp.length / div)
            var maxGLS = Math.max(GLSpcD, GLSpcS, GLSpcL)
            if (GLSpcD < maxGLS) {
                GLSpcgDateTemp += addNewLines(maxGLS - GLSpcD)
            }
            if (GLSpcS < maxGLS) {
                GLSpcgStatusTemp += addNewLines(maxGLS - GLSpcS)
            }
            if (GLSpcL < maxGLS) {
                GLSpcgLocationTemp += addNewLines(maxGLS - GLSpcL)
            }
            GLSpcgDate.push(GLSpcgDateTemp + '\n')
            GLSpcgStatus.push(GLSpcgStatusTemp + '\n')
            GLSpcgLocation.push(GLSpcgLocationTemp + '\n')
        }
        const computerViewGLS = new Discord.MessageEmbed()
            .setTitle(`${courier.toUpperCase()} package number ${GLSpcgNum} delivery history:`)
            .setColor('BLUE')
            .addFields(
                {
                    name: 'Date:',
                    value: GLSpcgDate,
                    inline: true,
                },
                {
                    name: 'Status:',
                    value: GLSpcgStatus,
                    inline: true,
                },
                {
                    name: 'Location:',
                    value: GLSpcgLocation,
                    inline: true,
                }
            )
            .addField(
                'React with:',
                [
                    '✅ to add the package to your tracking list!',
                    '❌ to deny adding the package to your tracking liszt!',
                    '📱 to toggle mobile device mode!',
                    '⬅️️ to go back to general information about the package!',
                ],
                true
            )
        message.channel.send(computerViewGLS).then(async (GLScomputerView) => {
            await GLScomputerView.react('✅'),
                await GLScomputerView.react('❌'),
                await GLScomputerView.react('📱'),
                await GLScomputerView.react('⬅️')
            checkComputer = true
            client.on('messageReactionAdd', async (reaction, user) => {
                if (reaction.emoji.name === '✅' && checkComputer == true) {
                    if (reaction.message.id == GLScomputerView.id) {
                        var inList = await isInList(pcgID, courier)
                        if (inList == false) {
                            checkComputer = false
                            var note = await addNote(message, 'Add a Note!')
                            addPcgToList(pcgID, courier, GLSpackage, note)
                            changesSaved = false
                            GLScomputerView.delete()
                            sendSuccess(
                                `The ${courier.toUpperCase()} package number ${pcgID} has been added to your tracking liszt!`,
                                'Type `p!list` to remove specific packages!',
                                message,
                                courier,
                                pcgID
                            )
                        } else {
                            countAdd++
                            sendErrorAdding(countAdd, message)
                        }
                    }
                }
                if (reaction.emoji.name === '❌' && checkComputer == true) {
                    if (reaction.message.id == GLScomputerView.id) {
                        checkComputer = false
                        GLScomputerView.delete()
                        sendSuccess(
                            'Denied adding the package to your tracking liszt!',
                            'Type `p!add <package number> <courier>` to add a package to ya tracking liszt!',
                            message,
                            null,
                            null
                        )
                    }
                }
                if (reaction.emoji.name === '📱' && checkComputer == true) {
                    if (reaction.message.id == GLScomputerView.id) {
                        checkComputer = false
                        GLScomputerView.delete()
                        GLSIsComputer = false
                        phoneGLS(isComputerGLS, GLSpackage, GLS_Logo, courier)
                    }
                }
                if (reaction.emoji.name === '⬅️' && checkComputer == true) {
                    if (reaction.message.id == GLScomputerView.id) {
                        checkComputer = false
                        GLScomputerView.delete()
                        GLSInfo(GLSIsComputer, GLS_Logo, GLSpackage, courier)
                    }
                }
            })
        })
    }
    if (message.content.startsWith(`${prefix}help`)) {
        if (statsChange == true) {
            PTBotStats[0]++
            changeStats(PTBotStats)
        }
        const commandsEmbed = new Discord.MessageEmbed()
            .setTitle('Package Bot Commands:')
            .setDescription([
                '\t- `p!help` - shows this message!',
                '\t- `p!couriers` - shows the list of supported couriers!',
                '\t- `p!stats` - shows statistics about the bot!',
                '\t- `p!track <package number> <courier>` - shows info about the package!',
                '\t- `p!add <package number> <courier>` - add the package to your tracking liszt!',
                '\t- `p!list` - shows your tracking liszt!',
                '\t- `p!init` - turns the bot on!',
                '\t- `p!debug <super secret parms> <other secret parms>` - super secret stuff, only for authorised people!',
            ])
            .setColor('GREEN')
        message.channel.send(commandsEmbed)
    }
    if (message.content.startsWith(`${prefix}stats`)) {
        if (statsChange == true) {
            PTBotStats[0]++
            changeStats(PTBotStats)
        }
        const stastEmbed = new Discord.MessageEmbed()
            .setTitle('PackageBot Statistics:')
            .setDescription([
                `Commands used: ${PTBotStats[0]}`,
                `\`p!list\` used: ${PTBotStats[1]}`,
                `\`p!add\` used: ${PTBotStats[2]}`,
                `\`p!track\` used: ${PTBotStats[3]}`,
                `Packages added*: ${PTBotStats[5]}`,
                `Packages added (all): ${PTBotStats[10]}`,
                `DPD packages added: ${PTBotStats[8]}`,
                `GLS packages added: ${PTBotStats[9]}`,
                `DHL packages added: ${PTBotStats[12]}`,
                `Packages delivered: ${PTBotStats[4]}`,
                `Packages removed: ${PTBotStats[6]}`,
                `Status updated: ${PTBotStats[7]}`,
            ])
            .setFooter('* - only counts unique packages')
            .setColor('GREEN')

        message.channel.send(stastEmbed)
    }
    if (message.content.startsWith(`${debugPrefix} resetStats`) == true) {
        if (message.author.id == '279318606544896000') {
            const resetEmbed = new Discord.MessageEmbed()
                .setTitle('Debug:')
                .setDescription('Are you sure you want to reset all the PTTBot statistics?')
                .setFooter('Debug message - ment for testing!')
                .setColor('DARK_PURPLE')
            message.channel.send(resetEmbed).then(async (resetEmbed) => {
                await resetEmbed.react('✅')
                await resetEmbed.react('❌')

                var sendTime = true

                const filter = (reaction, user) => {
                    return reaction.emoji.name
                }

                const collector = resetEmbed.createReactionCollector(filter, { time: 5000 })

                collector.on('collect', (reaction, user) => {
                    if (reaction.emoji.name == '✅') {
                        resetEmbed.delete()
                        sendTime = false
                        PTBotStats = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, []]
                        sendDebugMessage('Statistics reset!', 'Debug message - ment for testing!', message, null, 'GREEN')
                        changeStats(PTBotStats)
                    }
                    if (reaction.emoji.name == '❌') {
                        resetEmbed.delete()
                        sendTime = false
                        sendDebugMessage('Canceled reseting statistics!', 'Debug message - ment for testing!', message, null, 'GREEN')
                    }
                })

                collector.on('end', (collected) => {
                    if (sendTime == true) {
                        resetEmbed.delete()
                        sendDebugMessage(
                            'Automaticly canceled reseting statistics!',
                            'Next time decide faseter!',
                            message,
                            null,
                            'DARK_PURPLE'
                        )
                    }
                })
            })
        }
    }
    if (message.content.startsWith(`${debugPrefix} toggleStats`) == true) {
        if (message.author.id == '279318606544896000') {
            if (statsChange == true) {
                statsChange = false
                sendDebugMessage('Toggled statistics off!', 'Usually used for testing the bot!', message, null, 'DARK_PURPLE')
            } else {
                statsChange = true
                sendDebugMessage('Toggled statistics on!', 'Usually used for testing the bot!', message, null, 'DARK_PURPLE')
            }
        } else {
            sendDebugMessage(
                'You are not allowed to use debug commands!\nIf you think thats an error go and fix the code!',
                "Spoiler: If you can't do that, that means you'r not allowed to use debug, see?!",
                message,
                null,
                'RED'
            )
        }
    }
    if (message.content.startsWith(`${debugPrefix} add`) == true) {
        if (message.author.id == '279318606544896000') {
            addToList([0])
            var j = message.content.split(`${debugPrefix} add `)
            if (j.length > 1) {
                j = parseInt(j[1]) + 1
            } else {
                j = 2
            }
            var i = 1
            function addElements() {
                setTimeout(function () {
                    if (i % 2 == 0) {
                        addPcgToList('51899526205', 'GLS', ['test', 'test', 'test', 'test'], i)
                    } else {
                        addPcgToList('13269600749337', 'dpd', ['test', 'test', 'test', 'test'], i)
                    }

                    i++
                    if (i < j) {
                        addElements()
                    }
                }, 1000)
            }
            addElements()
            changesSaved = false
            var waitTime = j - 1
            waitTime *= 1000
            setTimeout(() => {
                sendDebugMessage(
                    `Added ${j - 1} packages to your tracking liszt!`,
                    'This message is ment for testing!',
                    message,
                    j,
                    'DARK_PURPLE'
                )
            }, waitTime)
        } else {
            sendDebugMessage(
                'You are not allowed to use debug commands!\nIf you think thats an error go and fix the code!',
                "Spoiler: If you can't do that, that means you'r not allowed to use debug, see?!",
                message,
                null,
                'RED'
            )
        }
    }
    if (message.content.startsWith(`${prefix}track`)) {
        if (statsChange == true) {
            PTBotStats[3]++
            PTBotStats[0]++
            changeStats(PTBotStats)
        }
        countAdd = 0
        client.removeAllListeners('messageReactionAdd')
        var pcgID = message.content.split(`${prefix}track`)[1]
        pcgID = pcgID.split(' ')
        if (pcgID.length < 3) {
            sendError("You didn't specify the courier stupido!", `Try ${prefix}track <tracking number> <courier>.`, message, null, null)
        } else if (couriers.includes(pcgID[2].toLowerCase()) == false) {
            sendError(
                `We don't support the courier "${pcgID[2].toUpperCase()}"!`,
                'Type `p!couriers` to see what couriers we support',
                message,
                pcgID[2],
                null
            )
        } else if (pcgID[2].toLowerCase() == 'gls') {
            GLSIComputer = false
            var courier = pcgID[2]
            pcgID = pcgID[1]
            ;(async () => {
                var GLSpackage = await trackGLS(pcgID)
                var GLSLogo = ''
                if (getRandomInt(2) == 0) {
                    GLSLogo = 'https://gls-group.eu/SK/media/images/logos/Logo_pos_315x128_RGB-download-35141.jpg'
                } else {
                    GLSLogo = 'https://gls-group.eu/SK/media/images/logos/Logo_neg_315x128_RGB-download-35140_M02_4X3.jpg'
                }
                if (GLSpackage != '') {
                    GLSInfo(GLSIsComputer, GLSLogo, GLSpackage, courier)
                } else {
                    sendErrorFooter(
                        `Wrong ${courier.toUpperCase()} package tracking number!`,
                        'Make sure to check if the package number is correct!',
                        message,
                        courier,
                        null
                    )
                }
            })()
        } else if (pcgID[2].toLowerCase() == 'dpd') {
            GLSIComputer = false
            var courier = pcgID[2]
            pcgID = pcgID[1]
            ;(async () => {
                var GLSpackage = await trackDPD(pcgID)
                var GLSLogo = 'https://www.dpd.co.uk/content/about_dpd/press_centre/dpduk-logo-large.png'
                if (GLSpackage != '') {
                    GLSInfo(GLSIsComputer, GLSLogo, GLSpackage, courier)
                } else {
                    sendErrorFooter(
                        `Wrong ${courier.toUpperCase()} package tracking number!`,
                        'Make sure to check if the package number is correct!',
                        message,
                        courier,
                        null
                    )
                }
            })()
        } else if (pcgID[2].toLowerCase() == 'dhl') {
            GLSIComputer = false
            var courier = pcgID[2]
            pcgID = pcgID[1]
            ;(async () => {
                var GLSpackage = await trackDHL(pcgID)
                var GLSLogo = 'https://www.dhl.com/content/dam/dhl/global/core/images/logos/dhl-logo.svg'
                if (GLSpackage != '') {
                    GLSInfo(GLSIsComputer, GLSLogo, GLSpackage, courier)
                } else {
                    sendErrorFooter(
                        `Wrong ${courier.toUpperCase()} package tracking number!`,
                        'Make sure to check if the package number is correct!',
                        message,
                        courier,
                        null
                    )
                }
            })()
        }
    }

    if (message.content.startsWith(`${prefix}couriers`)) {
        client.removeAllListeners('messageReactionAdd')
        const couriersEmbed = new Discord.MessageEmbed()
            .setTitle('Supported Couriers List:')
            .setColor('PURPLE')
            .setDescription(couriersList)
            .setFooter('Support for more couriers coming soon!')
        message.channel.send(couriersEmbed)
    }
    var addCount
    if (message.content.startsWith(`${prefix}add`)) {
        if (statsChange == true) {
            PTBotStats[2]++
            PTBotStats[0]++
            changeStats(PTBotStats)
        }
        client.removeAllListeners('messageReactionAdd')
        var pcgNum = message.content.split(`${prefix}add`)
        if (pcgNum[1] != '') {
            pcgNum = pcgNum[1].split(' ')
            if (pcgNum.length >= 3) {
                var courier = pcgNum[2]
                if (couriers.includes(courier.toLowerCase())) {
                    pcgNum = pcgNum[1]
                    async function addPcg() {
                        if (courier.toLowerCase() == 'gls') {
                            var pcgInfo = await trackGLS(pcgNum)
                        } else if (courier.toLowerCase() == 'dpd') {
                            var pcgInfo = await trackDPD(pcgNum)
                        } else {
                            var pcgInfo = await trackDHL(pcgNum)
                        }
                        if (pcgInfo.length == 0) {
                            sendErrorFooter(
                                `Wrong ${courier.toUpperCase()} package tracking number!`,
                                'Make sure to check if the package number is correct!',
                                message,
                                courier,
                                null
                            )
                        } else {
                            var inList = await isInList(pcgNum, courier)
                            if (inList == true) {
                                sendErrorFooter(
                                    'The package ya trying to add the ya liszt is already in it!',
                                    'Its the newest technique of double tracking! It tells ya that the status changed two times to remind ya!',
                                    message,
                                    null,
                                    null
                                )
                            } else {
                                var note = await addNote(message, 'Add a Note!')
                                addPcgToList(pcgNum, courier, pcgInfo, note)
                                sendSuccess(
                                    `The ${courier.toUpperCase()} package number ${pcgNum} has been added to your tracking liszt!`,
                                    'Type `p!list` to remove specific packages!',
                                    message,
                                    courier,
                                    pcgNum
                                )
                            }
                        }
                    }
                    addPcg()
                } else {
                    sendError(
                        `We don't support the courier "${courier.toUpperCase()}"!`,
                        'Type `p!couriers` to see what couriers we support',
                        message,
                        courier,
                        null
                    )
                }
            } else {
                sendError(
                    'You did not sepcify the tracking number or the courier stupido!',
                    'Proper usage `p!add <trackiing number> <courier>`!',
                    message,
                    null,
                    null
                )
            }
        } else {
            sendError(
                'How am I suppose to add nothing to ya tracking liszt dumbo? Explain!',
                'Proper usage `p!add <tracking number> <courier>`!',
                message,
                null,
                null
            )
        }
    }

    if (message.content.startsWith(`${prefix}list`)) {
        if (statsChange == true) {
            PTBotStats[1]++
            PTBotStats[0]++
            changeStats(PTBotStats)
        }

        client.removeAllListeners('messageReactionAdd')
        var pcgList
        async function showList(page, readFl) {
            if (readFl == true) {
                pcgList = []
                pcgList = await JSON.parse(fs.readFileSync('PackageList.js'))
                readFl = false
            }
            if (pcgList.length == 1) {
                const emptyList = new Discord.MessageEmbed()
                    .setTitle('Empty Liszt!')
                    .setColor('YELLOW')
                    .setDescription([
                        'Ya liszt is empty and you want to see the contents of it!? Good luck with that!',
                        'Type `p!add <tracking number> <courier>` to add a package to ya tracking liszt',
                        'or add it from the tracking GUI by typing `p!track <package number> <courier>`!',
                    ])
                message.channel.send(emptyList)
            } else {
                var fields = []
                var fieldsNum = pcgList[page][0]
                for (var i = 0; i < fieldsNum; i++) {
                    var ltr = ''
                    if (i == 0) {
                        ltr = 'A'
                    }
                    if (i == 1) {
                        ltr = 'B'
                    }
                    if (i == 2) {
                        ltr = 'C'
                    }
                    if (i == 3) {
                        ltr = 'D'
                    }
                    if (i == 4) {
                        ltr = 'E'
                    }
                    fields.push({
                        name: `----------------------------------------------`,
                        value: `**${ltr}. ${pcgList[page][i + 1][1].toUpperCase()} Package Number ${pcgList[page][i + 1][0]}**:\n${
                            pcgList[page][i + 1][3]
                        }`,
                    })
                    fields.push({
                        name: 'Date:',
                        value: pcgList[page][i + 1][2][0] + ' ' + pcgList[page][i + 1][2][1],
                        inline: true,
                    })
                    fields.push({
                        name: 'Status:',
                        value: pcgList[page][i + 1][2][2],
                        inline: true,
                    })
                    fields.push({
                        name: 'Location:',
                        value: pcgList[page][i + 1][2][3],
                        inline: true,
                    })
                }
                const listPageEmbed = new Discord.MessageEmbed()
                    .setTitle('Your Tracking Liszt:')
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
                    .addFields(fields)
                    .setFooter(`Page ${page}/${pcgList[0]} `)
                message.channel.send(listPageEmbed).then(async (listPage) => {
                    if (page > 1) {
                        await listPage.react('⬅️')
                    }
                    for (var j = 0; j < pcgList[page][0]; j++) {
                        if (j + 1 == 1) {
                            await listPage.react('🇦')
                        }
                        if (j + 1 == 2) {
                            await listPage.react('🇧')
                        }
                        if (j + 1 == 3) {
                            await listPage.react('🇨')
                        }
                        if (j + 1 == 4) {
                            await listPage.react('🇩')
                        }
                        if (j + 1 == 5) {
                            await listPage.react('🇪')
                        }
                    }
                    await listPage.react('ℹ️')
                    await listPage.react('🗑️')
                    await listPage.react('📝')
                    if (pcgList[0] > page) {
                        await listPage.react('➡️')
                    }
                    var tempSelected
                    async function showPcgList(pcgSelected, cmp, rdFl, selectedCheck) {
                        if (rdFl == true) {
                            pcgList = await JSON.parse(fs.readFileSync('PackageList.js'))
                        }
                        if (selectedCheck == false) {
                            tempSelected = selected.slice(0)
                        }
                        var curir = pcgList[page][pcgSelected][1]
                        var sendPcgInfo = true
                        if (selected[tempSelected.indexOf(pcgSelected)] instanceof Array == true) {
                            packageInfo = selected[tempSelected.indexOf(pcgSelected)]
                        } else {
                            if (curir.toLowerCase() == 'gls') {
                                packageInfo = pcgList[page][pcgSelected][2]
                            } else {
                                packageInfo = pcgList[page][pcgSelected][2]
                            }
                            if (packageInfo.length == 0) {
                                sendPcgInfo = false
                                var dscrStr = `Failed to pull data from ${curir.toUpperCase()} servers!`
                                sendErrorFooterTimeout(dscrStr, 'Returning to your tracking liszt!', message, null, null, 5000)
                                setTimeout(() => {
                                    showList(page, false)
                                }, 5000)
                            }
                            selected[tempSelected.indexOf(pcgSelected)] = packageInfo
                        }
                        var Date = []
                        var Status = []
                        var Location = []
                        if (cmp == false) {
                            for (var i = 0; i < packageInfo.length; i += 4) {
                                var enumerate = i / 4 + 1
                                enumerate = enumerate.toString()
                                enumerate += '. '
                                Date.push(enumerate + packageInfo[i] + ' ' + packageInfo[i + 1])
                                Status.push(enumerate + packageInfo[i + 2])
                                Location.push(enumerate + packageInfo[i + 3])
                            }
                        } else {
                            if (pcgList[page][pcgSelected][1].toLowerCase() == 'gls') {
                                var div = 31
                            } else {
                                var div = 40
                            }
                            for (var j = 0; j < packageInfo.length; j += 4) {
                                var pcgDateTemp = packageInfo[j] + ' ' + packageInfo[j + 1]
                                var pcgStatusTemp = packageInfo[j + 2]
                                var pcgLocationTemp = packageInfo[j + 3]
                                var pcD = Math.ceil(pcgDateTemp.length / div)
                                var pcS = Math.ceil(pcgStatusTemp.length / div)
                                var pcL = Math.ceil(pcgLocationTemp.length / div)
                                var maxNum = Math.max(pcD, pcS, pcL)
                                if (j == 0) {
                                    var pcgDateTempFirst = pcgDateTemp
                                    var pcgStatusTempFirst = pcgStatusTemp
                                    var pcgLocationTempFirst = pcgLocationTemp
                                }
                                if (pcD < maxNum) {
                                    pcgDateTemp += addNewLines(maxNum - pcD)
                                }
                                if (pcS < maxNum) {
                                    pcgStatusTemp += addNewLines(maxNum - pcS)
                                }
                                if (pcL < maxNum) {
                                    pcgLocationTemp += addNewLines(maxNum - pcL)
                                }
                                Date.push(pcgDateTemp + '\n')
                                Status.push(pcgStatusTemp + '\n')
                                Location.push(pcgLocationTemp + '\n')
                            }
                        }
                        if (sendPcgInfo == true) {
                            if (cmp == false) {
                                var computerPhoneMode = '💻 to toggle phone mode!'
                            } else {
                                var computerPhoneMode = '📱 to toggle computer mode!'
                            }
                            const pcgInfo = new Discord.MessageEmbed()
                                .setTitle(`${curir.toUpperCase()} package number ${pcgList[page][pcgSelected][0]} delivery history:`)
                                .setDescription(pcgList[page][pcgSelected][3])
                                .setColor('BLUE')
                                //setLogo
                                .addFields(
                                    {
                                        name: 'Date:',
                                        value: Date,
                                        inline: true,
                                    },
                                    {
                                        name: 'Status:',
                                        value: Status,
                                        inline: true,
                                    },
                                    {
                                        name: 'Location:',
                                        value: Location,
                                        inline: true,
                                    }
                                )
                                .addField(
                                    'React with:',
                                    [
                                        '⬅️ to go back to your tracking liszt!',
                                        computerPhoneMode,
                                        '🗑️ to delete the package from your tracking liszt!',
                                        '📝 to edit the package note!',
                                        '◀️ or ▶️ to go back and forth between selected packages!',
                                    ],
                                    true
                                )
                            message.channel.send(pcgInfo).then(async (pcgDetails) => {
                                if (selected.length == 0) {
                                    var isPage = 0
                                    await pcgDetails.react('⬅️')
                                    if (cmp == false) {
                                        await pcgDetails.react('💻')
                                    } else {
                                        await pcgDetails.react('📱')
                                    }
                                    await pcgDetails.react('🗑️')
                                    await pcgDetails.react('📝')
                                } else if (
                                    tempSelected.indexOf(pcgSelected) < selected.length - 1 &&
                                    tempSelected.indexOf(pcgSelected) > 0
                                ) {
                                    var isPage = 1
                                    await pcgDetails.react('⬅️')
                                    if (cmp == false) {
                                        await pcgDetails.react('💻')
                                    } else {
                                        await pcgDetails.react('📱')
                                    }
                                    await pcgDetails.react('🗑️')
                                    await pcgDetails.react('📝')
                                    await pcgDetails.react('◀️')
                                    await pcgDetails.react('▶️')
                                } else if (selected.length == 1) {
                                    var isPage = 3
                                    await pcgDetails.react('⬅️')
                                    if (cmp == false) {
                                        await pcgDetails.react('💻')
                                    } else {
                                        await pcgDetails.react('📱')
                                    }
                                    await pcgDetails.react('🗑️')
                                    await pcgDetails.react('📝')
                                } else if (tempSelected.indexOf(pcgSelected) < selected.length - 1) {
                                    var isPage = 2
                                    await pcgDetails.react('⬅️')
                                    if (cmp == false) {
                                        await pcgDetails.react('💻')
                                    } else {
                                        await pcgDetails.react('📱')
                                    }
                                    await pcgDetails.react('🗑️')
                                    await pcgDetails.react('📝')
                                    await pcgDetails.react('▶️')
                                } else {
                                    var isPage = 4
                                    await pcgDetails.react('⬅️')

                                    if (cmp == false) {
                                        await pcgDetails.react('💻')
                                    } else {
                                        await pcgDetails.react('📱')
                                    }
                                    await pcgDetails.react('🗑️')
                                    await pcgDetails.react('📝')
                                    await pcgDetails.react('◀️')
                                }
                                client.on('messageReactionAdd', async (reaction, user) => {
                                    if (reaction.emoji.name == '⬅️' && reaction.message.id == pcgDetails.id) {
                                        pcgDetails.delete()
                                        showList(page, rdFl)
                                    }
                                    if (reaction.emoji.name == '▶️' && reaction.message.id == pcgDetails.id) {
                                        if (isPage == 1 || isPage == 2) {
                                            pcgDetails.delete()
                                            showPcgList(tempSelected[tempSelected.indexOf(pcgSelected) + 1], cmp, rdFl, true)
                                        }
                                    }
                                    if (reaction.emoji.name == '◀️' && reaction.message.id == pcgDetails.id) {
                                        if (isPage == 1 || isPage == 4) {
                                            pcgDetails.delete()
                                            showPcgList(tempSelected[tempSelected.indexOf(pcgSelected) - 1], cmp, rdFl, true)
                                        }
                                    }
                                    if (reaction.emoji.name == '💻' && reaction.message.id == pcgDetails.id) {
                                        if (cmp == false) {
                                            pcgDetails.delete()
                                            showPcgList(pcgSelected, true, rdFl, true)
                                        }
                                    }
                                    if (reaction.emoji.name == '📱' && reaction.message.id == pcgDetails.id) {
                                        if (cmp == true) {
                                            pcgDetails.delete()
                                            showPcgList(pcgSelected, false, rdFl, true)
                                        }
                                    }
                                    if (reaction.emoji.name == '🗑️' && reaction.message.id == pcgDetails.id) {
                                        if (listnerChange == true) {
                                            sendErrorFooterTimeout(
                                                'We are checking the status of a package in your tracking liszt right now!',
                                                'Try again in a second!',
                                                message,
                                                null,
                                                null,
                                                5000
                                            )
                                        } else {
                                            var tempSelectedIndex = tempSelected.indexOf(pcgSelected)

                                            for (var i = tempSelectedIndex; i < selected.length; i++) {
                                                if (i > tempSelectedIndex) {
                                                    if (Number.isInteger(selected[i]) == true) {
                                                        selected[i]--
                                                    }
                                                    tempSelected[i]--
                                                }
                                            }
                                            selected.splice(tempSelectedIndex, 1)
                                            tempSelected.splice(tempSelectedIndex, 1)
                                            removePcgFromList(page, pcgSelected)
                                            await removeFromList(page, pcgSelected)
                                            if (page == pcgList[0] && page != 1) {
                                                if (selected.length == 0 && pcgList[page][0] == 1) {
                                                    page--
                                                }
                                            }
                                            pcgDetails.delete()
                                            if (selected.length == 0) {
                                                showList(page, true)
                                            } else {
                                                showPcgList(tempSelected[0], cmp, true, true)
                                            }
                                        }
                                    }
                                    if (reaction.emoji.name == '📝' && reaction.message.id == pcgDetails.id) {
                                        if (listnerChange == true) {
                                            sendErrorFooterTimeout(
                                                'We are checking the status of a package in your tracking liszt right now!',
                                                'Try again in a second!',
                                                message,
                                                null,
                                                null,
                                                5000
                                            )
                                        } else {
                                            pcgDetails.delete()
                                            var note = await addNote(message, 'Edit the package note!')
                                            var newList = pcgList.slice(0)
                                            selected[tempSelected.indexOf(pcgSelected)] = tempSelected[tempSelected.indexOf(pcgSelected)]
                                            newList[page][tempSelected[tempSelected.indexOf(pcgSelected)]][3] = note
                                            addToList(newList)
                                            var loopMore = true
                                            function listenChanges() {
                                                setTimeout(function () {
                                                    if (changesSaved == true) {
                                                        loopMore = false
                                                        showPcgList(pcgSelected, cmp, true, true)
                                                        changesSaved = false
                                                    }
                                                    if (loopMore == true) {
                                                        listenChanges()
                                                    }
                                                }, 1000)
                                            }
                                            listenChanges()
                                        }
                                    }
                                })
                            })
                        }
                    }
                    var selected = []
                    client.on('messageReactionAdd', async (reaction, user) => {
                        if (reaction.emoji.name == '🇦' && reaction.message.id == listPage.id) {
                            if (selected.includes(1) == false) {
                                selected.push(1)
                            }
                        }
                        if (reaction.emoji.name == '🇧' && reaction.message.id == listPage.id) {
                            if (selected.includes(2) == false) {
                                selected.push(2)
                            }
                        }
                        if (reaction.emoji.name == '🇨' && reaction.message.id == listPage.id) {
                            if (selected.includes(3) == false) {
                                selected.push(3)
                            }
                        }
                        if (reaction.emoji.name == '🇩' && reaction.message.id == listPage.id) {
                            if (selected.includes(4) == false) {
                                selected.push(4)
                            }
                        }
                        if (reaction.emoji.name == '🇪' && reaction.message.id == listPage.id) {
                            if (selected.includes(5) == false) {
                                selected.push(5)
                            }
                        }
                        if (reaction.emoji.name == 'ℹ️' && reaction.message.id == listPage.id) {
                            if (selected.length <= 0) {
                                errorID = sendErrorFooterTimeout(
                                    'Select a package first!',
                                    'You can select multiple packages at once!',
                                    message,
                                    null,
                                    null,
                                    5000
                                )
                            } else {
                                listPage.delete()
                                showPcgList(selected[0], false, false, false)
                            }
                        }
                        if (reaction.emoji.name == '➡️' && reaction.message.id == listPage.id) {
                            if (pcgList[0] > page) {
                                listPage.delete()
                                showList(page + 1, false)
                            }
                        }
                        if (reaction.emoji.name == '⬅️' && reaction.message.id == listPage.id) {
                            if (page > 1) {
                                listPage.delete()
                                showList(page - 1, false)
                            }
                        }
                        if (reaction.emoji.name == '🗑️' && reaction.message.id == listPage.id) {
                            if (selected.length == 0) {
                                listPage.delete()
                                const questionEmbed = new Discord.MessageEmbed()
                                    .setTitle('Are you sure you want to delete all packages from your tracking liszt?')
                                    .setDescription('React with ✅ to confirm!\nReact with ❌ to cancel!')
                                    .setFooter('NOTE! Deleting every package IS PERMANENT!')
                                    .setColor('GREEN')
                                message.channel.send(questionEmbed).then(async (qstnEmbed) => {
                                    await qstnEmbed.react('✅')
                                    await qstnEmbed.react('❌')
                                    client.on('messageReactionAdd', async (reaction, user) => {
                                        if (reaction.emoji.name == '✅' && reaction.message.id == qstnEmbed.id) {
                                            if (listnerChange == true) {
                                                sendErrorFooterTimeout(
                                                    'We are checking the status of a package in your tracking liszt right now!',
                                                    'Try again in a second!',
                                                    message,
                                                    null,
                                                    null,
                                                    5000
                                                )
                                            } else {
                                                if (statsChange == true) {
                                                    var numDeleted = pcgList[0] - 1
                                                    numDeleted *= 5
                                                    numDeleted += pcgList[pcgList[0]][0]
                                                    PTBotStats[6] += numDeleted
                                                    changeStats(PTBotStats)
                                                }
                                                qstnEmbed.delete()
                                                await addToList([0])
                                                sendSuccess(
                                                    'Deleted every package from your tracking liszt!',
                                                    [
                                                        'Type `p!add <package number> <courier>` to add a package to your tracking liszt',
                                                        ' or add it from the tracking GUI by typing `p!track <package number> <courier>`!',
                                                    ],
                                                    message,
                                                    null,
                                                    null
                                                )
                                            }
                                        }
                                        if (reaction.emoji.name == '❌' && reaction.message.id == qstnEmbed.id) {
                                            qstnEmbed.delete()
                                            sendSuccessFooterTimeout(
                                                'Canceled deleting every package from your tracking liszt!',
                                                'You will be taken back to your tracking liszt in 5 seconds! 📦',
                                                'Your packages are in a safe place!',
                                                message,
                                                null,
                                                null,
                                                5000,
                                                'YELLOW'
                                            )
                                            setTimeout(() => {
                                                showList(page, false)
                                            }, 5000)
                                        }
                                    })
                                })
                            } else {
                                if (listnerChange == true) {
                                    sendErrorFooterTimeout(
                                        'We are checking the status of a package in your tracking liszt right now!',
                                        'Try again in a second!',
                                        message,
                                        null,
                                        null,
                                        5000
                                    )
                                } else {
                                    listPage.delete()
                                    var selectedOne = false
                                    if (selected.length == 1) {
                                        selected = selected[0]
                                        if (pcgList[page][0] == 1) {
                                            selectedOne = true
                                        }
                                    }
                                    removePcgFromList(page, selected)
                                    await removeFromList(page, selected)
                                    if (page == pcgList[0] && page != 1) {
                                        if (selected.length == pcgList[page][0] || selectedOne == true) {
                                            page--
                                        }
                                    }

                                    showList(page, true)
                                }
                            }
                        }
                        if (reaction.emoji.name == '📝' && reaction.message.id == listPage.id) {
                            if (listnerChange == true) {
                                sendErrorFooterTimeout(
                                    'We are checking the status of a package in your tracking liszt right now!',
                                    'Try again in a second!',
                                    message,
                                    null,
                                    null,
                                    5000
                                )
                            } else {
                                if (selected.length > 1) {
                                    sendErrorFooterTimeout(
                                        'You can only edit one package note at a time!',
                                        'Please select one package and try again!',
                                        message,
                                        null,
                                        null,
                                        5000
                                    )
                                } else if (selected.length == 0) {
                                    sendErrorFooterTimeout(
                                        "You didn't select any package!",
                                        'Please try again after selecting one!',
                                        message,
                                        null,
                                        null,
                                        5000
                                    )
                                } else {
                                    listPage.delete()
                                    var note = await addNote(message, 'Edit the package note!')
                                    var newList = pcgList.slice(0)
                                    newList[page][selected[0]][3] = note
                                    addToList(newList)
                                    var loopMore = true
                                    function listenChanges() {
                                        setTimeout(function () {
                                            if (changesSaved == true) {
                                                loopMore = false
                                                showList(page, true)
                                                changesSaved = false
                                            }
                                            if (loopMore == true) {
                                                listenChanges()
                                            }
                                        }, 1000)
                                    }
                                    listenChanges()
                                }
                            }
                        }
                    })
                    client.on('messageReactionRemove', (reaction, user) => {
                        if (reaction.emoji.name == '🇦' && reaction.message.id == listPage.id) {
                            if (selected.includes(1) == true) {
                                selected.splice(selected.indexOf(1), 1)
                            }
                        }
                        if (reaction.emoji.name == '🇧' && reaction.message.id == listPage.id) {
                            if (selected.includes(2) == true) {
                                selected.splice(selected.indexOf(2), 1)
                            }
                        }
                        if (reaction.emoji.name == '🇨' && reaction.message.id == listPage.id) {
                            if (selected.includes(3) == true) {
                                selected.splice(selected.indexOf(3), 1)
                            }
                        }
                        if (reaction.emoji.name == '🇩' && reaction.message.id == listPage.id) {
                            if (selected.includes(4) == true) {
                                selected.splice(selected.indexOf(4), 1)
                            }
                        }
                        if (reaction.emoji.name == '🇪' && reaction.message.id == listPage.id) {
                            if (selected.includes(5) == true) {
                                selected.splice(selected.indexOf(5), 1)
                            }
                        }
                        if (reaction.emoji.name == 'ℹ️' && reaction.message.id == listPage.id) {
                            if (selected.length <= 0) {
                                errorID = sendErrorFooterTimeout(
                                    'Select a package first!',
                                    'You can select multiple packages at once!',
                                    message,
                                    null,
                                    null,
                                    5000
                                )
                            } else {
                                listPage.delete()
                                showPcgList(selected[0], false, false, false)
                            }
                        }
                    })
                })
            }
        }
        showList(1, true)
    }
})

client.login(token)
