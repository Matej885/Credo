// contact.js je len aby som nemusel platit za predplatne na Formspree, dakujem Reddit user <3//
const form = document.getElementById("contactForm");

form.addEventListener("submit", async function(event) {
    event.preventDefault();

    const button = form.querySelector("button[type='submit']");

    button.disabled = true;
    button.textContent = "Odosielam...";

    try {
        const response = await fetch(form.action, {
            method: "POST",
            body: new FormData(form),
            headers: {
                "Accept": "application/json"
            }
        });

        if (!response.ok) {
            window.location.href = "/error.html";
            throw new Error("Odoslanie zlyhalo.");
        }

        window.location.href = "flashscreens/thank-you.html";

    } catch (error) {
        window.location.href = "flashscreens/error.html";
        button.disabled = false;
        button.textContent = "Odoslať správu →";
        console.error(error);
    }
});