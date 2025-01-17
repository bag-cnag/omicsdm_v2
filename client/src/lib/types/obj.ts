export const isEmpty = (obj: object) => { 
    for (var _ in obj) { return false; }
    return true;
}

export const getKeyValue = <U extends keyof T, T extends object>(key: U) => (obj: T) =>
    obj[key];
