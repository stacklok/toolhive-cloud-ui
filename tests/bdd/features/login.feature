Feature: Login flow

  Scenario: Sign in and land on Catalog
    Given I am on "/signin"
    When I click on the "Okta" button
    Then I should be on "/catalog"
    And I should see a heading "MCP Server Catalog"

  Scenario: Log out from Catalog
    Given I am on "/signin"
    When I click on the "Okta" button
    Then I should be on "/catalog"
    When I click on the "Test User" button
    And I click on the "Sign out" menu item
    Then I should be on "/signin"
