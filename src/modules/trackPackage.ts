export {}

const trackDPD = require('./trackDPD.js')
const trackGLS = require('./trackGLS.js')

const trackPackage = async (packageNum: string, courier: string) => {
    var status: string[] = []
    switch (courier) {
        case 'dpd':
            status = await trackDPD(packageNum)
            break
        case 'gls':
            status = await trackGLS(packageNum)
            break
        default:
            throw `We don't support the courier "${courier}"!\n
            Type \`p!couriers\` to see which couriers we support!`
    }
    if (status == []) {
        throw 'Incorrect'
    }
    return status
}

module.exports = trackPackage
