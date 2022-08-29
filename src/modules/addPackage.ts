export {}

import { TextChannel } from 'discord.js'
import PackageBotError from './packageBotError'
import { PackageInterface } from './packageClass'
const { PackageModel } = require('./packageClass')
const getPackage = require('./getPackage')
const getNote = require('./getNote')
const updatePackage = require('./updatePackage')

const addPackage = async (data: PackageInterface, channel: TextChannel, debug: boolean = false) => {
    const pcgExists = await getPackage(data.packageNum)

    if (debug == false) {
        if (pcgExists != null) {
            if (pcgExists.deleted == true) {
                const note = await getNote(channel)

                if (note == '') {
                    throw new PackageBotError('No note added!\nFalied to add package to list.')
                }

                await updatePackage(data.packageNum, [], note)
                return
            } else {
                throw new PackageBotError(`The package you trying to add to the list is already in it!`)
            }
        }

        try {
            await data.getCurrentStatus()
        } catch (err) {
            throw err
        }

        const note = await getNote(channel)

        if (note == '') {
            throw new PackageBotError('No note added!\nFalied to add package to list.')
        }

        data.note = note
    }

    const pcg = new PackageModel({
        packageNum: data.packageNum,
        courier: data.courier,
        status: data.status,
        note: data.note,
        deleted: false,
    })

    try {
        await pcg.save()
        console.log('\x1b[34mAdded Package!\x1b[0m')
        return
    } catch (err) {
        throw err
    }
}

module.exports = addPackage
