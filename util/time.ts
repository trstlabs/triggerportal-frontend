import { maybePluralize } from 'components/ui-blocks';
import dayjs from 'dayjs';

export const getDuration = (seconds: number) => {
    if ((seconds / 60 / 60 / 24) > 1) {
        return (seconds / 60 / 60 / 24).toFixed() + ' days';
    }
    else if ((seconds / 60 / 60) > 1) {
        return seconds / 60 / 60 + ' hours';
    }
    else if ((seconds / 60) > 1) {
        return seconds / 60 + ' minutes';
    }

    return seconds + ' seconds';
};
export const getRelativeTime = (miliseconds: number) => {
    /* parse the actual dates */
    const inPrefix = "In ";
    const date = dayjs(miliseconds);

    const now = dayjs();

    const minsLeft = date.diff(now, 'minutes');

    if (minsLeft > 1440) { // More than 24 hours
        const daysLeft = Math.floor(minsLeft / 1440);
        const hoursLeft = Math.floor((minsLeft % 1440) / 60);
        return inPrefix + `${maybePluralize(daysLeft, 'day')} and ${maybePluralize(hoursLeft, 'hour')}`;
    }

    if (minsLeft > 60) { // More than an hour
        const hoursLeft = Math.floor(minsLeft / 60);
        const minsLeftAfterHours = minsLeft % 60;
        return inPrefix + `${maybePluralize(hoursLeft, 'hour')} and ${maybePluralize(minsLeftAfterHours, 'minute')}`;
    }

    if (minsLeft > 0) {
        return inPrefix + maybePluralize(minsLeft, 'minute');
    }

    const secondsLeft = date.diff(now, 'seconds');

    if (secondsLeft > 0) {
        return 'less than a minute from now';
    }

    return date.toDate().toLocaleString();

};
