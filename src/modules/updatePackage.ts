const { PackageModel } = require('./packageClass')
const mongoose = require('mongoose')

const updatePackage = async (packageNum: string, newStatus: string[], deleted: boolean = false) => {
    mongoose.set('useFindAndModify', false)
    await PackageModel.findOneAndUpdate({ packageNum: packageNum }, { status: newStatus, deleted: deleted })
}

module.exports = updatePackage
