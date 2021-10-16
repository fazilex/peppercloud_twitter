import React, { useState, useEffect } from "react";
import logo from './twitter-svgrepo-com.svg';
import './App.css';
import { io } from "socket.io-client";
import axios from "axios"

let socket
function App() {
  const [tweets, setTweets] = useState([])
  const [searchKey, setSearch] = useState("")
  const [next_token,setNextToken] = useState()

  useEffect(() => {
    socket = io("http://localhost:5000",  { transports: ['websocket'] })

    // socket.on('connect', () => {
    //   console.log('Connected to server...')
    // })

    // socket.on('tweet', (tws) => {
    //   console.log(tws)
    //   const tweetData = {
    //     id: tws.data.id,
    //     text: tws.data.text,
    //     username: `@${tws.includes.users[0].username}`,
    //   }
    //   // setTweets(res => {
    //   //   return res.length < 50 ? res.concat(tweetData) : res
    //   // })
    // })
  }, [])

  const handleChange = (e) =>{
    let{value} = e.target
    setSearch(value)
  }

  const handleClick = ()=>{
    // socket.emit('changeSearch', searchKey)
    console.log("searchKey", searchKey)
    }

    const handleSearch = async (clearstart = true) => {
      console.log("Clicked");
      if (clearstart) {
        await Promise.all([setTweets([]), setNextToken()]);
      }
      try {
        const res = await axios.get(`http://localhost:5000/search?q=${searchKey}${!!next_token?`&next_token=${next_token}`:""}`);
        const { data: { data, meta: { next_token: nextToken } } } = res;
        setTweets(preDt => ([...preDt, ...data]))
        setNextToken(nextToken)
      } catch (error) {
        console.error(error);
      }
    }
  
    const handleLoadMore = () => {
      handleSearch(false);
    }

  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="logo" alt="logo" />
        <h3>Tweets Search</h3>
      </header>
      <div>
        <label htmlFor="header-search">
          <span className="visually-hidden">Search Tweets</span>
        </label>
        <input
          type="text"
          id="header-search"
          placeholder="Search Tweets"
          name="s"
          onChange = {handleChange}
          value={searchKey}
        />
        <button  onClick={handleSearch}>Search</button>
      </div>
      <div className="container">
        <div className="card my-4">
          {tweets.map((tws,id) => (
            <div className="card-body" key={id}>
              <h5 className="card-title">{tws.text}</h5>
              {/* <h6 className="card-subtitle mb-2 text-muted">{tws.username}</h6> */}
              {/* <a className="btn btn-primary mt-3" href={`https://twitter.com/${tws.username}/status/${tws.id}`}>
                <i className="fab fa-twitter"></i> Go To Tweet
              </a> */}
            </div>
          ))}
        </div>
      </div>
      <button onClick ={handleLoadMore} >Load more</button>
    </div>
  );
}

export default App;
