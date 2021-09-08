export {}

const puppeteer = require('puppeteer')

const trackUPS = async (packageNum: string) => {
    let browser = await puppeteer.launch({})
    let page = await browser.newPage()

    await page.setUserAgent('Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/93.0.4577.0 Safari/537.36')
    await page.setExtraHTTPHeaders({
        'Accept-Language': 'en',
    })

    await page.goto(`https://www.ups.com/track?loc=pl_PL&tracknum=${packageNum}`, {
        waitUntil: 'networkidle2',
    })

    await page.addScriptTag({
        url: 'https://ajax.googleapis.com/ajax/libs/jquery/1.6.3/jquery.min.js',
    })

    await page.click('.radio-button')
    await page.click('#consent_prompt_submit')

    await page.waitForNavigation({
        waitUntil: 'networkidle2',
    })

    await page.click('#st_App_View_Details')

    let packages = await page.evaluate(() => {
        var pcgs: string[] = []
        var tempPcgs: string[] = []
        const correctNumber: any = $('#stApp_txtAdditionalInfoTrackingNumber').text().split('\n')[0]

        $('td').each(function () {
            if (this.id.startsWith('stApp_activities') || this.id.startsWith('stApp_milestone')) {
                tempPcgs.push($(this).text())
            }
        })

        for (var i = 0; i < tempPcgs.length; i++) {
            if (i % 2 == 0) {
                pcgs.push(tempPcgs[i].slice(0, 10))
                pcgs.push(tempPcgs[i].slice(9))
            } else {
                var temp = tempPcgs[i]
                temp = temp.replace(/ {2,}/g, '')
                var tempArr: string[] = temp.split('\n')
                pcgs.push(tempArr[1])
                pcgs.push(tempArr[2])
            }
        }

        return [pcgs, correctNumber]
    })

    if (packages[1].toLowerCase() == packageNum.toLowerCase()) {
        packages[1] = ''
    }

    await browser.close()
    return packages
}

module.exports = trackUPS