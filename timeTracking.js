var XMLHttpRequest = require('xmlhttprequest').XMLHttpRequest;
var fs = require('fs');

var estimatedMarker = 'Estimate:';
var actualMarker = 'Actual:';

var accessToken = undefined;
var repo = undefined;
var userOrOrganization = undefined;
var outputFile = undefined;

process.argv.forEach(function (val, index, array) {
  if (index === 2){
    userOrOrganization = val;
  }

  if (index === 3){
    repo = val;
  }

  if (index === 4){
    accessToken = val;
  }
});

if (!userOrOrganization){
  console.log('First argument for user or organization may not be null!');
  process.exit(1);
}

if (!repo){
  console.log('Second argument for repo name may not be null!');
  process.exit(1);
}

if (!accessToken){
  console.log('Third argument for user access token may not be null!');
  process.exit(1);
}

var xmlhttp = new XMLHttpRequest();
var url = 'https://api.github.com/repos/' + userOrOrganization +'/' + repo +'/issues?state=all&access_token=' + accessToken ;
var headers = 'no;created;title;labels;assignee;state;estimated;actual';

xmlhttp.onreadystatechange = function() {
    if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
        var tickets = JSON.parse(xmlhttp.responseText);
        if (!tickets || tickets.length === 0){
          console.log('No tickets found!');
        } else {
          var date = new Date();
          var y = date.getFullYear() - 2000;
          var m = ('0'+date.getMonth()).slice(-2);
          var d = ('0'+date.getDate()).slice(-2);
          var h = ('0'+date.getHours()).slice(-2);
          var n = ('0'+date.getMinutes()).slice(-2);
          outputFile = 'timeTracking_' + y + m + d + h + n + '.csv';
          parseTickets(tickets);
        }
    }
}
xmlhttp.open('GET', url, true);
xmlhttp.send();

function getLabels(labels){
  var result = '';
  if (labels && labels.length > 0){
    for (var i = 0; i < labels.length; i++) {
      result += labels[i].name;
      if (i < labels.length-1) {
        result += ',';
      }
    }
  }
  return result;
}

function getTimeTracking(marker, body) {
  var startIndex = body.indexOf(marker);
  if (startIndex === -1) {
    return '';
  }

  var endIndex = body.indexOf('\r\n', startIndex + marker.length);
  if (endIndex === -1){
    return body.substring(startIndex + marker.length);
  }

  return body.substring(startIndex + marker.length, endIndex);
}

function parseTickets(tickets) {
  fs.writeFileSync(outputFile, headers + '\r\n') ;

  for(i = 0; i < tickets.length; i++) {
    fs.appendFileSync(outputFile, tickets[i].number + ';');
    fs.appendFileSync(outputFile, tickets[i].created_at + ';');
    fs.appendFileSync(outputFile, tickets[i].title + ';');
    fs.appendFileSync(outputFile, getLabels(tickets[i].labels) + ';');
    fs.appendFileSync(outputFile, tickets[i].assignee.login + ';');
    fs.appendFileSync(outputFile, tickets[i].state + ';');
    fs.appendFileSync(outputFile, getTimeTracking(estimatedMarker, tickets[i].body) + ';');
    fs.appendFileSync(outputFile, getTimeTracking(actualMarker, tickets[i].body) + '\r\n');
  }
}
