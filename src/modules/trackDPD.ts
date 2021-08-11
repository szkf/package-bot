export {}

const puppeteer = require('puppeteer')

const trackDPD = async (packageNum: string) => {
    let browser = await puppeteer.launch()
    let page = await browser.newPage()

    await page.goto(`https://tracktrace.dpd.com.pl/parcelDetails?typ=1&p1=${packageNum}`, {
        waitUntil: 'networkidle2',
    })

    await page.addScriptTag({
        url: 'https://ajax.googleapis.com/ajax/libs/jquery/1.6.3/jquery.min.js',
    })

    let packages = await page.evaluate(() => {
        var pcgs: string[] = []
        var tempPcgs: string[] = []

        var correctNumber: string = $('p').text()
        if (correctNumber.startsWith('Wprowadzono błędny numer przesyłki') == false) {
            correctNumber = ''
        }

        $('td').each(function () {
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
        return [pcgs, correctNumber]
    })

    await browser.close()
    return packages
}

module.exports = trackDPD
