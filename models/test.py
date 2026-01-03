from ollama import Client
# Initialize the client to connect to the Ollama server running on localhost
client = Client(host='http://localhost:11434')
model_name = 'llama3.2'  
messages = []
def speakUp(context,message):

    messages.append({
        'role':'system',
        'content':context
    })
    messages.append({
        'role': 'user',
        'content': message,
    })

    response = client.chat(model=model_name, messages=messages)
    assistant_reply = response['message']['content']

    messages.append({
        'role': 'assistant',
        'content': assistant_reply,
    })
    return assistant_reply

stop = True
while stop:
    user_input = input("Enter your message: ")
    if user_input.lower() in ['exit', 'quit']:
        stop = False
    else:
        classification = speakUp("YOU ARE A BASIC CHATBOT", user_input)
        print("Classification Result:\n", classification)