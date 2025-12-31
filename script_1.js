document.addEventListener('DOMContentLoaded', () => {
    const chatBox = document.getElementById('chat-box');
    const userInput = document.getElementById('user-input');
    const sendBtn = document.getElementById('send-btn');
    
    sendBtn.addEventListener('click', sendMessage);
    userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });

    function sendMessage() {
        const userMessage = userInput.value.trim();
        if (userMessage === '') return;

        appendMessage('user', userMessage);
        userInput.value = '';

        fetchBotResponse(userMessage);
    }

    async function fetchBotResponse(userMessage) {
        const botMessageElement = appendMessage('bot', '');
        const messageContent = botMessageElement.querySelector('.message');
        
        messageContent.innerHTML = '<div class="thinking-animation"><span></span><span></span><span></span></div>';

        const requestBody = {
            "inputs": {},
            "query": userMessage,
            "response_mode": "streaming",
            "conversation_id": "",
            "user": "abc-123"
        };

        try {
            const response = await fetch('https://nezha-qa-api.cn-pgcloud.com/v1/chat-messages', {
                method: 'POST',
                headers: {
                    'Authorization': 'Bearer app-BEkRFfVqTrHyuaTeOKSq4WdA',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder('utf-8');
            
            let firstChunkReceived = false;
            let typingQueue = Promise.resolve();

            const processChunk = (chunk) => {
                const lines = chunk.split('\n');
                for (const line of lines) {
                    if (line.startsWith('data:')) {
                        try {
                            const jsonData = JSON.parse(line.substring(5));
                            if (jsonData.event === 'message') {
                                if (!firstChunkReceived) {
                                    messageContent.innerHTML = '';
                                    firstChunkReceived = true;
                                }
                                typingQueue = typingQueue.then(() => typeChunk(jsonData.answer, messageContent));
                            }
                        } catch (e) {
                            // Ignore parsing errors
                        }
                    }
                }
            };

            const typeChunk = (text, element) => {
                return new Promise(resolve => {
                    let i = 0;
                    function type() {
                        if (i < text.length) {
                            element.textContent += text.charAt(i);
                            i++;
                            chatBox.scrollTop = chatBox.scrollHeight;
                            setTimeout(type, 30);
                        } else {
                            resolve();
                        }
                    }
                    type();
                });
            };

            const read = () => {
                reader.read().then(({ done, value }) => {
                    if (done) {
                        return;
                    }
                    const chunk = decoder.decode(value, { stream: true });
                    processChunk(chunk);
                    read();
                });
            };

            read();

        } catch (error) {
            console.error('Error fetching bot response:', error);
            messageContent.textContent = 'Sorry, something went wrong. Please check the console for details.';
        }
    }

    function appendMessage(sender, message) {
        const messageElement = document.createElement('div');
        messageElement.classList.add('chat-message', sender);

        const messageContent = document.createElement('div');
        messageContent.classList.add('message');
        messageContent.textContent = message;

        messageElement.appendChild(messageContent);
        chatBox.appendChild(messageElement);
        chatBox.scrollTop = chatBox.scrollHeight;
        return messageElement;
    }
});
