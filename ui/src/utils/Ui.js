// import $ from 'jquery';

export default class Ui {
  constructor () {
    this.gameElem = document.getElementById('game');
    this.connectionIndicator = document.getElementById('connection-indicator');
    this.commandIndicator = document.getElementById('command-indicator');
    this.alertElem = document.getElementById('alert');
    this.agentFocus = document.getElementById('agent-focus');
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

  setAgentFocus = (enable) => {
    if (enable) {
      this.agentFocus.innerHTML = "Agent focus enabled. Mouse drag disabled. Press 'F' to toggle.";
      this.gameElem.setAttribute('class', 'drag-disabled');
      // $('#game').removeClass('drag-enabled').addClass('drag-disabled');
    } else {
      this.agentFocus.innerHTML = "Agent focus disabled. Use mouse to drag map. Press 'F' to enable focus on agent.";
      this.gameElem.setAttribute('class', 'drag-enabled');
      // $('#game').removeClass('drag-disabled').addClass('drag-enabled');
    }
  };
}
