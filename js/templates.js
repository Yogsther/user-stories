var templates = {
    "Som en roll": 'Som en {roll} vill jag {aktivitet} i {sammanhang} för att {orsak}.',
    "Exempel": 'Det här är ett {exempel} på vad som kan {göras}'
}

for(var key in templates){
    templates[key] = {
        text: templates[key],
        key: key
    }
}