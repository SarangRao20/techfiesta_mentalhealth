from ollama import Client
client = Client(host='http://localhost:11434')
intent_classifier = 'intent_classifier:latest' 
convo_LLM = 'convo_LLM:latest'
user_message="I feel weirdly low and I don’t know why"
json = client.generate(model=intent_classifier, prompt=user_message,stream=False)
json = str(json["response"])
print(type(json))
# user_message =
response = client.generate(model=convo_LLM,prompt=user_message+"\n"+json)
print(response["response"])