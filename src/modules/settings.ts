export {}

const mongoose = require('mongoose')

const SettingsSchema = new mongoose.Schema({
    id: Number,
    lang: String,
})

const SettingsModel = mongoose.model('SettingsModel', SettingsSchema)

interface Settings {
    id: number
    lang: string
}

export const updateSettings = async (lang: string = '') => {
    const exists = await SettingsModel.findOne({ id: 0 })

    if (exists == null) {
        const newSettings = new SettingsModel({ id: 0, lang: lang })

        try {
            await newSettings.save()
        } catch (err) {
            console.log(err)
        }
    } else {
        try {
            mongoose.set('useFindAndModify', false)
            await SettingsModel.findOneAndUpdate({ id: 0 }, { id: 0, lang: lang == '' ? exists.lang : lang })
        } catch (err) {
            console.log(err)
        }
    }
}

export const getSettings = async (): Promise<Settings> => {
    var settings: Settings = await SettingsModel.findOne({ id: 0 })

    if (settings == null) {
        const newSettings = new SettingsModel({ id: 0, lang: 'EN' })

        try {
            await newSettings.save()
        } catch (err) {
            console.log(err)
        }

        return { id: 0, lang: 'EN' }
    }

    return settings
}
