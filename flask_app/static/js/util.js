function timeConverter(UNIX_timestamp){
    var a = new Date(UNIX_timestamp * 1000);
    //var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    var amPM = "AM";
    var year = a.getFullYear();
    //var monthName = months[a.getMonth()];
    var month = a.getMonth() + 1;
    var day = a.getDate();
    var hour = a.getHours();
    if (hour > 12) {
        hour -= 12;
        amPM = "PM";
    }
    var min = zeroPadMinutes(a.getMinutes());
    //var sec = a.getSeconds();
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
