/*
  # Remove User Roles and User Invitations System

  1. Drops
    - Drop `user_details` view (depends on user_roles)
    - Drop `user_invitations` table
    - Drop `user_roles` table
    - Drop related functions:
      - `get_user_details()`
      - `delete_user()`
      - `reset_user_password()`
      - `update_user_last_active()`

  2. Notes
    - This simplifies the authentication system
    - All users will now have equal access
    - Admin functionality will need to be handled differently in the application
*/

-- Drop the view first (depends on the function)
DROP VIEW IF EXISTS user_details;

-- Drop functions
DROP FUNCTION IF EXISTS get_user_details();
DROP FUNCTION IF EXISTS delete_user(uuid);
DROP FUNCTION IF EXISTS reset_user_password(uuid, text);
DROP FUNCTION IF EXISTS update_user_last_active();

-- Drop tables
DROP TABLE IF EXISTS user_invitations;
DROP TABLE IF EXISTS user_roles;
