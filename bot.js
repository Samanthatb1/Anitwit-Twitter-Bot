const Twit = require('twit');
const fs = require('fs');
const path = require("path");
const paramsPath = path.join(__dirname, 'params.json');
require('dotenv').config();

var T = new Twit({
    consumer_key:         process.env.CONSUMER_KEY,
    consumer_secret:      process.env.CONSUMER_SECRET,
    access_token:         process.env.ACCESS_TOKEN,
    access_token_secret:  process.env.ACCESS_TOKEN_SECRET,
    timeout_ms:           60*1000,  // optional HTTP request timeout to apply to all requests.
    strictSSL:            true,     // optional - requires SSL certificates to be valid.
  });


// Writing the tweet to the file
function writeParams(newParam) {
  console.log("we are writing our params file ..." + newParam.since_id);
  return fs.writeFileSync(paramsPath, JSON.stringify(newParam));
}

function readParams() {
  console.log("we are reading the params file...");
  const paramsRead = fs.readFileSync(paramsPath);
  return JSON.parse(paramsRead.toString());
}

// Searching for tweets
function getTweets(since_id){
  return new Promise((resolve, reject) => {
    let params = {
      q: 'new to anitwit',
      count: 3,
    };

    if (since_id){
      params.since_id = since_id ;
    }
    console.log("we are getting the tweets ... " + params);

    T.get('search/tweets', params, (err, data) =>{
      if(err){
        return reject(err);
      } 
      console.log(data);
      return resolve(data); 
    })
  });
}

//Retweeting the tweet using it's id
function postRetweet(id){
  return new Promise((resolve, reject) =>{
    let params = {
      id,
    };
    T.post('statuses/retweet/:id', params, (err, data) => {
      if (err){
        return reject(err);
      }
      return resolve(data); 
    });
  });
}

async function main(){
  try {
    const params = readParams(); //calling function reading the parameter from the other file
    const data = await getTweets(params.since_id); // the data from getTweets() is all the information about ALL the singular tweet
    const theTweets = data.statuses;
    console.log("we got the tweets " + theTweets.length); // prints out the number of tweets found

    // looping through each singular tweet within the many tweets we've found
    for (var i = theTweets.length - 1 ; i >= 0 ; i--)
    {
      try
      {
        var text = theTweets[i].text; 
        var lowerText = text.toLowerCase();
        if (lowerText.includes("new") && lowerText.includes("anitwit") && (lowerText.includes("im ") || lowerText.includes("i’m") || lowerText.includes("i am")) ) // Checks to make sure the tweet is about anitwit and is new
        { 
          await postRetweet(theTweets[i].id_str);  // passing in that specific tweet Id
          console.log("successful retweet " + theTweets[i].id_str);
        } else {
          console.log("This tweet didnt have everything we're looking for!");
        }
      } 
        catch(e) // if one tweet has an error the whole program wont stop running
        { 
          console.log("unsuccessful retweet" + e); 
        }
        params.since_id = theTweets[i].id_str ;
    }
    writeParams(params); 
  }
  catch(e) {
    console.error(e);
  }
}

console.log("the bot is starting") ;
main();

//Interval for posting
setInterval(main, 1000*60*60);
