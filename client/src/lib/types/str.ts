export function capitalizeFirstLetter(str: string){
    return String(str).charAt(0).toUpperCase() + String(str).slice(1);
}


export function toTitle(str: string){
    let arr = str.split('_');
    arr = arr.map((e) => capitalizeFirstLetter(e));
    return arr.join(' ');
}


export function toIndex(str: string){
    let arr = str.split(' ');
    arr = arr.map((e) => e.toLowerCase())
    return arr.join('_');
}
