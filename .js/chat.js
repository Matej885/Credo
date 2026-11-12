const API_URL = "https://credo-ai.matej-sustek999.workers.dev/";
 
// HLÁŠKY SOVIČKY
const owlMessages = {
    welcome: "Dobrý deň, som sovička CREDO. Ak budete mať otázku, stačí kliknúť na mňa.",
    contact: "Máte otázku ešte pred odoslaním formulára? Rada vám pomôžem."
};
 
// HTML ELEMENTY
const owlButton = document.getElementById("owlButton");
const owlImage = document.getElementById("owlImage");
const owlBubble = document.getElementById("owlBubble");
const owlBubbleText = document.getElementById("owlBubbleText");
const owlBubbleClose = document.getElementById("owlBubbleClose");
const chatWindow = document.getElementById("chatWindow");
const chatClose = document.getElementById("chatClose");
const chatForm = document.getElementById("chatForm");
const chatInput = document.getElementById("chatInput");
const chatMessages = document.getElementById("chatMessages");
const sendButton = document.getElementById("sendButton");
 
// HISTÓRIA KONVERZÁCIE
let history = [];
let isSending = false;
let bubbleTimeout = null;
 
// SOVIČKA – SVG STAVY
const OWL_IMAGES = {
    idle: "test/owl_waving.svg",
    listening: "test/owl_listening.svg",
    talking: "test/owl_talk.svg"
};
 
// ZMENA OBRÁZKA SOVIČKY
function setOwlImage(state) {
    if (!owlImage) return;
 
    owlImage.src = OWL_IMAGES[state] || OWL_IMAGES.idle;
}
 
// ZOBRAZENIE BUBLINY
function showOwlBubble(message) {
    if (!owlBubble || !chatWindow) return;
 
    // Počas otvoreného chatu bublinu nezobrazujeme.
    if (chatWindow.classList.contains("open")) return;
 
    owlBubble.textContent = message;
    owlBubble.classList.add("visible");
 
    clearTimeout(bubbleTimeout);
 
    bubbleTimeout = setTimeout(() => {
        hideOwlBubble();
    }, 10000);
}
 
// SKRYTIE BUBLINY
function hideOwlBubble() {
    if (!owlBubble) return;
 
    owlBubble.classList.remove("visible");
    clearTimeout(bubbleTimeout);
}
 
// OTVORENIE CHATU
function openChat() {
    if (!chatWindow) return;
 
    chatWindow.classList.add("open");
    hideOwlBubble();
    setOwlImage("idle");
 
    if (chatInput) {
        setTimeout(() => chatInput.focus(), 200);
    }
}
 
// ZATVORENIE CHATU
function closeChat() {
    if (!chatWindow) return;
 
    chatWindow.classList.remove("open");
    setOwlImage("idle");
}
 
// KLIKNUTIE NA SOVIČKU
if (owlButton) {
    owlButton.addEventListener("click", () => {
        if (chatWindow.classList.contains("open")) {
            closeChat();
        } else {
            openChat();
        }
    });
}
 
// KLIKNUTIE NA ZATVÁRACIE TLAČIDLO
if (chatClose) {
    chatClose.addEventListener("click", closeChat);
}
 
// PRIDANIE SPRÁVY DO CHATU
function addMessage(message, sender) {
    if (!chatMessages) return;
 
    const messageElement = document.createElement("div");
 
    messageElement.classList.add("message");
    messageElement.classList.add(
        sender === "user" ? "user-message" : "assistant-message"
    );
 
    messageElement.textContent = message;
 
    chatMessages.appendChild(messageElement);
 
    chatMessages.scrollTop = chatMessages.scrollHeight;
}
 
// INDIKÁTOR PÍSANIA
function showTypingIndicator() {
    if (!chatMessages) return null;
 
    const typingElement = document.createElement("div");
 
    typingElement.classList.add("message", "assistant-message");
    typingElement.textContent = "Sovička premýšľa...";
 
    chatMessages.appendChild(typingElement);
    chatMessages.scrollTop = chatMessages.scrollHeight;
 
    return typingElement;
}
 
// ODOSLANIE SPRÁVY
// ODOSLANIE SPRÁVY
async function sendMessage(message) {
    if (isSending || !message.trim()) return;

    isSending = true;

    const userMessage = message.trim();

    addMessage(userMessage, "user");

    history.push({
        role: "user",
        content: userMessage
    });

    chatInput.disabled = true;

    if (sendButton) {
        sendButton.disabled = true;
    }

    setOwlImage("listening");

    const typingIndicator = showTypingIndicator();

    // Po 30 sekundách požiadavku prerušíme
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    try {
        const response = await fetch(API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                messages: history.slice(-30)
            }),
            signal: controller.signal
        });

        const data = await response.json();

        if (!response.ok) {
            console.error("Odpoveď Workera:", JSON.stringify(data, null, 2));
            throw new Error(
                data.error || "Nepodarilo sa spojiť s asistentkou."
            );
        }

        if (!data.reply) {
            throw new Error("Asistentka nevrátila odpoveď.");
        }

        if (typingIndicator) {
            typingIndicator.remove();
        }

        const reply = data.reply.trim();

        history.push({
            role: "assistant",
            content: reply
        });

        addMessage(reply, "assistant");

        setOwlImage("talking");

    } catch (error) {
        console.error("Chat error:", error);

        // Neúspešnú správu odstránime z histórie, aby sa neposlala dvakrát
        history.pop();

        if (typingIndicator) {
            typingIndicator.remove();
        }

        addMessage(
            "Ospravedlňujem sa, momentálne sa mi nepodarilo odpovedať. Skúste to prosím neskôr.",
            "assistant"
        );

        setOwlImage("idle");

    } finally {
        clearTimeout(timeoutId);
        isSending = false;

        if (chatInput) {
            chatInput.disabled = false;
            chatInput.focus();
        }

        if (sendButton) {
            sendButton.disabled = false;
        }
    }
}
 
// ODOSLANIE FORMULÁRA
if (chatForm) {
    chatForm.addEventListener("submit", async (event) => {
        event.preventDefault();
 
        const message = chatInput.value.trim();
 
        if (!message || isSending) return;
 
        chatInput.value = "";
 
        await sendMessage(message);
    });
}
 
// UVÍTACIA HLÁŠKA PO NAČÍTANÍ STRÁNKY
window.addEventListener("load", () => {
    setTimeout(() => {
        showOwlBubble(owlMessages.welcome);
    }, 2000);
});
 
// HLÁŠKA PO KLIKNUTÍ NA KONTAKT
document.querySelectorAll('a[href="#contact"]').forEach(link => {
    link.addEventListener("click", () => {
        showOwlBubble(owlMessages.contact);
    });
});
 
// POČIATOČNÝ STAV SOVIČKY
setOwlImage("idle");