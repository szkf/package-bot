class PackageBotError extends Error {
    errorMsgDescription: string
    errorMsgFooter: string | undefined

    constructor(errorMsgDescription: string, errorMsgFooter: string | undefined = undefined) {
        super()
        this.name = 'PackageBotError'
        this.errorMsgDescription = errorMsgDescription
        this.errorMsgFooter = errorMsgFooter
    }
}

export default PackageBotError
