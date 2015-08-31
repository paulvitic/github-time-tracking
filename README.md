# GitHub time tracking
A simple way to report time tracking from GitHub issues.
Uses the [GitHub issue API](https://developer.github.com/v3/issues/).

If issue description includes the following **separate** lines,

    Estimate:1
    Actual:2

then running the script will produce a csv file with the following content format

 no | created | title | labels | assignee | state | estimate | actual
 ----- | ----- | ----- | ----- | ----- | ----- | -----:| -----:
 3 | 2015-08-27T19:59:44Z | Some issue title | enhancement | some_user | open | 3 |
 2 | 2015-08-27T19:56:39Z | Another issue title | enhancement,question | some_user | closed | 1 | 1
 1 | 2015-08-27T17:47:20Z | Yet another issue title | bug | another_user | closed | 1.5 | 2

## Usage

Requires node.js and npm installed.

Clone the repository into a local folder and issue the following commands in the
folder.

    npm install xmlhttprequest
    npm install fs

Issue the following command to run the script

    node timeTracking.js [user name|organization name] [repository name] [user access token]
