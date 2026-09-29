# Database Design

The system follows a relational design with primary keys, foreign keys,
unique constraints, check constraints, indexes, views, functions, and triggers.

## Core Relationships
- Department 1:N Alumni
- User 1:1 Alumni
- Alumni M:N Events through Event Registrations
- Company 1:N Jobs
- Alumni 1:N Job Applications
- Alumni M:N Alumni through Mentorship
- Alumni 1:N Donations

## Normalization
The schema should be maintained at least up to Third Normal Form (3NF),
avoiding repeating groups and unnecessary transitive dependencies.
