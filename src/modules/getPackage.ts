export {}

import { PackageInterface } from './packageClass'
const { PackageModel, Package } = require('./packageClass')

const getPackage = async (packageNum: string = '') => {
    if (packageNum == '') {
        try {
            const data: any = await PackageModel.find()
            var newData: PackageInterface[] = []

            for (var i: number = 0; i < data.length; i++) {
                const pcg: PackageInterface = new Package(data[i])
                newData.push(pcg)
            }

            return newData
        } catch (err) {
            console.log(err)
        }
    } else {
        try {
            return await PackageModel.findOne({ packageNum: packageNum })
        } catch (err) {
            console.log(err)
        }
    }
}

module.exports = getPackage
