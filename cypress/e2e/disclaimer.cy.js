describe("Disclaimer Page", () => {
  it("successfully loads", () => {
    cy.visit("/disclaimer");
    cy.title().should("eq", "Disclaimer");
  });
});
