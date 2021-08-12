export {}

const { PackageModel } = require('./packageClass')

const deletePackage = async (packageNums: string[]) => {
    await PackageModel.deleteMany({ packageNum: { $in: packageNums } }, function (err: string) {
        if (err) console.log(err)
    })
}

export default deletePackage
