export function getSeconds(time: string) {
    if (time.split(":").length === 3) {
        const [hours, minutes, seconds] = time.split(":");
        return (Number(hours) * 3600) + (Number(minutes) * 60) + Number(seconds);
    } else if (time.split(":").length === 2) {
        const [hours, minutes] = time.split(":");
        return (Number(hours) * 3600) + (Number(minutes) * 60);
    }
}