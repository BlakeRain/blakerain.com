describe("Home Page", () => {
  it("successfully loads", () => {
    cy.visit("/");
    cy.title().should("eq", "Blake Rain");
  });
});
