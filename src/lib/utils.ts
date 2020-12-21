export function copyDate(from: Date) {
    return new Date(from.getTime());
}

export function setEndOfDay(date: Date) {
    date.setTime(
        date.getTime() +
        1000 * 60 * 60 * 24 - 1 -
        date.getMilliseconds() -
        date.getSeconds() * 1000 -
        date.getMinutes() * 60000 -
        date.getHours() * 3600000
    );
    return date;
}

export function setEndOfDayCopy(date: Date) {
    return new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate(),
        23,
        59,
        59,
        999,
    )
}

export function stripTime(date: Date) {
    date.setTime(
        date.getTime() -
        date.getMilliseconds() -
        date.getSeconds() * 1000 -
        date.getMinutes() * 60000 -
        date.getHours() * 3600000
    );

    return date;
}

export function stripTimeCopy(date: Date) {
    return new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate(),
    );
}

export function objectFromMap(map: Map<any, any>) {
    let o: any = {};
    for (let [ k, v ] of map.entries()) {
        if (v instanceof Map) {
            v = objectFromMap(v);
        }
        o[k] = v;
    }

    return o;
}