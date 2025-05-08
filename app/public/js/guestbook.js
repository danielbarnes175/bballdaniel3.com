document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("guestbook-form");

  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      const name = form.name.value.trim();
      const message = form.message.value.trim();

      try {
        const response = await fetch("/guestbook", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ name, message })
        });

        const data = await response.json();

        if (response.ok && data.redirect) {
          window.swup.navigate(data.redirect);
        } else {
          alert("Something went wrong.");
        }
      } catch (err) {
        console.error("Submission failed", err);
        alert("Network error.");
      }
    });
  }
});

function bindGuestbookForm() {
  const form = document.getElementById("guestbook-form");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = form.name.value.trim();
    const message = form.message.value.trim();

    try {
      const response = await fetch("/guestbook", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ name, message })
      });

      const data = await response.json();
      if (response.ok && data.redirect) {
        window.swup.navigate(data.redirect);
      }
    } catch (err) {
      console.error("Submission failed", err);
    }
  });
}

// Initial bind
document.addEventListener("DOMContentLoaded", bindGuestbookForm);

// Re-bind after every Swup navigation
swup.hooks.on('page:view', bindGuestbookForm);
