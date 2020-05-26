"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function copyDate(from) {
    return new Date(from.getTime());
}
exports.copyDate = copyDate;
function setEndOfDay(date) {
    date.setTime(date.getTime() +
        1000 * 60 * 60 * 24 - 1 -
        date.getMilliseconds() -
        date.getSeconds() * 1000 -
        date.getMinutes() * 60000 -
        date.getHours() * 3600000);
    return date;
}
exports.setEndOfDay = setEndOfDay;
function setEndOfDayCopy(date) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
}
exports.setEndOfDayCopy = setEndOfDayCopy;
function stripTime(date) {
    date.setTime(date.getTime() -
        date.getMilliseconds() -
        date.getSeconds() * 1000 -
        date.getMinutes() * 60000 -
        date.getHours() * 3600000);
    return date;
}
exports.stripTime = stripTime;
function stripTimeCopy(date) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}
exports.stripTimeCopy = stripTimeCopy;
//# sourceMappingURL=date-utils.js.map