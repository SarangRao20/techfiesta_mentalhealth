import React, { useEffect } from 'react'
import { useState } from 'react'
import { useParams } from 'react-router-dom';
import { API_URL } from '../config';

const Chat = () => {

    const [messages, setMessages] = useState([{
        "role": "user",
        "content": "Hello"
    }]);
    const [endmood, setendMood] = useState([
        {
            "dominant_emotion": "neutral",
            "confidence_level": 0.8,
            "clarity_level": 0.9,
            "engagement": 0.7,
            "primary_intent": "support",
            "topic_cluster": "wellness",
            "trend": "positive"
        }
    ]);
    const { sessionId } = useParams()
    // sessionId = crypto.randomUUID()
    // localStorage={
    //     chat:{
    //         sessionId:messages
    //     }
    // }

    const [feature, setFeature] = useState()

    useEffect(() => {
        fetch(`${API_URL}/api/chatbot/${sessionId}`)
            .then(res => res.json())
            .then(data => setMessages(data.messages), [sessionId])
    })
    // const[FeatureInsight,setFeatureInsight] = useState() - currently not in use

    return (
        <div className='bg-black'>
            chat
        </div>
    )
}

export default Chat
