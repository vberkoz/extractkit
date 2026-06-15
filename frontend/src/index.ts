const app = document.querySelector<HTMLParagraphElement>("#app");

if (app) {
  const now = new Date().toLocaleString();
  app.textContent = `Frontend bundle loaded at ${now}.`;
}
