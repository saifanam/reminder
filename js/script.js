
var app = {

  addClass: function(el, className) {
    if (el.classList) el.classList.add(className);
    else if (!hasClass(el, className)) el.className += ' ' + className;
  },

  removeClass: function(el, className) {
    if (el.classList) el.classList.remove(className);
    else el.className = el.className.replace(new RegExp('\\b'+ className+'\\b', 'g'), '');
  },

  getUUID: function() {
   var d = new Date().getTime();
   if(window.performance && typeof window.performance.now === "function") {
        d += performance.now(); //use high-precision timer if available
      }
      //attaching an alaphabet since ID names starting with numbers can't be parsed by querySelector
      var uuid = 'i-xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = (d + Math.random()*16)%16 | 0;
        d = Math.floor(d/16);
        return (c=='x' ? r : (r&0x3|0x8)).toString(16);
      });
      return uuid;
    },

    playAlarm: function(alarmItem, currentDiff, index) {

      if(alarmItem.repeatAfter != 0) {
        itemsTimeOut[index] = setTimeout(function() { 

          app.soundAlarm(alarmItem.alarmLabel);
          app.playAlarm(alarmItem, alarmItem.repeatAfter, index);

        }, currentDiff);
      }

      else if(alarmItem.repeatAfter == 0 && alarmItem.alarmTime > (new Date()).getTime()) {
        itemsTimeOut[index] = setTimeout(function() { 
          app.soundAlarm(alarmItem.alarmLabel);
        }, currentDiff);
      }      
    },

    soundAlarm: function(alarmText) {

      var alarmOverlay = document.querySelector('#alarm-overlay');
      app.addClass(alarmOverlay, 'alarm-playing');

      var overlayText = document.querySelector('#overlay-text');
      overlayText.innerHTML = alarmText;

      var alarmAudio = new Audio('../sounds/bop.mp3');
      alarmAudio.play();

      var overlayCloser = document.querySelector('#overlay-closer');
      overlayCloser.addEventListener('click', function() {
        app.removeClass(alarmOverlay, 'alarm-playing');
        alarmAudio.pause();
      });
    },

    refreshAlarms: function() {
      for(var i=0; i < itemsTimeOut.length; i++) {
        clearTimeout(itemsTimeOut[i]);
      }

      for(var i=0; i < alarmList.length; i++) {
        app.playAlarm(alarmList[i], alarmList[i].currentDiff, i);
      }

      Lockr.set('alarmList', alarmList);
      Lockr.set('itemsTimeOut', itemsTimeOut);

    },

    addAlarm: function(alarmItem) {
      alarmList.push(alarmItem);
      app.refreshAlarms();
    },

    removeAlarm: function(alarmID) {
      for(var i=0; i < alarmList.length; i++) {
        if(alarmList[i]._id == alarmID) {
          alarmList.splice(i, 1);
          break;
        }
      }
      if(alarmList.length == 0) {
        Lockr.flush();
      }      
      app.refreshAlarms();
    },

    editAlarm: function(alarmID, alarmItem) {
      for(var i=0; i < alarmList.length; i++) {
        if(alarmList[i]._id == alarmID) {
          alarmList.splice(i, 1, alarmItem);
          break;
        }
      }
      app.refreshAlarms();
    },

    loadAlarms: function() {  

      var lockrArray = Lockr.get('alarmList');
      var timeOutArray = Lockr.get('itemsTimeOut');

      if(lockrArray != undefined && lockrArray.length > 0) {

        for(var i=0; i < lockrArray.length; i++) {
          alarmList.push(lockrArray[i]);
          alarmList[i].currentDiff = alarmList[i].alarmTime - (new Date()).getTime();
          itemBox.innerHTML += '<div class="content-item" id="' + lockrArray[i]._id + '" onclick="itemClicked(this);"> <p class="item-time"> <span class="item-hours">' + lockrArray[i].timeHours + '</span>:<span class="item-minutes">' + app.timeFormatter(lockrArray[i].timeMinutes) + '</span> </p><p class="item-repeat">' + lockrArray[i].repeatAfterText + '</p><p class="item-label">' + lockrArray[i].alarmLabel + '</p></div>';
        }

        if(timeOutArray != undefined && timeOutArray.length > 0) {
          for(var i=0; i < timeOutArray.length; i++) {
            itemsTimeOut.push(timeOutArray[i]);
          }
        }
        app.refreshAlarms();
      }
      else {              
        Lockr.flush();
      }

    },
    
    getTextValue: function(elem) {
      return elem.value;
    },

    getRepeatAfter: function(value) {
      if(value == 'once') 
        return 0;

      else if(value == 'hourly') 
        return 3600000;

      else if(value == 'daily')
        return 86400000;

      else if(value == 'weekly')
        return 604800000;

      else if(value == 'monthly')
        return 2592000000;

      else if(value == 'yearly')
        return 31536000000;
    },

    isTimeValid: function(hh, mm) {
      if(hh < 0 || hh > 23)
        return false;

      else if(mm < 0 || mm > 59) 
        return false;

      else if(hh < (new Date).getHours()) 
        return false;

      else 
        return true;
    },

    timeFormatter: function(value) {
      // to account for the case when user enters multiple zeros
      // to prevent them from getting appended to string
      value = parseInt(value);
      if(value < 10) 
        return '0' + value;      
      else 
        return value;
    }
    
  }

  var contentItems = document.querySelectorAll('.content-item');
  var itemBox = document.querySelector('#item-box');
  var closeClickFromEdit = true;
  var alarmList = [];
  var itemsTimeOut = [];
  var currentID;

  function itemClicked(currentItem) {

    closeClickFromEdit = true;
    currentID = currentItem.getAttribute('id');

    var detailBox = document.querySelector('#detail-box');
    var timeHours = document.querySelector('#time-hours');
    var timeMinutes = document.querySelector('#time-minutes');
    var timeBox = document.querySelector('#time-box');
    var repeatBox = document.querySelector('#repeat-box');
    var labelBox = document.querySelector('#label-box');

    app.addClass(detailBox, 'open');
    app.addClass(itemCloser, 'open');
    app.addClass(itemDelete, 'open');

    app.addClass(timeBox, 'open');
    app.addClass(repeatBox, 'open');
    app.addClass(labelBox, 'open');

  //populate the clicked item's data into the fields
  var currentHours = currentItem.getElementsByClassName('item-hours')[0].textContent;
  var currentMinutes = currentItem.getElementsByClassName('item-minutes')[0].textContent;
  var currentRepeat = currentItem.getElementsByClassName('item-repeat')[0].textContent;
  var currentLabel = currentItem.getElementsByClassName('item-label')[0].textContent;

  labelBox.getElementsByTagName('input')[0].value = currentLabel;
  timeHours.value = currentHours;
  timeMinutes.value = parseInt(currentMinutes);
  repeatBox.getElementsByTagName('select')[0].value = currentRepeat;
}

var itemCloser = document.querySelector('#item-closer');
itemCloser.addEventListener('click', function() {

  var detailBox = document.querySelector('#detail-box');

  var timeBox = document.querySelector('#time-box');
  var timeHours = document.querySelector('#time-hours').value;
  var timeMinutes = document.querySelector('#time-minutes').value;

  var labelBox = document.querySelector('#label-box');
  var timeLabel = labelBox.getElementsByTagName('input')[0].value;

  var repeatBox = document.querySelector('#repeat-box');
  var selectTextValue = app.getTextValue(repeatBox.getElementsByTagName('select')[0]);
  var selectNumberValue = app.getRepeatAfter(selectTextValue);

  //make edits to the item in the list view and the associated data
  //flag to check if close is for edit or for add. If it's edit, existing values to be modified.
  //If not, detail box has to be simply closed without any data changes

  if(closeClickFromEdit) {
    // edit box closing, so update data in this case
    
     // test if time is valid and that is in future
     if(timeHours && timeMinutes && timeLabel && app.isTimeValid(timeHours, timeMinutes)) { 

       app.removeClass(detailBox, 'open');
       app.removeClass(itemCloser, 'open');
       app.removeClass(itemDelete, 'open');
       app.removeClass(itemDone, 'open');

       app.removeClass(timeBox, 'open');
       app.removeClass(repeatBox, 'open');
       app.removeClass(labelBox, 'open');

       var date = new Date();
       var currentTime = date.getTime();

       var alarmTime = new Date(date.getFullYear(), date.getMonth(), date.getDate(), timeHours, timeMinutes);
       alarmTime = alarmTime.getTime();

       var currentDiff = alarmTime - currentTime;

       var currentAlarm = {
        '_id': currentID,
        'repeatAfter': selectNumberValue,
        'repeatAfterText': selectTextValue,
        'timeHours': timeHours,
        'timeMinutes': timeMinutes,
        'alarmTime': alarmTime,
        'currentDiff': currentDiff,
        'alarmLabel': timeLabel
      }

      app.editAlarm(currentID, currentAlarm);

      var editedItem = document.querySelector('#' + currentID);
      editedItem.getElementsByClassName('item-hours')[0].innerHTML = timeHours;
      editedItem.getElementsByClassName('item-minutes')[0].innerHTML = timeMinutes;
      editedItem.getElementsByClassName('item-repeat')[0].innerHTML = selectTextValue;
      editedItem.getElementsByClassName('item-label')[0].innerHTML = timeLabel;

    }

    else {
      alert('Enter proper values!');
    }

  }

  else {
    // add box closing
    // don't do data updation in this case, simply close the detail box
    app.removeClass(detailBox, 'open');
    app.removeClass(itemCloser, 'open');
    app.removeClass(itemDelete, 'open');
    app.removeClass(itemDone, 'open');

    app.removeClass(timeBox, 'open');
    app.removeClass(repeatBox, 'open');
    app.removeClass(labelBox, 'open');
  }

});


var itemDelete = document.querySelector('#item-delete');
itemDelete.addEventListener('click', function() {

  var deleteConfirm = confirm('Sure you wanna delete?');
  if(deleteConfirm) {
    var detailBox = document.querySelector('#detail-box');
    var timeBox = document.querySelector('#time-box');
    var repeatBox = document.querySelector('#repeat-box');
    var labelBox = document.querySelector('#label-box');

    app.removeClass(detailBox, 'open');
    app.removeClass(itemCloser, 'open');
    app.removeClass(itemDelete, 'open');

    app.removeClass(timeBox, 'open');
    app.removeClass(repeatBox, 'open');
    app.removeClass(labelBox, 'open');

  //also remove the item from the list view and the associated data
  var itemToDelete = document.getElementById(currentID);
  itemToDelete.remove();
  app.removeAlarm(currentID);
}

});

var itemDone = document.querySelector('#item-done');
itemDone.addEventListener('click', function() {

  //add the newly created item into the list and the array

  var detailBox = document.querySelector('#detail-box');

  var timeBox = document.querySelector('#time-box');
  var timeHours = document.querySelector('#time-hours').value;
  var timeMinutes = document.querySelector('#time-minutes').value;
  var labelBox = document.querySelector('#label-box');
  var timeLabel = labelBox.getElementsByTagName('input')[0].value;

  var repeatBox = document.querySelector('#repeat-box');
  var selectTextValue = app.getTextValue(repeatBox.getElementsByTagName('select')[0]);
  var selectNumberValue = app.getRepeatAfter(selectTextValue);
  
  var timeID = app.getUUID();

  // test if time is valid and that is in future
  if(timeHours && timeMinutes && timeLabel && app.isTimeValid(timeHours, timeMinutes)) { 

    app.removeClass(detailBox, 'open');
    app.removeClass(itemDone, 'open');
    app.removeClass(itemCloser, 'open');

    app.removeClass(timeBox, 'open');
    app.removeClass(repeatBox, 'open');
    app.removeClass(labelBox, 'open');

    itemBox.innerHTML += '<div class="content-item" id="' + timeID + '" onclick="itemClicked(this);"> <p class="item-time"> <span class="item-hours">' + timeHours + '</span>:<span class="item-minutes">' + app.timeFormatter(timeMinutes) + '</span> </p><p class="item-repeat">' + selectTextValue + '</p><p class="item-label">' + timeLabel + '</p></div>';

    var date = new Date();
    var currentTime = date.getTime();

    var alarmTime = new Date(date.getFullYear(), date.getMonth(), date.getDate(), timeHours, timeMinutes);
    alarmTime = alarmTime.getTime();

    var currentDiff = alarmTime - currentTime;

    var currentAlarm = {
      '_id': timeID,
      'repeatAfter': selectNumberValue,
      'repeatAfterText': selectTextValue,
      'timeHours': timeHours,
      'timeMinutes': timeMinutes,
      'alarmTime': alarmTime,
      'currentDiff': currentDiff,
      'alarmLabel': timeLabel
    }

    app.addAlarm(currentAlarm);

  }

  else {
    alert('Enter proper values!');
  }
});

var itemAdder = document.querySelector('#item-adder');
itemAdder.addEventListener('click', function() {

  closeClickFromEdit = false;

  //clear the forms
  var detailBox = document.querySelector('#detail-box');

  var timeBox = document.querySelector('#time-box');
  var timeHours = document.querySelector('#time-hours');
  var timeMinutes = document.querySelector('#time-minutes');

  var repeatBox = document.querySelector('#repeat-box');
  var labelBox = document.querySelector('#label-box');
  
  labelBox.getElementsByTagName('input')[0].value = '';
  timeHours.value = '';
  timeMinutes.value = '';
  repeatBox.getElementsByTagName('select')[0].value = 'once';

  app.addClass(detailBox, 'open');
  app.addClass(itemDone, 'open');
  app.addClass(itemCloser, 'open');

  app.addClass(timeBox, 'open');
  app.addClass(repeatBox, 'open');
  app.addClass(labelBox, 'open');

});

app.loadAlarms();

