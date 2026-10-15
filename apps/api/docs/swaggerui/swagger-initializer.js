// External file (not inline) so the Content-Security-Policy can stay at script-src 'self'.
window.onload = function () {
  window.ui = SwaggerUIBundle({
    url: "/swagger/doc.json",
    dom_id: "#swagger-ui",
    deepLinking: true,
    persistAuthorization: true,
    displayRequestDuration: true,
    tryItOutEnabled: true,
    docExpansion: "list",
    defaultModelsExpandDepth: 0,
    validatorUrl: null, // never send the spec to an external validator
  });
};
