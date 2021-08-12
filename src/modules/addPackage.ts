export {}

import { PackageInterface } from './packageClass'
const { PackageModel } = require('./packageClass')
const getPackage = require('./getPackage')

const addPackage = async (data: PackageInterface) => {
    const pcgExists = await getPackage(data.packageNum)

    if (pcgExists != null) {
        throw new Error(`The package you trying to add to the list is already in it!
Its the newest technique of double tracking! It tells ya that the status changed two times to remind ya!`).message
    }

    try {
        await data.getCurrentStatus()
    } catch (err) {
        console.log(err)
        return new Error(err).message
    }

    const pcg = new PackageModel({
        packageNum: data.packageNum,
        courier: data.courier,
        status: data.status,
        note: data.note,
    })

    try {
        await pcg.save()
        console.log('\x1b[34mAdded Package!\x1b[0m')

        return
    } catch (err) {
        console.log(err)
        return
    }
}

module.exports = addPackage
