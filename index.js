const http = require('http')
const path = require('path')
const express = require('express')
const socketIo = require('socket.io')
const needle = require('needle')
const cors = require('cors')
const bodyParser = require('body-parser')
const axios = require('axios')
require('dotenv').config()

const TOKEN = process.env.TWITTER_BEARER_TOKEN
const PORT = process.env.PORT || 5000



const app = express()
app.use(cors({origin: "http://localhost:3000"}))
app.use(bodyParser.json())

const server = http.createServer(app)
const io = socketIo(server)

app.get('/', (req, res) => {
    // res.sendFile(path.resolve(__dirname, '../', 'frontend', 'public', 'index.html'))
    res.send("working")
})

app.get("/search",async (req,res)=>{
    const { q="", next_token= undefined } = req.query
    const twitter_url = `https://api.twitter.com/2/tweets/search/recent?query=${q}&max_results=25&tweet.fields=author_id,created_at,id,lang,public_metrics,reply_settings,source,text${!!next_token?`&next_token=${next_token}`:""}`;
    try {
        const {data, status} = await axios.get(twitter_url, {
            headers: {
                Authorization: `Bearer ${TOKEN}`
            }
        })
        console.log(data)
        return res.status(status).json(data)
    } catch (error) {
        console.log(error)
        return res.status(500).json({msg:'something went wrong', error})
    }
})
const rulesURL = 'https://api.twitter.com/2/tweets/search/stream/rules'
const streamURL = 'https://api.twitter.com/2/tweets/search/stream?tweet.fields=public_metrics&expansions=author_id'

const rules = [{ value: 'syed' }]

//get stream rules

async function getRules() {
    const response = await needle('get', rulesURL, {
        headers: {
            Authorization: `Bearer ${TOKEN}`
        }
    })
    console.log(response.body)

    return response.body
}
//set stream rules

async function setRules() {
    const data = {
        add: rules
    }

    const response = await needle('post', rulesURL, data, {
        headers: {
            'content-type': 'application/json',
            Authorization: `Bearer ${TOKEN}`
        }
    })

    return response.body
}


//delete stream rules
async function deleteRules(rules) {
    if(!Array.isArray(rules.data)){
        return null
    }

    const ids = rules.data.map((rule)=> rule.id)
    const data = {
        delete: {
            ids: ids
        }
    }

    const response = await needle('post', rulesURL, data, {
        headers: {
            'content-type': 'application/json',
            Authorization: `Bearer ${TOKEN}`
        }
    })

    return response.body
}

function streamTweets(socket) {
    const stream = needle.get(streamURL, {
        headers: {
            Authorization: `Bearer ${TOKEN}`
        }
    })
    stream.on('data', (data) => {
        try {
            const json = JSON.parse(data)
            // console.log(json)
            socket.emit('tweet', json)
        } catch (error) {

        }
    })
}

io.on('connection', async () => {
    console.log('Client connected...')

    let currentRules

    try {
        // Get all stream rules
        currentRules = await getRules()
        //delete all stream rules

        await deleteRules(currentRules)
        
        //Set rules based on array above
        await setRules()

    } catch (error) {
        console.log(error)
        process.exit(1)
    }

    streamTweets(io)

})


app.listen(PORT, () => console.log(`Listening on port ${PORT}`))