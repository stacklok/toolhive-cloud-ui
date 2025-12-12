Feature: Catalog page

  Scenario: View catalog page header
    Given I am logged in
    And I am on "/catalog"
    Then I should see an "MCP Server Catalog" heading
