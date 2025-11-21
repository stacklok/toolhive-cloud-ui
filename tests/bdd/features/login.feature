Feature: Login flow

  Scenario: Sign in and land on Catalog
    Given I am on "/signin"
    When I click the "Okta" button
    Then I should be on "/catalog"
    And I should see a heading "MCP Server Catalog"

