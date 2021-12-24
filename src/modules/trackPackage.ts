export {}

const trackDPD = require('./trackDPD')
const trackGLS = require('./trackGLS')
const trackUPS = require('./trackUPS')
import { getSettings } from './settings'

const trackPackage = async (packageNum: string, courier: string) => {
    var status: string[] = []

    const settings = await getSettings()

    switch (courier.toLowerCase()) {
        case 'dpd':
            status = await trackDPD(packageNum, settings.lang)
            break
        case 'gls':
            status = await trackGLS(packageNum, settings.lang)
            break
        case 'ups':
            status = await trackUPS(packageNum, settings.lang)
            break
    }

    if (status[1] != '') {
        throw new Error(`Incorrect ${courier} package tracking number (${packageNum})!
{footer}Make sure to check if the package number is correct!`).message
    }

    return status[0]
}

module.exports = trackPackage
