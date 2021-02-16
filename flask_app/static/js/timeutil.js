function timeConverter(UNIX_timestamp){
    var date = new Date(UNIX_timestamp * 1000);
    var year = date.getFullYear();
    var month = date.getMonth() + 1;
    var day = date.getDate();
    var hour = date.getHours();
    var amPM = "AM";
    if (hour > 12) {
        hour -= 12;
        amPM = "PM";
    }
    var min = zeroPadMinutes(date.getMinutes());
    var time = `<b>Time:</b> ${hour}:${min} ${amPM}<br><b>Date:</b> ${month}/${day}/${year}`;
    return time;
};

function zeroPadMinutes(value) {
    if(value < 10) {
        return '0' + value;
    } else {
        return value;
    }
}
