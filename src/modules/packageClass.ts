import mongoose = require('mongoose')
const trackPackage = require('./trackPackage')

export interface PackageInterface {
    packageNum: string
    courier: string
    status: string[]
    note: string
    deleted: boolean
    getCurrentStatus(): Promise<any>
}

interface packageData {
    packageNum: string
    courier: string
    status: string[]
    note: string
    deleted: boolean
}

class Package implements PackageInterface {
    packageNum: string
    courier: string
    status: string[]
    note: string
    deleted: boolean

    constructor(data: packageData) {
        if (data.packageNum == undefined) {
            throw new Error('You did not specify the package number!\nProper usage `(p!add / p!track) <package number> <courier>`').message
        }

        if (data.courier.toLowerCase() != 'dpd' && data.courier.toLowerCase() != 'gls') {
            if (data.courier == undefined) {
                throw new Error(`You did not specify the courier!\nProper usage \`(p!add / p!track) <package number> <courier>\``).message
            }
            throw new Error(`We don't support the courier "${data.courier}"!
Type \`p!couriers\` to see which couriers we support!`).message
        }
        this.packageNum = data.packageNum
        this.courier = data.courier.toLowerCase()
        this.note = data.note

        this.deleted = data.deleted

        if (data.deleted == undefined) {
            this.deleted = false
        }
        if (data.status != undefined) {
            this.status = data.status
        }
    }

    async getCurrentStatus(): Promise<any> {
        try {
            const currentStatus = await trackPackage(this.packageNum, this.courier)
            this.status = currentStatus
            return currentStatus
        } catch (err) {
            throw new Error(err).message
        }
    }
}

const PackageSchema = new mongoose.Schema({
    packageNum: String,
    courier: String,
    status: Array,
    note: String,
    deleted: Boolean,
})

module.exports.PackageModel = mongoose.model('PackageModel', PackageSchema)
module.exports.Package = Package
