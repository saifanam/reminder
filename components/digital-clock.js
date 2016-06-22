
var DigitalClock = React.createClass({
  render: function() {
    return (
      <span>
        <span className="clock-hours" />
        <span className="colon">:</span>
        <span className="clock-minutes" />
        <span className="colon">:</span>
        <span className="clock-seconds" />
      </span>
      );
  }
});

ReactDOM.render(<DigitalClock />, document.getElementById('digital-clock'));

var clockHours = document.querySelector('.clock-hours');
var clockMinutes = document.querySelector('.clock-minutes');
var clockSeconds = document.querySelector('.clock-seconds');
var date, hours, minutes, seconds;

(function () { 
  var clock = function () {
    clearTimeout(timer);

    date = new Date();    
    hours = date.getHours();
    minutes = date.getMinutes();
    seconds = date.getSeconds();

    var timer = setTimeout(clock, 1000);

    hours = Math.floor(hours);
    hours = (hours < 10) ? '0' + hours : hours;

    minutes = Math.floor(minutes);
    minutes = (minutes < 10) ? '0' + minutes : minutes;

    seconds = Math.floor(seconds);
    seconds = (seconds < 10) ? '0' + seconds : seconds;

    clockHours.innerHTML = hours;
    clockMinutes.innerHTML = minutes;
    clockSeconds.innerHTML = seconds;

  };
  clock();
})();
