export function fieldsToObject(evt: HTMLFormElement){
    return Object.fromEntries(
        Array.from(
            (new FormData(evt)).entries()
        ).filter(value => value[1])
    )
}
