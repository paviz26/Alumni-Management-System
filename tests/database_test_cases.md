# Database Test Cases

| Test | Expected Result |
|---|---|
| Insert duplicate email | Rejected by UNIQUE constraint |
| Invalid role | Rejected by CHECK constraint |
| Delete department with alumni | Alumni department becomes NULL |
| Duplicate event registration | Rejected |
| Negative donation | Rejected |
| Invalid mentorship self-pair | Rejected |
| Invalid graduation year | Trigger raises exception |
