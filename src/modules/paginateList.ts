import { PackageInterface } from './packageClass'

const paginateList = (list: PackageInterface[]) => {
    var paginatedList = [] // [[Package, Package, Package, Package, Package], ...]

    for (var i: number = 0; i < Math.ceil(list.length / 5); i++) {
        paginatedList.push(list.slice(i * 5, i * 5 + 5))
    }

    return paginatedList
}

module.exports = paginateList
