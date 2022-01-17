import * as moment from 'moment'
import 'moment-timezone'

export class Utils{
    public static makeId(length: number) {
        let result = ''
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
        const charactersLength = characters.length
        for (let i = 0; i < length; i++) {
            result += characters.charAt(Math.floor(Math.random() *
                charactersLength))
        }
        return result
    }
    public static getRegionResultSeed(timestamp: number) {
        const TIMEZONE = 'EST'
        return "REGION_RESULT_" + moment.unix(timestamp).tz(TIMEZONE).format('MM_DD')
    }
}
