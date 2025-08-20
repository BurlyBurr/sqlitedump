# Bun script to dump the data of your SQLite database

SQLite is great but it does fall short when dealing with an evolving
schema.

Assuming you keep your schema in a text file as CREATE TABLE and
CREATE INDEX statements, I had planned on just dumping out the data,
blowing away and recreating the database, and importing the data back.

You can dump with `.dump --data-only --nosys` but that doesn't include
column names, so no problem, I figured I'd just append columns and
never rearrange them. Turns out even that doesn't work -- the INSERT
statements fail due to column length mismatch, even if the new columns
are nullable.

So then you go to stackoverflow and see a 14 year old question
with some awk or perl code you can paste in. Who can even read awk
code? No thanks.

So here is a JS utility to be run with bun that dumps out all your
data including column names. Run it with:

    bunx sqlitedump mydb.sqlite

Note: Bun's SQLite adapter doesn't seem to distinquish between NULL
and empty string. Any NULL text fields will be upgraded to empty string.

Alternatives considered: ActiveRecord from Ruby on Rails talks to SQLite
databases, maybe you could use just the migration features without the
MVC stuff. Seems like overkill though.

Currently this lets you rearrange columns and add new columns. In future
this library may be extended to handle column renaming and column
deletion.

New in version 1.1: Columns that match the default are omitted. This means
if you clear out all the data for a column, you can go ahead and remove
it from your schema.

This requires bun because it's dependency-free and leverages the SQLite
features of the bun standard library.
