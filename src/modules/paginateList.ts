import { PackageInterface } from './packageClass'

const paginateList = (list: PackageInterface[]) => {
    var paginatedList = [] // [[Package, Package, Package, Package, Package], ...]

    for (var i: number = 0; i < list.length; i += 5) {
        paginatedList.push(list.splice(i, 5))
    }

    return paginatedList
}

module.exports = paginateList
