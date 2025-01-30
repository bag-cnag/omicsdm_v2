export function isEmpty<T>(array: Array<T>){
    return (!Array.isArray(array) || !array.length) 
}
