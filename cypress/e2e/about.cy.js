describe("About Page", () => {
  it("successfully loads", () => {
    cy.visit("/about");
    cy.title().should("eq", "About Me");
  });
});
