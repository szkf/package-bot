export {}

import { TextChannel } from 'discord.js'
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
                    throw new Error('No note added!\nFalied to add package to list.').message
                }

                await updatePackage(data.packageNum, [], note)
                return
            } else {
                throw new Error(`The package you trying to add to the list is already in it!
{footer}Its the newest technique of double tracking! It tells ya that the status changed two times to remind ya!`).message
            }
        }

        try {
            await data.getCurrentStatus()
        } catch (err) {
            throw new Error(err).message
        }

        const note = await getNote(channel)

        if (note == '') {
            throw new Error('No note added!\nFalied to add package to list.').message
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
        console.log(err)
        return
    }
}

module.exports = addPackage
