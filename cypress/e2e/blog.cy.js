describe("Blog Posts", () => {
  it("successfully loads", () => {
    cy.visit("/blog");
    cy.title().should("eq", "Blake Rain's Blog");
  });
});
