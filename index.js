var request = require('request');
var Discord = require('discord.js');
var client = new Discord.Client();
var fs = require('fs');

var creds;
if(fs.existsSync('creds.json')) {
    creds = JSON.parse(fs.readFileSync('creds.json'));
}
else{
    creds = {
        token: process.env.token,
        channel: process.env.channel
    };
}

var increment = process.env.increment ? (+process.env.increment) : 100,
    page = process.env.startingPage ? (+process.env.startingPage) : 0,
    cursor = process.env.startingCursor ? process.env.startingCursor : "",
    complete = false;

var channel;

var uptime = 0;
setInterval(() => uptime++, 1);

client.on("ready", () => {
    console.log("Discord bot logged in.");
    client.user.setActivity('With time');
    channel = client.channels.get(creds.channel);
    goBack();
});

var delay = 500;

function goBack() {
    var apiUrl = `https://www.khanacademy.org/api/internal/scratchpads/top?casing=camel&sort=2&limit=${increment}&subject=all&projection={%22scratchpads%22:[{%22title%22:1,%22url%22:1,%22created%22:1}],%22cursor%22:1}&page=${page}&_=${Date.now()}`;
    
    if(cursor.length > 0){
        apiUrl += `&cursor=${cursor}`;
    }
    
    request(apiUrl, function(err, resp, body) {
        if(err) { console.error(err); }
        
        console.log(`Response returned ${resp.statusCode}`);
        var body = JSON.parse(body);
        console.log(`Num programs: ${body.scratchpads.length}`);
        var lastProgram = body.scratchpads[body.scratchpads.length - 1];

        channel.send({ embed:{
            content: "Wow, I just went back in time and it feels great",
            color: 6080081,
            description: "Program data",
            title: "Program",
            author: {
                name: client.user.username,
                icon_url: client.user.avatarURL
            },
            fields: [
                {
                    name: "Title",
                    value: lastProgram.title
                },
                {
                    name: "Program Link",
                    value: `[URL](${lastProgram.url})`
                },
                {
                    name: "Date Created",
                    value: lastProgram.created
                },
                {
                    name: "Program Number",
                    value: increment * (page + 1)
                },
                {
                    name: "Page",
                    value: page
                },
                {
                    name: "Current Cursor",
                    value: cursor || "None"
                }
            ]
        }}).catch(console.error);
        
        cursor = body.cursor;
        complete = body.complete;
        page += 1;
        
        if(!complete) { setTimeout(goBack, delay); }
        else { channel.send("🎉 WE DID IT! 🎉").catch(console.error); }
    });
}

client.login(creds.token)