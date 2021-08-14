export {}

const { PackageModel } = require('./packageClass')

const deletePackage = async (packageNums: string[], markAsDeleted: boolean = true) => {
    if (packageNums.length == 0) {
        await PackageModel.deleteMany({}, function (err: string) {
            if (err) console.log(err)
        })
    } else {
        if (markAsDeleted == true) {
            await PackageModel.updateMany({ packageNum: { $in: packageNums } }, { deleted: true }, function (err: string) {
                if (err) console.log(err)
            })
        } else {
            await PackageModel.deleteMany({ packageNum: { $in: packageNums } }, function (err: string) {
                if (err) console.log(err)
            })
        }
    }
}

export default deletePackage
