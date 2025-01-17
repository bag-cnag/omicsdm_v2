export function capitalizeFirstLetter(str: string){
    return String(str).charAt(0).toUpperCase() + String(str).slice(1);
}

export function toTitle(str: string){
    let arr = str.split('_')
    arr = arr.map((e) => {
        return capitalizeFirstLetter(e)
    })
    return arr.join(' ')
}
