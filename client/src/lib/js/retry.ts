// retry.js
// Courtesy of: https://solutional.ee/blog/2020-11-19-Proper-Retry-in-JavaScript.html

const delay = (fn: Function, ms: number) => new Promise((resolve) => setTimeout(() => resolve(fn()), ms))

const randInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1) + min)

export const retry = async (fn: Function, maxAttempts: number) => {
    const execute = async (attempt: number) => {
        try {
            return await fn()
        } catch (err) {
            if (attempt <= maxAttempts) {
                const nextAttempt = attempt + 1
                const delayInSeconds = Math.max(Math.min(Math.pow(2, nextAttempt)
                + randInt(-nextAttempt, nextAttempt), 600), 1)
                console.error(`Retrying after ${delayInSeconds} seconds due to:`, err)
                return delay(() => execute(nextAttempt), delayInSeconds * 1000)
            } else {
                throw err
            }
        }
    }
    return execute(1)
}
