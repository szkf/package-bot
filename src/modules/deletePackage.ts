export {}

const { PackageModel } = require('./packageClass')

const deletePackage = async (packageNums: string[]) => {
    if (packageNums.length == 0) {
        await PackageModel.deleteMany({}, function (err: string) {
            if (err) console.log(err)
        })
    } else {
        await PackageModel.deleteMany({ packageNum: { $in: packageNums } }, function (err: string) {
            if (err) console.log(err)
        })
    }
}

export default deletePackage
