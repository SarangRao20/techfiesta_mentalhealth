import React, { useEffect } from 'react'
import { useState} from 'react'
import { useParams } from 'react-router-dom';

const Chat = () => {

    const [messages, setMessages] = useState([{
        role,content
    }]);
    const [endmood, setendMood] = useState([
        {
            dominant_emotion,
            confidence_level,
            clarity_level,
            engagement,
            primary_intent,
            topic_cluster,
            trend
        }
    ]);
    // const {sessionId} = useParams()
    // sessionId = crypto.randomUUID()
    // localStorage={
    //     chat:{
    //         sessionId:messages
    //     }
    // }

    const[feature,setFeature] = useState()

    useEffect(()=>{
        fetch(`http://localhost:5000/api/chat/${sessionId}`)
        .then(res=>res.json())
        .then(data=>setMessages(data.messages),[sessionId])
    })
    // const[FeatureInsight,setFeatureInsight] = useState() - currently not in use

    return (
        <div>
chat
        </div>
    )
}

export default Chat
