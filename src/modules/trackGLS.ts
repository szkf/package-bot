export {}

const puppeteer = require('puppeteer')

const trackGLS = async (packageNum: string, lang: string) => {
    let browser = await puppeteer.launch()
    let page = await browser.newPage()

    var trackURL: string = `https://gls-group.eu/GROUP/en/parcel-tracking?match=${packageNum}`

    if (lang == 'PL') trackURL = `https://gls-group.eu/PL/pl/sledzenie-paczek?match=${packageNum}`

    await page.goto(trackURL, {
        waitUntil: 'networkidle2',
    })

    await page.addScriptTag({
        url: 'https://ajax.googleapis.com/ajax/libs/jquery/1.6.3/jquery.min.js',
    })

    let packages = await page.evaluate(() => {
        var pcgs: string[] = []
        var tempPcgs: string[] = []
        const correctNumber: any = $('p.mb-0').text()
        $('div.history-list-item-data').each(function () {
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
        return [pcgs, correctNumber]
    })

    await browser.close()
    return packages
}

module.exports = trackGLS
