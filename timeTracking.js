var XMLHttpRequest = require('xmlhttprequest').XMLHttpRequest;
var fs = require('fs');

var estimateMarker = 'Estimate:';
var actualMarker = 'Actual:';

var accessToken = undefined;
var repo = undefined;
var userOrOrganization = undefined;

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

var tickets = [];
var currentPage = 1;
var totalPages = undefined;
var nextPage = true;
var headers = 'no;created;title;milestone;labels;assignee;state;estimate;actual';

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
    return body.substring(startIndex + marker.length).trim();
  }

  return body.substring(startIndex + marker.length, endIndex).trim();
}

function getOutputFile() {
  var date = new Date();
  var y = date.getFullYear() - 2000;
  var m = ('0'+date.getMonth()).slice(-2);
  var d = ('0'+date.getDate()).slice(-2);
  var h = ('0'+date.getHours()).slice(-2);
  var n = ('0'+date.getMinutes()).slice(-2);
  var outputFile = 'timeTracking_' + y + m + d + h + n + '.csv';
  console.log("Output file is " + outputFile);
  return outputFile;
}

function parseTickets() {
  if (tickets.length === 0){
    console.log('No tickets found!');
  } else {
    var outputFile = getOutputFile();
    fs.writeFileSync(outputFile, headers + '\r\n') ;
    for(i = 0; i < tickets.length; i++) {
      if (!tickets[i].pull_request) {
        fs.appendFileSync(outputFile, tickets[i].number + ';');
        fs.appendFileSync(outputFile, tickets[i].created_at + ';');
        fs.appendFileSync(outputFile, tickets[i].title + ';');

        if (tickets[i].milestone) {
          fs.appendFileSync(outputFile, tickets[i].milestone.title + ';');
        } else {
          fs.appendFileSync(outputFile, '' + ';');
        }

        if (tickets[i].labels) {
          fs.appendFileSync(outputFile, getLabels(tickets[i].labels) + ';');
        } else {
          fs.appendFileSync(outputFile, '' + ';');
        }

        if (tickets[i].assignee) {
          fs.appendFileSync(outputFile, tickets[i].assignee.login + ';');
        } else {
          fs.appendFileSync(outputFile, '' + ';');
        }

        fs.appendFileSync(outputFile, tickets[i].state + ';');
        fs.appendFileSync(outputFile, getTimeTracking(estimateMarker, tickets[i].body) + ';');
        fs.appendFileSync(outputFile, getTimeTracking(actualMarker, tickets[i].body) + '\r\n');
      }
    }
  }
  process.exit(0);
}

function parseLinkHeader(header){
  var linkHeaders = header.split(",");
  for(var index in linkHeaders) {
    var linkHeader = linkHeaders[index].trim();
    //console.log(linkHeader);
    if (linkHeader.indexOf('last') !== -1) {
      totalPages = linkHeader.substring(linkHeader.indexOf('page=') + 5, linkHeader.indexOf('>'));
      console.log("Total pages " + totalPages);
      break;
    }
  }
}

function sendNextRequest(){
  var xmlhttp = new XMLHttpRequest();
  xmlhttp.onreadystatechange = function() {
    if (xmlhttp.readyState == 4){
      if (xmlhttp.status == 200) {
        if (!totalPages){
          parseLinkHeader(xmlhttp.getResponseHeader('link'));
        }

        console.log("Parsing page " + currentPage);
        tickets = tickets.concat(JSON.parse(xmlhttp.responseText));

        if (totalPages && currentPage < totalPages){
          currentPage++;
          sendNextRequest();
        } else {
          parseTickets();
        }
      } else {
        console.log("Unexpected HTTP response code "+ xmlhttp.status);
      }
    }
  };
  var url = 'https://api.github.com/repos/' +
      userOrOrganization + '/' + repo + '/issues' +
      '?state=all' +
      '&access_token=' + accessToken +
      '&page=' + currentPage ;
  xmlhttp.open('GET', url, true);
  xmlhttp.send();
}

sendNextRequest();
