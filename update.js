const { google } = require('googleapis');
//const fetch  = require('node-fetch'); // use this when running on github, package.json needs node-fetch

const calendarId = "n8u997kirjjqku6g6o10nkugp4@group.calendar.google.com";
const clientEmail = "updater@public-skate-calendar-0.iam.gserviceaccount.com";
const daysBefore = 10;

const key = require('./keys.json');

const calendar = google.calendar({ version: 'v3', auth: new google.auth.JWT(
    clientEmail,
    null,
    key.private_key,
    ['https://www.googleapis.com/auth/calendar']
)});


function getDate( offset ) { // returns date string (offset) days before or after current date
    let date = new Date();
    date.setDate( date.getDate() + offset )
    date.setHours( 0, 0, 0, 0 );
    date = date.toISOString().substring( 0, 19 ) + "Z";
    return date;
}

function addEvent (calendar, times) {

}

function updateEvent (calendar, times) {

}

function deleteEvent (calendar, times) {

}













function getNewData () {
    const requestOptions = {
        method: "POST",
        headers: {
            accept: "application/json, text/javascript, */*; q=0.01",
            "accept-language": "en-US,en;q=0.7",
            "content-type": "application/json; charset=UTF-8",
            Referer: "https://mullins.athletetrax.co/",
            "Referrer-Policy": "strict-origin-when-cross-origin",
        },
        body: JSON.stringify ( {
            an: 417,
            securetoken: "hdsLWNC*@3b772@gd2@AhhhdcxqnwdvA01!!nce7cX",
            tagId: 380, /// to specify public skate
            startdate: getDate ( 0 ),
            enddate: getDate( daysBefore ),
            code: "schedule",
        } ),
    };
    return new Promise (async ( resolve, reject ) => {
        try {
            const response = await fetch("https://app.mysportsort.com/ajax_scripts/ajax.calendarcontroller.php", requestOptions);
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            const data = await response.json();
            const startTimes = data.schedule.map((d) => d.start);
            const endTimes = data.schedule.map((d) => d.end);
            resolve([startTimes, endTimes]);
        } catch (error) {
            reject(error);
        }
    } );
}




function getOldData() {
    return new Promise(async (resolve, reject) => {
        try {
            const { data } = await calendar.events.list({
                calendarId: calendarId,
                singleEvents: true,
                timeMin: getDate(0),
            });

            const startTimes = data.items.map((d) => d["start"]["dateTime"].substring(0, 19));
            const endTimes = data.items.map((d) => d["end"]["dateTime"].substring(0, 19));
            const ids = data.items.map((d) => d["id"]);

            const result = [startTimes, endTimes, ids];

            resolve(result);
        } catch (error) {
            reject(error);
        }
    });
}

function updateCalendar ( newData, oldData ) {
    return new Promise(async ( resolve, reject ) => {
        try {
            let iter = 0;
            for ( let i = 0; i < newData.length; i++ ) {
                while ( iter < oldData.length && oldData[0][iter] < newData[0][i] ) { // oldData top is above
                    // delete oldData[2][iter]
                    iter++;
                }
                if ( iter < oldData.length &&
                     oldData[0][iter] === newData[0][i] && oldData[1][iter] === newData[1][i] ) { // tops are equal
                        // update oldData[2][iter]
                        iter++;
                } else { // newData top is above
                    // create [newData[0][i], newData[1][i]]
                }
            }
            for ( let i = iter; i < oldData.length; i++) {
                // delete oldData[2][iter]
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
        getOldData(),
    ]);
    
    console.log(newData[0], oldData[0]);

    for (let i = 0; i < newData.length; i++) {
        //console.log('hi');
    }

    one = '2023-10-12T10:00:00';
    two = '2023-10-13T07:00:00';
    //console.log(one > two);
    
}

main();



/*

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
                calendarId: process.env.CAL_ID,
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
                    calendarId: process.env.CAL_ID,
                    eventId: id
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

// main();

*/