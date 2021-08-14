export {}

const trackDPD = require('./trackDPD.js')
const trackGLS = require('./trackGLS.js')

const trackPackage = async (packageNum: string, courier: string) => {
    var status: string[] = []
    switch (courier.toLowerCase()) {
        case 'dpd':
            status = await trackDPD(packageNum)
            break
        case 'gls':
            status = await trackGLS(packageNum)
            break
    }

    if (status[1] != '') {
        throw new Error(`Incorrect ${courier} package tracking number (${packageNum})!
{footer}Make sure to check if the package number is correct!`).message
    }

    return status[0]
}

module.exports = trackPackage
