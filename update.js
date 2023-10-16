const { google } = require('googleapis');
const fetch  = require('node-fetch'); // use this when running on github, package.json needs node-fetch

const calendarId = "n8u997kirjjqku6g6o10nkugp4@group.calendar.google.com";
const clientEmail = "updater@public-skate-calendar-0.iam.gserviceaccount.com";
const daysBefore = 40;
const scriptTimeout = 80000; // 80 seconds
const currentDate = new Date(); // current date/time of script
currentDate.setHours(currentDate.getHours()-4) // EST timezone from UTC


// const key = require('./key.json');

const calendar = google.calendar({ version: 'v3', auth: new google.auth.JWT(
    clientEmail,
    null,
    process.env.PRIV_KEY,
    ['https://www.googleapis.com/auth/calendar']
)});


function getDate( offset ) { // returns date string (offset) days before or after current date
    let date = new Date();
    date.setDate( date.getDate() + offset + 0)
    date.setHours( 0, 0, 0, 0 );
    date = date.toISOString().substring( 0, 19 ) + "Z";
    return date;
}

function within(t1, t2) { // returns if two times are within 10 minutes
    t3 = new Date(t1);
    t4 = new Date(t2);
    return (Math.abs(t3.getTime()-t4.getTime()) <= 10*60000)
}

function mergeEvents ( [startTimes, endTimes] ) {
    for (let iter = 0; iter < endTimes.length; iter++) {
        if (within(endTimes[iter], startTimes[iter + 1])) {
            endTimes.splice(iter, 1);
            startTimes.splice(iter + 1, 1);
        }
    }
    return ( [ startTimes, endTimes ] )
}

function addEvent ( start, end ) {
    const event = {
        summary: 'Public Skate',
        start: {
            dateTime: start,
            timeZone: 'America/New_York'
        },
        end: {
            dateTime: end,
            timeZone: 'America/New_York'
        },
        description: `Updated : ${currentDate.toLocaleString()}`
    }

    return new Promise( async ( resolve, reject ) => {
        try {
            calendar.events.insert({
                calendarId: calendarId,
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

async function updateEvent( id ) {
    return new Promise( async ( resolve, reject ) => {
        try {
            const event = await calendar.events.get ({
                calendarId: calendarId,
                eventId: id,
            });
    
            event.data.description = `updated : ${currentDate.toLocaleString()}`;
    
            calendar.events.update({
                calendarId: calendarId,
                eventId: id,
                resource: event.data,
            });
    
            resolve();
        } catch ( err ) {
            console.error( 'Error updating event description:', err );
            reject( err );
        }
    });
}

async function deleteEvent ( id ) {
    return new Promise( async ( resolve, reject ) => {
        try {
            await calendar.events.delete({
                calendarId: calendarId,
                eventId: id,
            });
            resolve();
        } catch ( err ) {
            console.error('Error deleting event:', err);
            reject( err );
        }
    });
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
            resolve(mergeEvents(mergeEvents([startTimes, endTimes])));
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
            for ( let i = 0; i < newData[0].length; i++ ) {
                while ( iter < oldData[0].length && oldData[0][iter] < newData[0][i] ) { // oldData top is above
                    await deleteEvent(oldData[2][iter]);
                    console.log("deleted-", oldData[0][iter]);
                    iter++;
                }
                if ( iter < oldData[0].length &&
                     oldData[0][iter] === newData[0][i] && oldData[1][iter] === newData[1][i] ) { // tops and bottoms are equal
                        await updateEvent(oldData[2][iter]);
                        console.log("updated", oldData[0][iter]);
                        iter++;
                } else { // newData top is above
                    await addEvent(newData[0][i], newData[1][i]);
                    console.log("added", newData[0][i]);
                }
            }
            while ( iter < oldData[0].length ) { // remove the leftover
                await deleteEvent(oldData[2][iter]);
                console.log("deleted", oldData[0][iter]);
                iter++;
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
    //console.log(newData);
    
    await updateCalendar( newData, oldData );
    
}

const scriptTimeoutPromise = new Promise((_, reject) => {
    setTimeout(() => {
        console.error("Script timed out");
        process.exit(1); // Terminate the script
    }, scriptTimeout);
});

Promise.race([main(), scriptTimeoutPromise])
    .then(() => {
        console.log("Script completed successfully");
        process.exit();
    })
    .catch((error) => {
        console.error(error);
        process.exit(1); // Terminate the script
    });
