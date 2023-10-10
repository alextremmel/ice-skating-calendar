const { google } = require('googleapis');
const key = require('./keys.json');

const calendar = google.calendar({ version: 'v3', auth: new google.auth.JWT(
    key.client_email,
    null,
    key.private_key,
    ['https://www.googleapis.com/auth/calendar']
)});


const daysBefore = 3;
const daysAfter = 20;

let startDate = new Date();
let endDate = new Date();

startDate.setDate(startDate.getDate() - daysBefore);
endDate.setDate(endDate.getDate() + daysAfter);

// set time to 0, gets offset by timezone when toISOString()
startDate.setHours(0);
endDate.setHours(0);

startDate = startDate.toISOString().substring(0,19) + "Z";
endDate = endDate.toISOString().substring(0,19) + "Z";


function getNewData () {
    return new Promise(async (resolve, reject) => {
        try {
            const response = await fetch(
                "https://app.mysportsort.com/ajax_scripts/ajax.calendarcontroller.php",
                {
                    headers: {
                        accept: "application/json, text/javascript, */*; q=0.01",
                        "accept-language": "en-US,en;q=0.7",
                        "content-type": "application/json; charset=UTF-8",
                        "sec-ch-ua": "\"Google Chrome\";v=\"117\", \"Not;A=Brand\";v=\"8\", \"Chromium\";v=\"117\"",
                        "sec-ch-ua-mobile": "?0",
                        "sec-ch-ua-platform": '"Windows"',
                        "sec-fetch-dest": "empty",
                        "sec-fetch-mode": "cors",
                        "sec-fetch-site": "cross-site",
                        "sec-gpc": "1",
                        Referer: "https://mullins.athletetrax.co/",
                        "Referrer-Policy": "strict-origin-when-cross-origin",
                    },
                    body:
                                '{"uid":0,"key":"","an":417,"securetoken":"hdsLWNC*@3b772@gd2@AhhhdcxqnwdvA01!!nce7cX","areaid":[2489,2490],"tagId":380,"startdate":"' + startDate + '","enddate":"' + endDate + '","code":"schedule"}',
                        method: "POST",
                    }
                );
                let data = await response.json();

                resolve(data.schedule.map((d) => [d["start"], d["end"]]));
        } catch (error) {
            reject(error);
        }
    });
}

function getOldData () {
    return new Promise(async (resolve, reject) => {
        try {

            const { data } = await calendar.events.list({
                calendarId: key.calendarId,
                singleEvents: true,
                timeMin: startDate,
            });

            timesList = data.items.map((d) => [d["start"]["dateTime"].substring(0,19), d["end"]["dateTime"].substring(0,19)]);
            idList = data.items.map((d) => d["id"]);
            dataList = [timesList, idList];
            

            resolve(dataList);

        } catch (error) {
            reject(error);
        }
    });
}

function addEvent (times) {
    const event = {
        summary: 'Public Skate',
        start: {
            dateTime: times[0],
            timeZone: 'America/New_York'
        },
        end: {
            dateTime: times[1],
            timeZone: 'America/New_York'
        },
        description: `Public skate times are subject to change. This event was last updated ${new Date().toLocaleString()}`
    }

    return new Promise((resolve, reject) => {
        try {
            calendar.events.insert({
                calendarId: key.calendarId,
                resource:event
            }, (err) => {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        } catch (error) {
            reject(error);
        }
    });
}

function deleteEvent (id) {
    return new Promise((resolve, reject) => {
        try {
            calendar.events.delete(
                {
                    calendarId:key.calendarId,
                    eventId:id
                },
                (err, res) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve();
                    }
                }
            );  
        } catch (error) {
            reject(error);
        }
    });
}

function updateCalendar (newData, oldData) {

    return new Promise(async (resolve, reject) => {
        try {
            
            for (let i = 0; i < oldData[0].length; i++) {
                if (!newData.some(item => item[0] === oldData[0][i][0] && item[1] === oldData[0][i][1])) {
                    await deleteEvent(oldData[1][i]);
                }
            }
            
            for (let i = 0; i < newData.length; i++) {
                if (!oldData[0].map(s => [s[0], s[1]]).some(item => item[0] === newData[i][0] && item[1] === newData[i][1])) {
                    await addEvent(newData[i]);
                }
            }

            resolve();

        } catch (error) {
            reject(error);
        }
    });  
}

async function main () {


    const [newData, oldData] = await Promise.all([
        getNewData(),
        getOldData()
    ]);

    await updateCalendar(newData, oldData);

}

main();
