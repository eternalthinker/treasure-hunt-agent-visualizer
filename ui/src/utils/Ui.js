
export default class Ui {
  constructor () {
    this.connectionIndicator = document.getElementById('connection-indicator');
    this.commandIndicator = document.getElementById('command-indicator');
    this.alertElem = document.getElementById('alert');
  }

  notifyDisconnection = () => {
    this.connectionIndicator.innerHTML = 'Disconnected! The server has probably stopped.';
  };

  setCommandIndicator = (waiting) => {
    const text = waiting ? 'Awaiting new command...' : ' ';
    this.commandIndicator.innerHTML = text;
  };

  reloadWindow = () => {
    location.reload(true);
  }

  alert = (message) => {
    this.alertElem.innerHTML = message;
    setTimeout(() => {
      this.alertElem.innerHTML = '';
    }, 3000);
  }
}
